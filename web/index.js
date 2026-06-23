// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import { RequestedTokenType } from "@shopify/shopify-api";
import productCreator from "./product-creator.js";
import cancelSubscription from "./cancel-subscription.js";
import crypto from "crypto";
import dotenv from "dotenv";

import createDbConnection  from './analytics-db.js'; // Database initialization
import { connectToMongoDB } from "./mongodb.js"; // Import the MongoDB utility

dotenv.config({ path: join(process.cwd(), '../.env') });

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Keep the process alive on unexpected async errors. A single failing Shopify API
// call (e.g. a 403) must surface as a clean JSON error, never crash the container
// (which makes the proxy return 502s). describeShopifyError is hoisted below.
process.on("unhandledRejection", (reason) => {
  console.error("⚠️ Unhandled promise rejection:", describeShopifyError(reason));
});
process.on("uncaughtException", (err) => {
  console.error("⚠️ Uncaught exception:", describeShopifyError(err));
});

// This app has no app-specific webhooks, and its mandatory compliance webhooks are
// declared in the app config (`compliance_topics`) — i.e. managed declaratively.
// The library's OAuth callback unconditionally calls api.webhooks.register(), which
// first runs a `webhookSubscriptions` GraphQL query. Shopify returns 403 for webhook
// API access when webhooks are config-managed, and that thrown 403 aborts OAuth
// (install loop). Every other GraphQL call (billing, metafields) works fine, so we
// make runtime webhook registration a no-op to let OAuth complete.
shopify.api.webhooks.register = async () => ({});

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  // Ensure scope is saved to the session after OAuth
  async (_req, res, next) => {
    try {
      const session = res.locals?.shopify?.session;
      if (session && !session.scope) {
        session.scope = process.env.SCOPES;
        await shopify.config.sessionStorage.storeSession(session);
        console.log(`✅ Fixed missing scope for ${session.shop}`);
      }
    } catch (e) {
      console.error("Scope fix error:", e.message);
    }
    next();
  },
  shopify.redirectToShopifyOrAppRoot()
);
// Mandatory GDPR/compliance webhooks (customers/data_request, customers/redact,
// shop/redact) are declared in the app config (toml `compliance_topics`) and are
// delivered automatically by Shopify — they must NOT be registered via the Admin
// API. Registering customer topics on an app without Protected Customer Data Access
// returns HTTP 403, which aborts OAuth. So we simply receive them here, verify the
// HMAC, and acknowledge with 200. (Registry stays empty → OAuth no longer 403s.)
app.post(
  shopify.config.webhooks.path,
  express.raw({ type: "*/*" }),
  (req, res) => {
    try {
      const hmac = req.get("X-Shopify-Hmac-Sha256") || "";
      const digest = crypto
        .createHmac("sha256", process.env.SHOPIFY_API_SECRET)
        .update(req.body) // raw Buffer
        .digest("base64");
      const ok =
        hmac.length === digest.length &&
        crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(digest));
      if (!ok) {
        console.warn("⚠️ Webhook HMAC validation failed");
        return res.status(401).send();
      }
      console.log(
        `✅ Compliance webhook received: ${req.get("X-Shopify-Topic")} for ${req.get(
          "X-Shopify-Shop-Domain"
        )}`
      );
      return res.status(200).send();
    } catch (e) {
      console.error("Webhook handler error:", e.message);
      return res.status(401).send();
    }
  }
);

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js


// Billing API plan names (must match the keys in web/shopify.js billingConfig).
const BASIC_PLAN = "Basic";
const PREMIUM_PLAN = "Premium";
const Custom_app = "custom";
const PREMIUM_PLAN_KEY = "scroll-2-top-premium";
const IS_TEST = true; // Use true for testing billing in Development
const APP_NAME = "TopJet";
const HTTP_STATUS = { OK: 200, BAD_REQUEST: 400, UNAUTHORIZED: 401, INTERNAL_SERVER_ERROR: 500 };

app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Handles URL-encoded data


