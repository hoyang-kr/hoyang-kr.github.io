# Dependency audit

Audit date: 2026-07-29

## Commands and results

| Command                 | Result                                       |
| ----------------------- | -------------------------------------------- |
| `npm audit`             | 12 high-severity dependency advisory paths   |
| `npm audit --omit=dev`  | 3 high-severity production advisory paths    |
| `npm outdated`          | 5 packages have newer major/minor lines      |
| `npm audit fix --force` | Not run; unsafe framework changes prohibited |

No low, moderate-total, or critical advisory paths were reported. One moderate
PostCSS advisory contributes to a dependency path whose aggregate severity is
reported as high.

## Advisory evidence

| Advisory                                                                 | Installed path                                           | Direct/transitive                   | Scope                 | Use in this project                                                                                    | Compatible fix                                                                                        |
| ------------------------------------------------------------------------ | -------------------------------------------------------- | ----------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | `brace-expansion` through `minimatch` and ESLint plugins | Transitive                          | Development           | ESLint processes repository-controlled patterns; no runtime endpoint accepts glob patterns             | No compatible fix in the current older `minimatch` consumers                                          |
| [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) | `next > postcss@8.4.31`                                  | Transitive                          | Production tree/build | Next processes repository-controlled CSS; the site does not accept customer CSS                        | Latest Next 16.2.12 still pins this PostCSS version                                                   |
| [GHSA-6g55-p6wh-862q](https://github.com/advisories/GHSA-6g55-p6wh-862q) | `next > postcss@8.4.31`                                  | Transitive                          | Production tree/build | No untrusted CSS or source-map input is accepted                                                       | Latest Next 16.2.12 still pins this PostCSS version                                                   |
| [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) | `next > postcss@8.4.31`                                  | Transitive                          | Production tree/build | No untrusted CSS or source-map input is accepted                                                       | Latest Next 16.2.12 still pins this PostCSS version                                                   |
| [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) | `sharp@0.34.5`                                           | Direct and Next optional dependency | Production/tooling    | Used for trusted source-image import and Next image optimization; no remote image hosts are configured | Sharp 0.35.3 is patched, but Next 16.2.12 declares `^0.34.5`; an unsupported override was not applied |

The reduced exposure described above is evidence about the current application,
not a claim that the advisories are harmless. A deployment reviewer must reassess
the risk if user-supplied CSS, source maps, image uploads, or remote image hosts
are introduced.

## Outdated packages

| Package                       | Current/wanted | Latest | Decision                                                                 |
| ----------------------------- | -------------- | ------ | ------------------------------------------------------------------------ |
| `@types/node`                 | 24.13.3        | 26.1.2 | Major type-environment change; defer                                     |
| `eslint`                      | 9.39.5         | 10.8.0 | Major tooling change; does not resolve every older plugin path by itself |
| `prettier-plugin-tailwindcss` | 0.7.4          | 0.8.1  | Non-launch feature update; defer                                         |
| `sharp`                       | 0.34.5         | 0.35.3 | Patched upstream, but outside Next's declared optional range             |
| `typescript`                  | 5.9.3          | 7.0.2  | Major compiler change; defer                                             |

Zod 4.4.3 and YAML 2.9.0 were added for the launch-data boundary. They did not
introduce an additional reported advisory.

## Deployment decision

No framework downgrade, forced audit fix, dependency override, or unrelated major
upgrade was applied. Before public deployment:

1. Re-run all three audit commands against the deployment lockfile.
2. Check whether a newer supported Next patch updates its PostCSS and Sharp ranges.
3. If a compatible update is available, apply it normally and rerun the full
   production verification command.
4. If no supported fix exists, record explicit risk acceptance or postpone
   deployment; do not describe the result as vulnerability-free.
