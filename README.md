# Abundance v1.0.0

Abundance is an independent technology initiative. The static site covers Citta, SAHAJA and Supreme Council in English, Hindi and Bengali. It includes a Journal, community pages and a guided listening form. The production output is in dist. Products, guides and articles are readable without JavaScript.

## Windows workflow

Install Node.js 22 or later. In PowerShell, open the extracted SAMA directory and run the script for the task you want.

~~~powershell
powershell -File .\setup.ps1
powershell -File .\run.ps1
powershell -File .\test.ps1
powershell -File .\test.ps1 -Browser
powershell -File .\build.ps1
~~~

The launch script prints the loopback URL. Open it in your browser and use Ctrl+C in PowerShell to stop the server. The browser suite uses an installed Edge or Chrome. Set SAMA_BROWSER to its executable if needed. There are no npm dependencies.

If PowerShell scripts are blocked by your environment, the equivalent commands are `node build.js`, `node server.js`, `node --test test.js` and `node browser-test.js`. To rebuild and verify the full ZIP, run `package.ps1` on Windows with tar.exe available.

## Source map

- studio.js contains the brand, public origin, products, assets and approved commercial settings.
- locales/journal.js contains articles. See JOURNAL_GUIDE.md for editorial review and publication.
- studio.js also controls social and community links, newsletter signup and the submission endpoint.
- locales contains translations. Each translation row is ordered English, Hindi, Bengali.
- build.js generates HTML, metadata, security headers, sitemap, robots rules and localized 404s.
- app.js handles language selection at the root, appearance and the local demonstration.
- styles.css and assets define the visual system.
- See ECOSYSTEM_DEPLOYMENT.md, CONTENT_GUIDE.md, PAYMENT_GUIDE.md and TEST_REPORT.md for deployment instructions and verification status.

## Launch configuration

The current configuration retains the existing Firebase origin until a replacement is approved. Review the three Journal drafts, verify any new destinations, and see FOUNDER_ACTIONS.md before publishing. No new provider or endpoint is configured.

