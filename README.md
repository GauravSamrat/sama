# SAMA v1.0.0

SAMA is an independent software studio’s static website. It covers Citta, SAHAJA and Supreme Council in English, Hindi and Bengali. The production files are in dist. Product and guide pages work without JavaScript.

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
- locales contains translations. Each translation row is ordered English, Hindi, Bengali.
- build.js generates HTML, metadata, security headers, sitemap, robots rules and localized 404s.
- app.js handles language selection at the root, appearance and the local demonstration.
- styles.css and assets define the visual system.
- See DEPLOYMENT.md, CONTENT_GUIDE.md, PAYMENT_GUIDE.md and TEST_REPORT.md for launch instructions and verification status.

## Launch configuration

Set the HTTPS production origin in studio.js and rebuild. An unset origin makes the build a preview, with noindex and a blocked robots file. Add the founder-approved contact address and enable the confirmed service list when ready. Product links and checkout stay disabled until their destinations and terms are verified. The publication package contains only SAMA website source, assets and distribution. Use a dedicated GitHub repository for this website’s source history.

