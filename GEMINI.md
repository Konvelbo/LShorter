# LShorter - Project Guidelines & Conventions

## Overview
LShorter is an enterprise-grade URL shortener, link management, and real-time edge routing platform built with Next.js (App Router), Convex Cloud, Cloudflare Workers / D1, and Paddle Billing.

---

## Paddle Integration Conventions

When writing or modifying code that integrates with Paddle:

- **Official SDKs**:
  - Server-side (Node.js / Next.js API routes): `@paddle/paddle-node-sdk`
  - Client-side (React / Next.js): `@paddle/paddle-js`
- **Environment & Safety**:
  - All local development and staging environments use the **Sandbox** environment by default (`Environment.sandbox`).
  - Sandbox API keys contain `_sdbx`.
  - Sandbox client-side tokens are prefixed with `test_`.
  - Production environment is only enabled when `NEXT_PUBLIC_PADDLE_ENVIRONMENT="production"`.
- **Environment Variables**:
  - `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`: Paddle client token for Paddle.js (`test_...` in sandbox, `live_...` in production).
  - `NEXT_PUBLIC_PADDLE_ENVIRONMENT`: `"sandbox"` or `"production"`.
  - `PADDLE_API_KEY`: Server-side API key (`paddler_..._sdbx...` in sandbox).
  - `PADDLE_WEBHOOK_SECRET_KEY`: Webhook endpoint secret key (`pdl_ntfset_...`).
  - Price IDs:
    - `NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY`
    - `NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY`
    - `NEXT_PUBLIC_PADDLE_PRICE_BUSINESS_MONTHLY`
    - `NEXT_PUBLIC_PADDLE_PRICE_BUSINESS_YEARLY`
    - `NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE_MONTHLY`
    - `NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE_YEARLY`
  - Never inline credentials or secrets into source code or repository commits.
- **Webhook Signature Verification**:
  - Always verify webhook signatures on incoming requests before acting on the payload:
    ```ts
    const eventData = await paddle.webhooks.unmarshal(rawRequestBody, secretKey, signatureHeader);
    ```
  - Unmarshaled events are strongly typed (e.g. `EventName.TransactionCompleted`, `EventName.SubscriptionCreated`, `EventName.SubscriptionUpdated`, `EventName.SubscriptionCanceled`).
- **MCP Servers & Tool Usage**:
  - Check current Paddle documentation via the `paddle-docs` MCP server when applicable.
  - Use `paddle-sandbox` by default. Only call `paddle-live` when explicitly directed for production operations.
  - Always request confirmation before performing destructive account operations (e.g. archiving products, deleting prices, canceling subscriptions).
- **Billing & Refund Policy**:
  - LShorter maintains a strict **All Sales Are Final / No-Refund** policy for digital edge infrastructure and subscriptions, compliant with statutory exceptions for digital services (EU Directive 2011/83/EU Art. 16(m)).
