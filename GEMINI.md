# LShorter - Project Guidelines & Conventions

## Overview
LShorter is an enterprise-grade URL shortener, link management, and real-time edge routing platform built with Next.js (App Router), Convex Cloud, Cloudflare Workers / D1, and Dodo Payments.

---

## Dodo Payments Integration Conventions

When writing or modifying code that integrates with Dodo Payments:

- **Official SDK**:
  - Server-side (Node.js / Next.js API routes): `dodopayments`
- **Environment & Safety**:
  - Local development and staging environments use `"test_mode"` by default (`DODO_PAYMENTS_ENVIRONMENT="test_mode"`).
  - Production environment is enabled when `DODO_PAYMENTS_ENVIRONMENT="live_mode"`.
- **Environment Variables**:
  - `DODO_PAYMENTS_API_KEY`: Server-side API key (`DodoPayments` bearer token).
  - `DODO_PAYMENTS_ENVIRONMENT`: `"test_mode"` or `"live_mode"`.
  - `DODO_PAYMENTS_WEBHOOK_KEY`: Webhook endpoint secret key.
  - Product IDs:
    - `DODO_PAYMENTS_PRODUCT_PRO_MONTHLY`
    - `DODO_PAYMENTS_PRODUCT_PRO_YEARLY`
    - `DODO_PAYMENTS_PRODUCT_BUSINESS_MONTHLY`
    - `DODO_PAYMENTS_PRODUCT_BUSINESS_YEARLY`
    - `DODO_PAYMENTS_PRODUCT_ENTERPRISE_MONTHLY`
    - `DODO_PAYMENTS_PRODUCT_ENTERPRISE_YEARLY`
  - Never inline credentials or secrets into source code or repository commits.
- **Webhook Signature Verification**:
  - Always verify webhook signatures on incoming requests (`webhook-id`, `webhook-signature`, `webhook-timestamp`) via `dodo.webhooks.unwrap(...)` before acting on the payload.
- **Billing & Refund Policy**:
  - LShorter maintains a strict **All Sales Are Final / No-Refund** policy for digital edge infrastructure and subscriptions, compliant with statutory exceptions for digital services (EU Directive 2011/83/EU Art. 16(m)).