app.get("/api/scroll-to-top/hasSubscription", async (req, res) => {
  try {
 
    const { shop } = req.query;

    if (!shop) {
      console.warn("Missing 'shop' parameter in request");
      return res.status(400).send({ error: "Missing 'shop' parameter" });
    }

  
    const collection = await connectToMongoDB();
    const session = await collection.findOne({ shop });

    if (!session) {
      console.warn(`No session found for shop: ${shop}`);
      return res.status(401).send({ error: "Unauthorized: Session not found" });
    }

    const tier = await getPlanTier(session);
 

    return res.status(200).send({
      hasActiveSubscription: tier !== "free",
      tier, // free | premium | unlimited
    });
  } catch (error) {
    console.error("Error in hasSubscription:", error.message);
    return res.status(500).send({ error: "Failed to fetch subscription" });
  }
});

/* ---------------------- Subscription Utilities ---------------------- */

// Extract the meaningful detail from a Shopify HttpResponseError so logs show the
// real reason (e.g. WHY a request was forbidden) instead of "[Object]".
function describeShopifyError(error) {
  try {
    const body = error?.response?.body ?? error?.body;
    const detail = body?.errors ?? body ?? error?.message ?? error;
    return typeof detail === "string" ? detail : JSON.stringify(detail);
  } catch {
    return error?.message || String(error);
  }
}

// Managed Pricing: billing.check() returns the shop's active app subscriptions; the
// subscription's `name` is the plan handle (free / premium / unlimited) set in the
// Billing API: check active recurring charges against the code-defined plans.
async function getPlanTier(session) {
  try {
    const hasPremium = await shopify.api.billing.check({
      session,
      plans: [PREMIUM_PLAN],
      isTest: IS_TEST,
    });
    if (hasPremium) return "premium";

    const hasBasic = await shopify.api.billing.check({
      session,
      plans: [BASIC_PLAN],
      isTest: IS_TEST,
    });
    if (hasBasic) return "basic";

    return "free";
  } catch (error) {
    console.error("Error checking plan tier:", describeShopifyError(error));
    return "free";
  }
}

/* ---------------------- Analytics Event Logging ---------------------- */

// Modern token-exchange auth. The legacy OAuth flow issues NON-expiring offline
// tokens, which Shopify's Admin API now rejects with a 403. Instead, exchange the
// App Bridge session token for a fresh EXPIRING offline token on demand, and cache
// it (overwriting any rejected non-expiring token) until it expires.
async function authenticateApiRequest(req, res, next) {
  try {
    const authHeader = req.get("Authorization") || "";
    const sessionToken = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    if (!sessionToken) {
      // No session token yet — tell App Bridge to retry with one.
      res.status(401).setHeader("X-Shopify-Retry-Invalid-Session-Request", "1");
      return res.send();
    }

    const payload = await shopify.api.session.decodeSessionToken(sessionToken);
    const shop = new URL(payload.dest).hostname;

    // Reuse a stored offline session only if it's an expiring token still in date.
    const offlineId = shopify.api.session.getOfflineId(shop);
    let session = await shopify.config.sessionStorage.loadSession(offlineId);
    const stillValid =
      session &&
      session.accessToken &&
      session.expires &&
      new Date(session.expires) > new Date();

    if (!stillValid) {
      const result = await shopify.api.auth.tokenExchange({
        shop,
        sessionToken,
        requestedTokenType: RequestedTokenType.OfflineAccessToken,
      });
      session = result.session;
      await shopify.config.sessionStorage.storeSession(session);
      console.log(`🔑 Minted offline token for ${shop} (expires=${session.expires})`);
    }

    res.locals.shopify = { session };
    return next();
  } catch (e) {
    console.error("Auth (token exchange) failed:", describeShopifyError(e));
    res.status(401).setHeader("X-Shopify-Retry-Invalid-Session-Request", "1");
    return res.send();
  }
}

app.use("/api/*", authenticateApiRequest);

/* ---------------------- Utility Functions ---------------------- */
const handleError = (res, statusCode, message) => {
  console.error(message);
  res.status(statusCode).send({ error: message });
};

async function storeShopDetails(shopDetails) {
  try {
    const response = await fetch(
       // Send shop installation details to external analytics or data storage API,
""
    ,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(shopDetails),
      }
    );
    if (!response.ok) throw new Error("Network response was not ok.");

  } catch (error) {
    console.error("Failed to store shop details:", error.message);
  }
}

