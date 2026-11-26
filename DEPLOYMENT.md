# Deployment

The existing SAMA release remains live on Firebase Hosting. Abundance is a local release candidate. Run `deploy.ps1 -CheckOnly` to validate it without publishing.

After explicit deployment approval, mark accepted Journal entries reviewed, turn off editorialPreview in studio.js, confirm the public origin and verify any new destination. Then run `deploy.ps1` against the existing approved project. Its internal project name is unchanged. See [the ecosystem deployment guide](ECOSYSTEM_DEPLOYMENT.md) for rollback and product access.
