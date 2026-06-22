import { LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import {MongoDBSessionStorage} from '@shopify/shopify-app-session-storage-mongodb';
import { restResources } from "@shopify/shopify-api/rest/admin/2023-04";
import { join } from "path";
import dotenv from "dotenv";

dotenv.config({ path: join(process.cwd(), '../.env') });


const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    hostName: process.env.HOST.replace(/https?:\/\//, ""),
    scopes: process.env.SCOPES.split(","),
    // Shopify Managed Pricing: plans are defined in the Partner Dashboard (handles
    // free/premium/unlimited). No in-code billing config; check payments via the flag.
    future: { unstable_managedPricingSupport: true },
  },
  auth: {
    path: "/api/auth",
    callbackPath: "/api/auth/callback",
  },
  webhooks: {
    path: "/api/webhooks",
  },
  // This should be replaced with your preferred storage strategy
  sessionStorage: new MongoDBSessionStorage(
    process.env.MONGO_URI || "mongodb://127.0.0.1:27017",
    process.env.MONGO_DB_NAME || "shopify_sessions"
  ),
});

export default shopify;
