# Sitemap audit

Audit date: 2026-07-29

## Exact 45-page versus 41-URL explanation

The baseline Next.js build generated 45 static artifacts. The baseline sitemap
contained 41 content URLs. The exact four generated artifacts intentionally absent
from the sitemap were:

1. `/_global-error` — framework-generated error page
2. `/_not-found` — custom 404/error page
3. `/robots.txt` — crawler-control utility route
4. `/sitemap.xml` — sitemap utility route; a sitemap must not list itself

Therefore `45 generated artifacts - 4 non-content artifacts = 41 baseline sitemap
URLs`.

The baseline sitemap also listed `/privacy` and `/terms` while those pages emitted
`noindex`. Phase 3 corrected that mismatch. In `development` and `preview` release
modes, the whole site is noindex, `robots.txt` disallows crawling, and the emitted
sitemap is empty. In a validated production release, the sitemap contains 39
content URLs while the two legal pages are draft, or 41 after both legal pages are
final and indexable. Production validation does not permit draft legal pages, so a
valid production sitemap is expected to contain 41 URLs unless a future route has
an explicit documented exclusion.

## Generated route classification

| Generated route                              | Classification                | Baseline sitemap         | Phase 3 rule                                   |
| -------------------------------------------- | ----------------------------- | ------------------------ | ---------------------------------------------- |
| `/`                                          | Public static page            | Included                 | Production indexable                           |
| `/about`                                     | Public static page            | Included                 | Production indexable                           |
| `/collections`                               | Public static page            | Included                 | Production indexable                           |
| `/contact`                                   | Public static page            | Included                 | Production indexable                           |
| `/privacy`                                   | Public legal page             | Included despite noindex | Excluded while draft; included when final      |
| `/products`                                  | Public static page            | Included                 | Production indexable                           |
| `/support`                                   | Public static page            | Included                 | Production indexable                           |
| `/terms`                                     | Public legal page             | Included despite noindex | Excluded while draft; included when final      |
| `/collections/batuta`                        | Public collection page        | Included                 | Production indexable                           |
| `/collections/belair`                        | Public collection page        | Included                 | Production indexable                           |
| `/collections/brio`                          | Public collection page        | Included                 | Production indexable                           |
| `/collections/concord`                       | Public collection page        | Included                 | Production indexable                           |
| `/collections/hg-series`                     | Public collection page        | Included                 | Production indexable                           |
| `/collections/saco`                          | Public collection page        | Included                 | Production indexable                           |
| `/products/batuta-towel-bar`                 | Public product page           | Included                 | Production indexable                           |
| `/products/batuta-toilet-paper-holder`       | Public product page           | Included                 | Production indexable                           |
| `/products/belair-towel-bar`                 | Public product page           | Included                 | Production indexable                           |
| `/products/belair-toilet-paper-holder`       | Public product page           | Included                 | Production indexable                           |
| `/products/brio-towel-bar`                   | Public product page           | Included                 | Production indexable                           |
| `/products/brio-toilet-paper-holder`         | Public product page           | Included                 | Production indexable                           |
| `/products/saco-towel-bar`                   | Public product page           | Included                 | Production indexable                           |
| `/products/saco-toilet-paper-holder`         | Public product page           | Included                 | Production indexable                           |
| `/products/concord-towel-bar`                | Public product page           | Included                 | Production indexable                           |
| `/products/concord-toilet-paper-holder`      | Public product page           | Included                 | Production indexable                           |
| `/products/hg01ms-slide-bar`                 | Public product page           | Included                 | Production indexable                           |
| `/products/hg05-robe-hook`                   | Public product page           | Included                 | Production indexable                           |
| `/products/hg55s-slipper-rack`               | Public product page           | Included                 | Production indexable                           |
| `/products/hg100ms-corner-shelf`             | Public product page           | Included                 | Production indexable                           |
| `/products/hg110-1-recessed-holder`          | Public product page           | Included                 | Production indexable                           |
| `/products/hg110c-recessed-holder`           | Public product page           | Included                 | Production indexable                           |
| `/products/hg110s-recessed-holder`           | Public product page           | Included                 | Production indexable                           |
| `/products/hg112c-tray-recessed-holder`      | Public product page           | Included                 | Production indexable                           |
| `/products/hg112s-tray-recessed-holder`      | Public product page           | Included                 | Production indexable                           |
| `/products/hg120-single-paper-holder`        | Public product page           | Included                 | Production indexable                           |
| `/products/hg240-phone-tray-recessed-holder` | Public product page           | Included                 | Production indexable                           |
| `/products/hg392ms-premium-shelf`            | Public product page           | Included                 | Production indexable                           |
| `/products/hg513-cleaning-brush`             | Public product page           | Included                 | Production indexable; currently launch-blocked |
| `/products/hg820-double-towel-shelf`         | Public product page           | Included                 | Production indexable                           |
| `/products/hg822-double-towel-shelf`         | Public product page           | Included                 | Production indexable                           |
| `/products/hg999-shaving-mirror`             | Public product page           | Included                 | Production indexable                           |
| `/products/hg999-2-shaving-mirror`           | Public product page           | Included                 | Production indexable                           |
| `/_global-error`                             | Internal framework error page | Excluded                 | Never indexable                                |
| `/_not-found`                                | Error page                    | Excluded                 | Never indexable                                |
| `/robots.txt`                                | Internal utility route        | Excluded                 | Never listed                                   |
| `/sitemap.xml`                               | Internal utility route        | Excluded                 | Never listed                                   |

## Automated audit

`npm run audit:sitemap`:

- rejects duplicate URLs;
- rejects localhost, example-domain, invalid, or non-HTTPS production URLs;
- compares every intended indexable route with the production sitemap;
- starts the built site and verifies every sitemap URL returns successfully;
- compares each page canonical URL with its sitemap URL;
- rejects a sitemap entry whose HTML is noindex;
- verifies the HTTP sitemap output matches the application sitemap function.

The development-mode audit passed with an intentionally empty sitemap. Production
coverage remains blocked until verified domain, legal, catalog, rights, and listing
data permit a production-mode build.
