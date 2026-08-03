# Launch quality audit

Audit date: 2026-07-29  
Mode: Development/controlled preview build  
Browser: Chromium via Playwright, desktop 1440×1000 and mobile 390×844

This is a local production-build audit without network or CPU throttling. The
timings are useful for regression comparison, not field-performance guarantees or
Lighthouse scores.

## Routes tested

| Route                                  |    LCP |   CLS | Precise JS unused |
| -------------------------------------- | -----: | ----: | ----------------: |
| `/`                                    | 192 ms | 0.000 |             69.4% |
| `/products`                            | 172 ms | 0.000 |             68.6% |
| `/products/concord-towel-bar`          |  64 ms | 0.000 |             69.3% |
| `/products/belair-toilet-paper-holder` |  64 ms | 0.000 |             69.3% |
| `/products/hg110-1-recessed-holder`    |  68 ms | 0.000 |             69.6% |
| `/collections/concord`                 |  64 ms | 0.000 |             69.8% |

The machine-readable evidence is in
[`launch-quality-results.json`](launch-quality-results.json).

## Accessibility review

The final automated pass reported zero findings across the six routes and the
mobile interactions:

- one visible `h1` per page and no heading-level skips;
- no missing `alt` attributes;
- no unlabeled visible links, buttons, inputs, or selects;
- keyboard-visible focus;
- mobile navigation and filter dialogs move focus inside, close with Escape,
  contain Tab focus, and restore focus to their trigger;
- no detected horizontal document overflow;
- reduced-motion media rules suppress transitions and animation;
- all document fonts reached the loaded state;
- the disabled/unverified purchase state is non-clickable and announced with
  `aria-disabled`;
- the product filter controls retain explicit labels and live result count.

### Applied accessibility fixes

- Darkened the shared muted text token from `#6f716c` to `#62645f`. The initial
  audit measured repeated 3.99–4.33:1 text contrast on warm surfaces; the final
  audit found no AA text-contrast failures.
- Darkened the Naver action green to `#00873e` with `#007a3d` hover so small white
  button text remains above 4.5:1 when active links are introduced.
- Added focus trapping, Escape handling, initial focus, and focus restoration to
  both mobile dialogs.

## Performance and layout review

- LCP was 64–192 ms locally.
- CLS was 0 on all tested routes after giving the client-hydrated catalog fallback
  a stable minimum height. The initial product-listing pass measured 0.363.
- Product cards and detail galleries retain aspect-ratio containers, so image
  loading does not resize their layout.
- Raster image delivery was reviewed from natural and rendered dimensions.
  The HG513 pending asset is SVG and is excluded from raster over-delivery
  conclusions; it remains a production content blocker for a different reason.
- Fonts are system/local stacks; no external font host or render-blocking font
  request is configured.
- No analytics or external script provider is configured.

Chromium precise coverage reported about 69% of downloaded Next.js/client
JavaScript bytes unused during each single-route trace. This includes shared
framework and interaction code that is loaded but not exercised by a short trace.
It is recorded as a follow-up optimization opportunity, not hidden or converted
into an arbitrary launch score. Removing the interactive filters, menus, or finish
selector merely to lower this number was not justified.

## Browser integrity

- No unexpected console errors.
- No page errors.
- No failed HTTP subresources.
- Route smoke checks cover 41 content routes plus `robots.txt` and `sitemap.xml`.
- Security headers are asserted by the smoke script.

## Remaining quality constraints

- Real-world LCP must be remeasured on the deployed HTTPS origin with CDN/cache
  behavior and representative mobile network/CPU conditions.
- The provisional hero image and lower-resolution HG images need authorized final
  assets where the business can provide them.
- A final manual screen-reader pass and browser/device matrix remain prudent before
  public launch even though the automated checks pass.
