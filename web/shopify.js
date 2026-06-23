import { BillingInterval, LATEST_API_VERSION } from "@shopify/shopify-api";
import { shopifyApp } from "@shopify/shopify-app-express";
import {MongoDBSessionStorage} from '@shopify/shopify-app-session-storage-mongodb';
import { restResources } from "@shopify/shopify-api/rest/admin/2023-04";
import { join } from "path";
import dotenv from "dotenv";

dotenv.config({ path: join(process.cwd(), '../.env') });

// Code-based Billing API plans (free is just "no subscription").
const billingConfig = {
  "Basic": {
    amount: 10.0,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
  "Premium": {
    amount: 15.0,
    currencyCode: "USD",
    interval: BillingInterval.Every30Days,
  },
};

const shopify = shopifyApp({
  api: {
    apiVersion: LATEST_API_VERSION,
    restResources,
    apiKey: process.env.SHOPIFY_API_KEY,
    apiSecretKey: process.env.SHOPIFY_API_SECRET,
    hostName: process.env.HOST.replace(/https?:\/\//, ""),
    scopes: process.env.SCOPES.split(","),
    billing: billingConfig,
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
