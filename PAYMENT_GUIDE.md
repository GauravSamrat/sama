# Support and membership

The website launches with its checkout configuration disabled. The support invitation explains what is free and what a future membership could cover. Before enabling payment, agree the exact benefits, eligibility, prices, currency, taxes, terms, refund and cancellation paths, and provider approval. Publish the reviewed terms in the supported languages. Update the proposal wording at the same time.

Set only verified provider-hosted HTTPS URLs in studio.js, then enable the approval gate. Checkout URLs are public. The provider handles card entry. Keep all credentials outside this project.

For a future membership system, receive provider webhooks on a server. Verify signatures over the original payload, validate event IDs, amounts, currency, customer and product identifiers, and make processing idempotent. Record entitlements server-side from confirmed events. Update entitlements on refunds, disputes and subscription changes. Use browser return URLs for navigation and view status from the server record. Test against the provider’s official sandbox before going live.

