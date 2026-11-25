# SAMA ecosystem deployment

## Public access

| Product | Public access | Hosting |
| --- | --- | --- |
| SAMA | [Studio website](https://sama-studio-01.web.app/) | Firebase Hosting project and site ID: sama-studio-01. Static files in dist. |
| SAHAJA 1.0.0 | [Open SAHAJA](https://gauravsamrat.github.io/sahaja/) | Existing GitHub Pages app. The nine deployed runtime files match the tested checkout. |
| Supreme Council 0.3.0 | [Windows release](https://github.com/GauravSamrat/supreme-council/releases/tag/v0.3.0) | Local Python desktop app and CLI. GitHub Releases distributes the Windows ZIP. |
| Citta | [Product and guide](https://sama-studio-01.web.app/en/citta/) | Android and Windows app in development. Public download and authentic screenshots await an approved release. |

SAMA serves its root, English, Hindi and Bengali routes as generated HTML. A custom root 404 handles missing URLs. The studio links to SAHAJA’s existing app and Supreme Council’s Windows release. Source version control remains on GitHub. Cloudflare is postponed.

## Source and workspaces

- SAMA is in the directory containing this document. [SAMA source](https://github.com/GauravSamrat/SAMA)
- SAHAJA and Supreme Council have independent local checkouts. Use the checked-out directory for each repo’s own tests and release process. [SAHAJA source](https://github.com/GauravSamrat/sahaja) · [Supreme Council source](https://github.com/GauravSamrat/supreme-council)
- Citta has a separate private checkout. Keep the internal repository location and developer machine paths in the local operator notes.

## Deployment and updates

Install Node.js 22 or later, Firebase CLI and Edge or Chrome. Run firebase login if the CLI has no authenticated account. Use the existing sama-studio-01 project and confirm in the Firebase console that it remains on Spark. Keep studio.js origin set to the production web.app address.

Run these commands from the SAMA checkout:

~~~powershell
pwsh -File .\run.ps1
pwsh -File .\deploy.ps1 -CheckOnly
pwsh -File .\deploy.ps1
~~~

The development server binds to localhost on port 8081. Set SAMA_PORT to another free port if needed. SAHAJA’s local launcher defaults to 8080. Supreme Council runs locally without a web port.

For updates, review the source changes and run the preflight, commit the source and regenerated dist, push to main, then run deploy.ps1. The script verifies the selected Hosting site, tests the build and scans the production directory before deploying only Hosting. Verify the language pages, a direct guide URL, sitemap.xml, a deliberate 404 and product actions on the live domain. To roll back, use Firebase Hosting’s release history to restore the previous known-good release, then reconcile Git and redeploy a reviewed fix.

## Local app setup and backups

- **SAHAJA.** Open the existing public origin in Edge or Chrome on Windows or Chrome on Android and use the browser’s Install app or Add to Home Screen menu when offered. Keep using the same browser profile and origin. In Workspace, export JSON regularly. If a future move changes the origin, export on the old site first and preview a backup before importing it at the new origin. Keep the old deployment and data intact through verification. [SAHAJA installation guide](https://github.com/GauravSamrat/sahaja/blob/main/INSTALL.md)
- **Supreme Council.** Extract the Windows ZIP to a writable local directory, install Python 3.10 or newer with Tcl/Tk and the Windows launcher, run SETUP_COUNCIL.bat, configure an eligible provider and run START_COUNCIL.bat. Keep the .env, local configuration, SQLite usage ledger and reports in private local storage. Preserve them separately before an upgrade. Prompts can go to the selected external providers. Verify account eligibility, quotas and billing independently. [Versioned setup and user guide](https://github.com/GauravSamrat/supreme-council/blob/v0.3.0/README.md)
- **Citta.** Keep user backups in private storage and follow release-specific restore guidance when an approved build is published.

## Cost and release boundaries

Firebase Spark Hosting includes 10 GB of storage and 10 GB of monthly transfer at no charge. Exceeding a free quota can interrupt service. Spark restricts certain executables, including APK and EXE. Approved product binaries should use their authorized release channels. There are no paid SAMA infrastructure components in this deployment. Provider expenses are separate, and commercial contact, payment and membership remain unconfigured. [Firebase Hosting quotas](https://firebase.google.com/docs/hosting/usage-quotas-pricing) · [Spark file limitations](https://firebase.google.com/docs/hosting/faq-and-troubleshooting)

Keep private code, provider keys, research reports, backups, browser profiles, logs and user databases out of public repositories and Hosting. The Council ZIP includes a template environment file for local setup. If an exposed key is found, stop the affected publication and rotate it before release.

## Test summary

- SAMA passed six Node tests, 84 local Edge route checks and 84 live Edge route checks across desktop and mobile sizes. All 42 deployed HTTPS routes passed metadata, product link and CSP checks. The deployed sitemap, share image and custom 404 also passed.
- SAHAJA passed 20 Node tests and the Chromium workflow suite, including IndexedDB migration and restore, offline reload, and 25 viewport checks. The live files match the tested files. Physical Android installation was not exercised.
- Supreme Council passed 22 offline unit tests. The downloaded v0.3.0 ZIP matched its published SHA-256 digest. No live provider inference was run.
- Citta’s private checkout and release status were reviewed. Its app tests and release binaries fall outside this static deployment. Launch still needs an approved public Citta release and founder-approved commercial contact and payment terms.
