# Launch readiness

## Current classification

**Ready for preview only**

The application, catalog routes, build, image import, sitemap logic, smoke
checks, and representative browser audits pass in controlled preview mode.
Production validation correctly fails because verified business, legal,
catalog, rights, and Naver data have not been supplied.

No missing business fact was inferred or fabricated.

## Readiness by area

| Area                       | Classification                   | Current evidence                                                                                                      |
| -------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Brand identity             | Requires business confirmation   | Temporary identity, logo, descriptions, and manufacturer relationship remain in controlled preview data.              |
| Catalog accuracy           | Requires business confirmation   | 37 variant verification rows and 20 explicit catalog/rights confirmations are outstanding.                            |
| Product imagery            | Ready for preview only           | 36 of 37 variants use normalized source imagery; HG513 remains on a placeholder pending confirmation.                 |
| Image and trademark rights | Blocked                          | HOYANG relationship, ownership/license, permitted use/modification, and trademark permission are unconfirmed.         |
| Naver commerce links       | Blocked                          | No verified homepage or variant listing rows have been imported. Unverified states are non-clickable.                 |
| Company information        | Blocked                          | Legal company name, representative, registrations, address, and validated service contacts are missing.               |
| Customer support           | Requires business confirmation   | Warranty, A/S, returns, delivery, installation, and support instructions need verified text.                          |
| Legal pages                | Requires legal review            | Privacy and terms are drafts; reviewed text, effective dates, company details, and reviewer evidence are absent.      |
| SEO                        | Requires business confirmation   | Production origin, final metadata, social image, organization identity, and optional verification values are missing. |
| Security headers           | Ready for preview only           | CSP, referrer policy, nosniff, permissions policy, and frame protection pass locally; HSTS awaits verified HTTPS.     |
| Accessibility              | Ready for preview only           | Automated representative checks pass; final-content and deployed manual/screen-reader review remain.                  |
| Performance                | Ready for preview only           | Local representative routes have stable layout and fast measured LCP; field data does not yet exist.                  |
| Dependencies               | Requires deployment confirmation | High-severity advisories have no verified compatible complete fix in the current supported tree.                      |
| Deployment                 | Requires deployment confirmation | No verified production domain, HTTPS deployment, immutable artifact, or post-deployment check exists.                 |
| Sitemap coverage           | Ready for preview only           | Route classification and automated coverage pass; production URLs require final legal state and origin.               |

## Production-validation result

The controlled placeholder data produces **143 expected production errors**:

| Validation group                                   |   Count |
| -------------------------------------------------- | ------: |
| Explicit production release mode                   |       1 |
| Missing or placeholder required business text      |      28 |
| Company-format and customer-contact requirements   |       4 |
| Production domain and canonical-origin rules       |       2 |
| Placeholder or missing brand/SEO assets            |       5 |
| Image/trademark rights and permission requirements |       4 |
| Missing Naver Store homepage                       |       1 |
| Legal final/review requirements                    |       3 |
| Unresolved catalog and rights confirmations        |      20 |
| Missing verified product-variant records           |      37 |
| Missing verified Naver listing-state records       |      37 |
| Customer-visible HG513 placeholder image           |       1 |
| **Total**                                          | **143** |

Production validation is inspection-only. It does not edit files or promote
preview data.

## Launch blockers

