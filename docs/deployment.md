# Deployment

This project supports development, preview, and production release modes. The
release mode is explicit; it is not inferred from `NODE_ENV`.

## Runtime requirements

- Node.js 20.19 or later
- npm with lockfile-based installs
- A platform capable of running a Next.js 16 application

Install the exact dependency tree:

```bash
npm ci
```

Do not use `npm audit fix --force`. Review
[`dependency-audit.md`](./dependency-audit.md) before changing framework or
image-processing versions.

## Environment variables

Copy `.env.example` to the environment manager used by the deployment target.
Do not commit production secrets or verification values.

| Variable                        | Development/preview        | Production                                                                                      |
| ------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_RELEASE_MODE` | `development` or `preview` | `production`                                                                                    |
| `NEXT_PUBLIC_SITE_URL`          | Optional preview origin    | Required HTTPS origin; must match `onlinePresence.canonicalBaseUrl` in the imported launch data |

`NEXT_PUBLIC_*` values are exposed to the browser. Do not put secrets in these
variables. Search-engine verification values are managed through launch data.

## Controlled launch-data workflow

Templates under `data/launch/` are input guides only. The application never
loads them as production data.

1. Copy all five templates to their corresponding non-template filenames:
   `business.yaml`, `products.csv`, `naver-links.csv`,
   `catalog-confirmations.yaml`, and `seo.yaml`.
2. Replace examples and blanks with verified information. Leave unknown facts
   unresolved; do not guess.
3. Import the complete set:

   ```bash
   npm run import:launch-data
   ```

4. Review the generated `data/launch/launch-data.json` diff. The importer is
   deterministic and rejects partial source sets, unknown identifiers, invalid
   rows, and silent replacement of verified records.
5. Validate the intended release:

   ```bash
   npm run validate:preview
   npm run validate:launch
   ```

If no real source files exist, the importer preserves the current preview
data. It never promotes template examples.

## Image and catalog import

Normalize and audit source images before building:

```bash
npm run import:images
```

This updates the generated image audit but does not resolve ambiguous catalog
relationships. Confirmations and corrections belong in controlled launch
inputs.

## Preview build

```bash
NEXT_PUBLIC_SITE_RELEASE_MODE=preview npm run validate:preview
NEXT_PUBLIC_SITE_RELEASE_MODE=preview npm run build
npm start
```

Preview mode may show documented provisional content. It emits restrictive
robots behavior and noindex metadata, and it does not make unverified Naver
links clickable.

## Production verification and build

Set the verified origin and explicit release mode, then run:

```bash
export NEXT_PUBLIC_SITE_RELEASE_MODE=production
export NEXT_PUBLIC_SITE_URL=https://verified-production-origin.invalid
npm run verify:production
```

The `.invalid` value is a format illustration and deliberately cannot be used
for launch. Replace it with the verified production origin, which must match
the imported canonical URL.

`verify:production` runs production launch-data validation, image/catalog
validation, formatting, lint, TypeScript checking, a production build, sitemap
audit, and route/header smoke checks. It stops on failure and never deploys.
The build guard also refuses production mode when launch validation fails.

Run the browser quality audit separately when Chromium is available:

```bash
npm run audit:quality
```

## Generic deployment path

1. Complete and review all launch source files.
2. Run `npm ci` and `npm run verify:production` in a clean environment.
3. Store the verified build artifact and its source revision or checksum.
4. Configure the verified environment variables on the hosting platform.
5. Deploy that artifact without re-importing different launch data.
6. Validate the temporary deployment origin.
7. Point DNS after the checks pass and the HTTPS certificate is valid.
8. Repeat the post-deployment checks against the canonical origin.

The application is not bound to one provider. A target must preserve Next.js
headers, redirects, static assets, server behavior, and environment variables.

## GitHub Pages preview deployment

The workflow at `.github/workflows/deploy-pages.yml` builds a static export on
pushes to `main` and on manual dispatch. In the repository settings, select
**Settings → Pages → Build and deployment → Source → GitHub Actions** once
before the first deployment.

The workflow deliberately sets `NEXT_PUBLIC_SITE_RELEASE_MODE=preview` while
the launch data remains unverified. `actions/configure-pages` supplies the
deployed base URL for canonical metadata, and `GITHUB_PAGES=true` enables the
static-export configuration in `next.config.ts`.

GitHub Pages serves static files and cannot apply the custom response headers
or Next.js redirects configured for a Node.js deployment. The Pages workflow
therefore omits those server-only settings. Use the generic production path on
a compatible host when those controls are required.

### Optional Vercel notes

- Pin a supported Node.js 20 runtime.
- Configure Preview and Production variables separately.
- Never set production release mode on Preview deployments.
- Preserve the repository build command so the production guard runs.
- Confirm redirects and security headers in deployed responses.

## Domain and HTTPS

- Verify domain ownership and DNS records before changing the canonical origin.
- Use one HTTPS canonical origin without a trailing slash.
- Redirect HTTP and alternate hostnames to the canonical origin at the edge.
- HSTS is emitted only in explicit production mode. Do not preload or broaden
  it until every affected hostname is permanently HTTPS-capable.
- Re-run the sitemap audit after the real domain is active.

## Cache invalidation

Deploy a new immutable build whenever launch data, metadata, redirects, images,
or catalog records change. Invalidate caches for:

- `/`
- `/robots.txt`
- `/sitemap.xml`
- changed product and collection routes
- changed images and social-sharing assets

Do not overwrite a cached asset at the same URL without reliable invalidation.

## Post-deployment smoke checks

Check at minimum:

- `/`, `/products`, one collection, and representative products return `200`
- an unknown route returns `404`
- every sitemap URL returns `200`
- canonicals use the verified origin and intended path
- production pages do not emit `noindex`
- robots allows intended public routes
- all intended product and collection routes appear in the sitemap
- privacy and terms contain reviewed final content
- active Naver links open the intended approved-host variant listing
- non-active Naver states are not direct purchase links
- CSP, referrer policy, nosniff, permissions policy, and HSTS are present
- representative routes have no browser-console errors
- desktop and mobile navigation remain keyboard-operable

## Rollback

Retain the previous immutable artifact, its environment values, its launch
inputs and generated JSON, and its lockfile.

If a regression occurs:

1. Route traffic back to the previous verified artifact using the host's
   reversible deployment control.
2. Restore that artifact's matching environment and launch-data configuration.
3. Invalidate affected HTML and sitemap caches.
4. Repeat post-deployment smoke checks.
5. Correct the new release in a separate artifact.

Do not repair production by editing generated launch data on the server.

## Security-header maintenance

The CSP permits self-hosted application resources, the local/data/blob images
Next.js requires, inline framework styles, and the minimum Next.js script
behavior. Development additionally permits local tooling connections and
evaluation.

If analytics, external fonts, remote images, or another third-party service is
added, narrowly update its specific `script-src`, `connect-src`, `font-src`,
`style-src`, or `img-src` directive. Do not enable a service with a broad
wildcard.

Headers reduce common browser risks but do not replace dependency maintenance,
access control, legal review, or deployment hardening.

## Inquiry form provider setup

1. Create one inquiry form in the provider dashboard and configure the company recipient email there.
2. Enable the provider's spam protection.
3. Copy the generated HTTPS form endpoint; never add an SMTP password or recipient address to the repository.
4. Add it as the GitHub repository/environment variable `NEXT_PUBLIC_INQUIRY_ENDPOINT`.
5. Add the same public endpoint to `.env.local` for local testing.
6. Finalize the inquiry-submission privacy policy before enabling the production form.
