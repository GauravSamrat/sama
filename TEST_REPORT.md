# Test report

## Original baseline

The original Node static suite passed all 11 checks before edits. The original optional DOM suite could not start because jsdom was absent. The final browser suite replaces that dependency.

## Final checks

- Node.js 24.18.0 on Windows passed all six suites. They covered 42 generated routes, localization and links, metadata and configured-origin sitemap generation, checkout and release defaults, DOM and credential checks, and local HTTP behavior including a Bengali 404.
- Headless Microsoft Edge passed 84 route checks at widths of 1366 and 390 CSS pixels. Tested explicit routes, browser language detection, remembered selections, legacy hash routing, dark-theme persistence, nine energy/time combinations, the keyboard skip link, reduced motion, script-disabled content, image loading, horizontal overflow, runtime errors and external requests. This execution environment needed the browser suite’s test-only no-sandbox flag to start its renderer. Browser requests were restricted to the local server during the run.
- Visually reviewed the English desktop and Bengali mobile homepages. Responsive route checks use browser emulation. Physical devices, other browser engines and assistive technologies still need manual verification.
- In one local headless run, the Bengali homepage reached DOM content ready in 247 ms and recorded its load event end at 423 ms. These are loopback timings from one run and exclude production hosting and broader network conditions. The generated distribution is approximately 355 KB uncompressed, including the shared social image and all routes.

## Verification limits

The hosting account, production origin, commercial contact, active payment, published app links and latest Supreme Council Release asset were unavailable for end-to-end checks. Resolve and test destinations before enabling them. Hindi and Bengali need independent in-context review, particularly legal and commercial text. Genuine product screenshots and final Citta public copy need founder approval. Hosting setup and a full accessibility audit remain launch work.