const shopDetailsQuery = `
{
  shop {
    name
    email
    primaryDomain { url host }
    plan { displayName }
  }
}`;

/* --------------------------- Subscription Routes -------------------------- */

// Create / Switch Subscription
app.get("/api/createSubscription", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const planParam = (req.query.plan || "").toString().toLowerCase();
    const planName = planParam === "premium" ? PREMIUM_PLAN : BASIC_PLAN;

    // Already subscribed to this plan?
    const hasPayment = await shopify.api.billing.check({
      session,
      plans: [planName],
      isTest: IS_TEST,
    });
    if (hasPayment) {
      return res.status(200).send({ isActiveSubscription: true, plan: planName });
    }

    // Create the recurring charge and hand back Shopify's approval URL.
    const confirmationUrl = await shopify.api.billing.request({
      session,
      plan: planName,
      isTest: IS_TEST,
    });
    console.log(`💳 createSubscription ${planName} → ${confirmationUrl}`);
    return res.status(200).send({
      isActiveSubscription: false,
      plan: planName,
      confirmationUrl,
    });
  } catch (error) {
    const detail = describeShopifyError(error);
    console.error("❌ Failed to create subscription:", detail);
    res.status(500).send({ error: "Failed to create subscription", detail });
  }
});

// Cancel Subscription
app.get("/api/cancelSubscription", async (req, res) => {
  try {
    const session = res.locals.shopify.session;

    const tier = await getPlanTier(session);

    if (tier !== "free") {
      const planToCancel = tier;
  

      const subscriptionStatus = await cancelSubscription(session);
      console.log(`✅ ${session.shop} subscription cancelled. Status: ${subscriptionStatus}`);

      // Remove app-owned metafield if present
      const client = new shopify.api.clients.Graphql({ session });
      const currentInstallations = await client.request(
        CURRENT_APP_INSTALLATION,
        { variables: { namespace: Custom_app, key: PREMIUM_PLAN_KEY } }
      );

      const installation = currentInstallations?.currentAppInstallation;
      const ownerId = installation?.id;
      const metafield = installation?.metafield;

      if (ownerId && metafield) {
        console.log(`🗑️ Removing appOwnedMetafield for shop: ${session.shop}`);
        const deleteResp = await client.request(
          APP_OWNED_METAFIELD_DELETE,
          { variables: { ownerId, namespace: Custom_app, key: PREMIUM_PLAN_KEY } }
        );

        const delErrors = deleteResp?.appOwnedMetafieldDelete?.userErrors || [];
        if (delErrors.length) {
          console.error("❌ Failed to delete metafield:", delErrors);
        } else {
          console.log(`✅ Metafield deleted successfully for shop: ${session.shop}`);
        }
      }

      // Downgrade after cancel
      if (["CANCELLED", "ACTIVE_CANCELLED"].includes(subscriptionStatus)) {

        // 👉 Add your downgrade logic here
      }

      return res.status(200).send({ status: subscriptionStatus, cancelledPlan: planToCancel });
    }

    res.status(200).send({ status: "No subscription found" });
  } catch (error) {
    const detail = describeShopifyError(error);
    console.error("❌ Failed to cancel subscription:", detail);
    res.status(500).send({ error: "Failed to cancel subscription", detail });
  }
});

// Check Active Subscription + ensure premium metafield
app.get("/api/hasActiveSubscription", async (_req, res) => {
  try {
    const session = res.locals.shopify.session;
    const tier = await getPlanTier(session);
    const hasActive = tier !== "free";


    if (!hasActive) {
      return res.status(200).send({ hasActiveSubscription: false });
    }

    const client = new shopify.api.clients.Graphql({ session });
    const currentInstallations = await client.request(
      CURRENT_APP_INSTALLATION,
      { variables: { namespace: Custom_app, key: PREMIUM_PLAN_KEY } }
    );

    const installation = currentInstallations?.currentAppInstallation;
    const ownerId = installation?.id;
    const existing = installation?.metafield;

    if (!existing && ownerId) {
      console.log(`🆕 Creating metafield for paid plan on shop: ${session.shop}`);
      const createResp = await client.request(
        CREATE_APP_DATA_METAFIELD,
        {
          variables: {
            metafieldsSetInput: [
              { namespace: Custom_app, key: PREMIUM_PLAN_KEY, type: "boolean", value: "true", ownerId },
            ],
          },
        }
      );

      const createErrors = createResp?.metafieldsSet?.userErrors || [];
      if (createErrors.length) {
        console.error("❌ Failed to add metafield:", createErrors);
      } else {
        console.log(`✅ Metafield created for shop: ${session.shop}`);
      }
    }

    res.status(200).send({ hasActiveSubscription: true, tier });
  } catch (error) {
    const detail = describeShopifyError(error);
    console.error("❌ Failed to fetch subscription:", detail);
    res.status(500).send({ error: "Failed to fetch subscription", detail });
  }
});


