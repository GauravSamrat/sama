# Test report

## Abundance release candidate

- The pre-change Git checkpoint was 9d04254. All six baseline Node tests passed.
- Abundance runs eight Node suites for all generated routes and links, sitemap and metadata, disabled delivery, product links, security checks, and contrast across core light and dark colors.
- Edge exercises 63 routes at 320, 390, 768, 1024, 1366 and 1920 CSS pixels. Its guided-flow checks cover every category, optional paths, product context, conditional email, session recovery, clearing and rendering untrusted text as text. The English desktop light and Bengali mobile dark screenshots were visually inspected.
- The public form and hosted newsletter provider are unconfigured. Real network receipt, backend server validation and abuse controls, provider double opt-in and unsubscribe still require a configured staging integration. Physical mobile devices and screen-reader checks were not exercised. This is not a WCAG conformance claim.

The results below document the previous SAMA release. Its published site was left unchanged during the Abundance work.

## Firebase deployment verification

The Firebase release passed the six Node tests and 84 local Edge route checks. The preflight found 42 localized pages and 62 production files. Firebase uploaded 60 files after applying its ignore rules. SAHAJA passed 20 Node tests and its Chromium workflow suite, and all nine live PWA files matched the checked-out files. Supreme Council passed 22 offline tests, and the published v0.3.0 ZIP matched GitHub's SHA-256 digest. No provider inference was run.

The public Firebase URL passed 84 additional Edge route checks and direct HTTPS verification of all 42 pages, canonical and alternate links, product links, CSP, share image, sitemap and the custom 404. Edge used desktop and mobile viewport emulation.

## Original baseline

The original Node static suite passed all 11 checks before edits. The original optional DOM suite could not start because jsdom was absent. The final browser suite replaces that dependency.

## Original package checks

- Node.js 24.18.0 on Windows passed all six suites. They covered 42 generated routes, localization and links, metadata and configured-origin sitemap generation, checkout and release defaults, DOM and credential checks, and local HTTP behavior including a Bengali 404.
- Headless Microsoft Edge passed 84 route checks at widths of 1366 and 390 CSS pixels. Tested explicit routes, browser language detection, remembered selections, legacy hash routing, dark-theme persistence, nine energy/time combinations, the keyboard skip link, reduced motion, script-disabled content, image loading, horizontal overflow, runtime errors and external requests. This execution environment needed the browser suite’s test-only no-sandbox flag to start its renderer. Browser requests were restricted to the local server during the run.
- Visually reviewed the English desktop and Bengali mobile homepages. Responsive route checks use browser emulation. Physical devices, other browser engines and assistive technologies still need manual verification.
- In one local headless run, the Bengali homepage reached DOM content ready in 247 ms and recorded its load event end at 423 ms. These are loopback timings from one run and exclude production hosting and broader network conditions. The generated distribution is approximately 355 KB uncompressed, including the shared social image and all routes.

## Original package verification limits

The hosting account, production origin, commercial contact, active payment, published app links and latest Supreme Council Release asset were unavailable for end-to-end checks. Resolve and test destinations before enabling them. Hindi and Bengali need independent in-context review, particularly legal and commercial text. Genuine product screenshots and final Citta public copy need founder approval. Hosting setup and a full accessibility audit remain launch work.