| Blocker ID | Description                                                       | Affected files or routes                                                                | Responsible party                                | Evidence required                                                                                                       | Remediation                                                                                               | Validation rule                                                                                  |
| ---------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| LR-001     | Final brand identity and assets are missing.                      | `data/launch/business.yaml`, `data/launch/seo.yaml`, metadata and global brand surfaces | Business/brand owner                             | Approved names, descriptions, logo, favicon, hero/social assets, and ownership or permission                            | Complete brand and SEO inputs, import, and review all global surfaces.                                    | Production text and asset fields must be valid and non-placeholder.                              |
| LR-002     | Required company and customer-contact data is missing.            | Business input, footer, contact, privacy, terms, support                                | Business owner with legal/accounting review      | Legal name, representative, registrations or documented mail-order applicability, address, valid phone/email, hours     | Complete the company section and re-import.                                                               | Required company fields and at least one valid service contact must pass.                        |
| LR-003     | Customer policy text is unverified.                               | `/support`, `/contact`, `/privacy`, `/terms`                                            | Business owner, customer service, legal reviewer | Approved installation, care, warranty, A/S, returns, delivery, and support statements                                   | Insert approved text centrally; do not invent durations or windows.                                       | Required policy summaries must be present and non-example.                                       |
| LR-004     | Legal documents are drafts.                                       | `/privacy`, `/terms`, business/legal input                                              | Qualified legal reviewer and business owner      | Final policy text, effective dates, complete status, reviewer, and review date                                          | Mark final only after review and supply all required sections and details.                                | Draft status, incomplete review, or missing effective/contact data fails.                        |
| LR-005     | Production origin and SEO identity are unverified.                | SEO input, environment, metadata, robots, sitemap                                       | Business owner, marketing, deployment owner      | Controlled HTTPS domain, matching canonical origin, final metadata/social image, optional verification values           | Configure the real origin and verify deployed canonicals.                                                 | Localhost/example origins, mismatches, placeholders, and missing production domain fail.         |
| LR-006     | HOYANG, image, modification, and trademark rights are unresolved. | Product images and all public catalog routes                                            | Rights holder, business owner, legal reviewer    | Ownership/license, brand relationship, public-use and modification permission, trademark authorization, attribution     | Complete rights fields and confirmation references; do not alter embedded branding without authorization. | Rights confirmations and public-use permission must be verified and permitted.                   |
| LR-007     | Catalog naming and relationships remain unresolved.               | Product/collection data, confirmations, possible redirects                              | Catalog owner/manufacturer                       | Written confirmation for spelling, model relationships, 무광 meaning, duplicate images, collection naming and ownership | Complete all 20 confirmations and explicit corrections; preserve old slugs with redirects when required.  | Every required confirmation needs an evidence-backed resolution.                                 |
| LR-008     | All 37 variant records lack business verification.                | `data/launch/products.csv`, all product detail routes                                   | Catalog owner                                    | Verified identity/classification/model/finish, known specs, availability, visibility, verifier/date                     | Complete one unique row per variant and import.                                                           | Missing, duplicate, unknown, invalid, or unverified visible rows fail.                           |
| LR-009     | HG513 image relationship is ambiguous.                            | HG513 variant and product route                                                         | Catalog owner/manufacturer                       | Correct image/variant confirmation or a decision to hide it                                                             | Add a verified mapping/correction, or mark the verified variant not customer-visible.                     | A customer-visible variant may not use the internal placeholder.                                 |
| LR-010     | Naver commerce data is unverified.                                | Purchase actions and `data/launch/naver-links.csv`                                      | Naver Store administrator/commerce owner         | Store homepage and all variant states, active listing URLs, verifier/date                                               | Complete 37 states; provide approved-host HTTPS URLs only for active listings.                            | Active requires an approved listing URL; unverified visible/available rows fail.                 |
| LR-011     | Dependency advisories need a deployment decision.                 | Dependency manifests, build/runtime image processing                                    | Technical owner/deployment security reviewer     | Review of advisories, exposure, upstream releases, and deployment controls                                              | Apply a safe compatible patch when available; otherwise record reviewed mitigation/acceptance.            | The documented audit is not resolved without compatible remediation or reviewed acceptance.      |
| LR-012     | Production deployment has not been verified.                      | Hosting, DNS, HTTPS, headers, all public routes                                         | Deployment owner                                 | Verified artifact, DNS/HTTPS proof, route/canonical/sitemap/header/browser checks                                       | Follow `docs/deployment.md`, deploy the exact artifact, and perform post-deployment checks.               | Production mode, origin match, route/sitemap success, HTTPS, and deployment review are required. |

## Catalog confirmations required

The controlled confirmation file requires explicit evidence for:

