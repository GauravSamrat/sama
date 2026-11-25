# Deployment

Cloudflare Pages supports direct upload of a folder or ZIP of prebuilt static assets. Its published Free limits include 500 builds per month on Git integration, 20,000 files per site and 25 MiB per individual file. The self-serve agreement and product restrictions apply. This project uses static Pages assets and needs no Workers, storage bindings or paid add-ons. Review the applicable account terms before deploying. [Pages limits](https://developers.cloudflare.com/pages/platform/limits/) · [Self-Serve Subscription Agreement](https://www.cloudflare.com/terms/) · [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/)

1. In the Cloudflare dashboard, open **Workers & Pages**, choose **Create application**, select the **Pages** tab, then choose **Connect to Git**.
2. Authorize the Cloudflare Workers & Pages GitHub app and grant access to **GauravSamrat/SAMA**. Select that repository.
3. Use these build settings.

   | Setting | Value |
   | --- | --- |
   | Project name | `sama` if available |
   | Production branch | `main` |
   | Framework preset | None |
   | Root directory | Leave blank to use the repository root |
   | Build command | `node build.js` |
   | Build output directory | `dist` |
   | Build environment variable | `NODE_VERSION=22` |

4. Choose **Save and Deploy**. Use the assigned `pages.dev` address. The first build remains non-indexable while `origin` is unset in studio.js.
5. When that address is ready for indexing, set `origin` in studio.js to its exact HTTPS origin, run `node --test test.js`, and commit and push the update to `main`. Cloudflare will rebuild. Check the 42 routes, localized 404s, sitemap, robots rules, canonical links and share image on the deployed site.

[Cloudflare GitHub integration](https://developers.cloudflare.com/pages/configuration/git-integration/github-integration/) · [Cloudflare build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/)

Use GitHub for source hosting. GitHub Pages restricts use for online businesses, e-commerce and commercial SaaS, so it is unsuitable for operating this studio’s commercial site. [GitHub Pages usage limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)