/* --------------------------- Helper for Plan Info --------------------------- */
function getOrderLimit(planTier) {
  switch (planTier) {
    case "unlimited":
      return Number.MAX_SAFE_INTEGER;
    case "premium":
      return 1000;
    default:
      return 100;
  }
}

async function getStoreId(session) {
  return session.shop || "unknown_store";
}

async function getCurrentOrderCount(storeId) {

  return 0; // replace with real count if needed
}

app.get("/api/scroll-to-top/plan-info", async (_req, res) => {
  try {
    const session = res.locals.shopify.session;
    const storeId = await getStoreId(session);

    const planTier = await getPlanTier(session);
    const orderLimit = getOrderLimit(planTier);
    const currentCount = await getCurrentOrderCount(storeId);
    const remaining = Math.max(0, orderLimit - currentCount);

    res.status(200).json({
      planTier,
      orderLimit,
      currentCount,
      remaining,
      canImportMore: remaining > 0,
    });
  } catch (error) {
    console.error("Failed to get plan info:", error);
    res.status(500).json({ error: "Failed to get plan information" });
  }
});

/* --------------------------- Misc APIs --------------------------- */
app.get("/api/getshop", async (req, res) => {
  try {
    const session = res.locals.shopify.session;
    const shopName = session ? session.shop : "Shop name not found";
    res.json({ shop: shopName });
  } catch (err) {
    console.error("Error fetching shop:", err);
    res.status(500).json({ error: "Failed to fetch shop" });
  }
});

app.get("/api/store-details", async (_req, res) => {
  const session = res.locals.shopify.session;
  if (!session) return handleError(res, HTTP_STATUS.UNAUTHORIZED, "No active session found.");
  try {
    const client = new shopify.api.clients.Graphql({ session });
    const response = await client.request(shopDetailsQuery);
    const shopData = (response?.shop ?? response?.data?.shop ?? response?.data) || {};
    const { name, email, primaryDomain, plan } = shopData;

    await storeShopDetails({
      appName: APP_NAME,
      storeUrl: primaryDomain?.url,
      name,
      email,
      plan: plan?.displayName,
    });

    res.status(HTTP_STATUS.OK).send({
      message: "Shop details fetched successfully",
      data: { name, email, primaryDomain, plan },
    });
  } catch (error) {
    handleError(
      res,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      `Failed to fetch store details: ${error.message}`
    );
  }
});

/* --------------------------- Serve Frontend --------------------------- */
app.use(shopify.cspHeaders());
app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(readFileSync(join(STATIC_PATH, "index.html")));
});

app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on http://0.0.0.0:${PORT}`));

/* --------------------------- GraphQL Queries --------------------------- */

// Read app-owned metafield on the app installation
const CURRENT_APP_INSTALLATION = `
  query appSubscription($namespace: String!, $key: String!) {
    currentAppInstallation {
      id
      metafield(namespace: $namespace, key: $key) {
        namespace
        key
        value
        id
      }
    }
  }
`;

// Create/Update app-owned metafield
const CREATE_APP_DATA_METAFIELD = `
  mutation CreateAppDataMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafieldsSetInput) {
      metafields { id namespace key }
      userErrors { field message }
    }
  }
`;

// Delete app-owned metafield (correct for app-owned metafields)
const APP_OWNED_METAFIELD_DELETE = `
  mutation appOwnedMetafieldDelete($ownerId: ID!, $namespace: String!, $key: String!) {
    appOwnedMetafieldDelete(ownerId: $ownerId, namespace: $namespace, key: $key) {
      deletedId
      userErrors { field message }
    }
  }
`;