- HG513 image relationship
- HG110-1, HG110C, HG110S
- HG112C, HG112S
- HG822C, HG822S
- HG999 and HG999-2
- the intended meaning of 무광
- three byte-identical cross-collection toilet-paper-holder image pairs
- HOYANG brand relationship
- HOYANG image usage rights
- product-image ownership
- collection ownership and naming rights
- trademark usage rights

No source family is merged, renamed, or moved solely from an assumption.
Verified corrections remain explicit and auditable.

## HOYANG image and trademark status

**Blocked / requires business and legal confirmation.**

Source imagery visibly contains HOYANG branding. Current launch data does not
confirm the relationship, image ownership or license, public display or editing
permission, logo-removal permission, trademark rights, or required attribution.
Preview reporting warns internally; production validation fails.

The implementation does not remove, obscure, crop out, retouch, or replace
HOYANG branding.

## Naver readiness

**0 of 37 variant listing records are verified.** The homepage is also absent.
All current unverified purchase states are disabled in preview. Validated
states are:

- `active`: enabled only with an HTTPS URL on an approved Naver listing host
- `inactive`: unavailable and not clickable
- `coming-soon`: “판매 준비 중” and not clickable
- `inquiry-only`: validated contact action without implying online purchase
- `unverified`: preview only; production-blocking for visible available items

The application neither scrapes nor synchronizes Naver and does not infer
pricing.

## Legal readiness

**Requires legal review.** Privacy and terms are draft and noindexed in
preview. Preview displays a draft notice. Production hides draft notices but
cannot build until final statuses, reviewed text, effective dates, company
details, contact data, reviewer, and review date pass.

## Security headers

The application now emits:

- Content-Security-Policy with `frame-ancestors 'none'`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Content-Type-Options: nosniff`
- a restrictive Permissions-Policy
- Strict-Transport-Security only in explicit production mode

Local smoke tests verify mode-specific headers. CSP needs a narrow review if
analytics, fonts, remote images, or services are introduced. These headers do
not eliminate all risk.

## Accessibility and performance

Representative production-build browser audits covered the homepage, product
listing, towel-bar detail, toilet-paper-holder detail, HG detail, and a
collection detail.

The measured routes passed automated image sizing, layout shift, heading,
alt-text, contrast, keyboard focus, dialog containment, disabled purchase,
reduced-motion, and console checks. Applied fixes included higher-contrast
muted and Naver colors, stable catalog fallback height, and mobile menu/filter
focus management.

Final local LCP was 64–192 ms and CLS was 0. Exact JavaScript coverage reported
roughly 68.6–69.7% unused bytes during short cold-route interactions; this is a
follow-up observation, not justification to restructure working code without
real-user profiling.

These laboratory results are not field data and do not replace a deployed
manual screen-reader, keyboard, device, and network review. See
[`launch-quality-audit.md`](./launch-quality-audit.md).

## Dependency status

The audit records one development-only brace-expansion advisory path, three
PostCSS advisories nested in the supported Next.js release, and one
sharp/libvips advisory affecting the image stack.

There is no verified complete compatible resolution in the supported ranges.
No forced audit fix, framework downgrade, or unsupported override was applied.
See [`dependency-audit.md`](./dependency-audit.md).

## Sitemap coverage

The baseline build reports 45 generated entries while the public inventory
contains 41 URLs. The exact four-entry difference is:

1. `/_global-error` — framework error page
2. `/_not-found` — custom 404/error page
3. `/robots.txt` — metadata utility endpoint
4. `/sitemap.xml` — metadata utility endpoint

They are generated routes, not indexable content pages. The 41 content routes
are 8 static pages, 6 collection pages, and 27 product pages. Preview mode
publishes an empty sitemap and blocks crawling; production includes intended
indexable content once legal pages are final. See
[`sitemap-audit.md`](./sitemap-audit.md).

## Deployment next step

Complete the five non-template launch source files with verified data, import
them, resolve all blockers, and run:

```bash
npm run verify:production
```

Only successful production validation/build using verified data, followed by
deployed HTTPS checks, can change this report to public-launch ready.
