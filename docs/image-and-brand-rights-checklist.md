# Image and brand rights checklist

Status: Requires business and legal confirmation

The HG source images visibly contain `HOYANG`. No Phase 3 code removes, hides,
crops out, retouches, or replaces that embedded branding. Preview may display the
images, but production validation fails until the rights fields and confirmation
records are complete.

## Required evidence

| Question                                                                       | Current status | Evidence required                                                                                          | Launch rule                                                       |
| ------------------------------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Who owns the 37 source product images?                                         | Unresolved     | Contract, invoice terms, license, or written permission identifying the rights holder                      | `productImageOwnership` resolved and `productImageOwner` supplied |
| Is the family business itself HOYANG?                                          | Unresolved     | Business registration, brand registration, manufacturer statement, or other authoritative record           | `hoyangBrandRelationship` resolved                                |
| Is the site operator an authorized HOYANG distributor?                         | Unresolved     | Current distribution/authorization agreement and its territory/scope                                       | Manufacturer and embedded-brand relationships supplied            |
| May a new consumer brand display HOYANG-marked images publicly?                | Unresolved     | Written approval covering website, social sharing, and product catalog use                                 | `permittedPublicUse: true` and license `confirmed`                |
| May the images be edited?                                                      | Unresolved     | Permission specifying resize, compression, crop, background change, retouching, and derivative-work limits | `permittedModification` accurately set                            |
| May embedded logos be removed or obscured?                                     | Not authorized | Explicit written permission is required before any such edit                                               | No removal is implemented                                         |
| Are product and collection names protected trademarks?                         | Unresolved     | Trademark search/registration evidence or legal review                                                     | `trademarkUsageRights` and collection naming rights resolved      |
| Is manufacturer attribution required?                                          | Unresolved     | License or authorization language defining exact attribution                                               | `attributionRequired` accurately set                              |
| Does the permission cover all normalized copies and Next.js image derivatives? | Unresolved     | License wording covering resizing, format conversion, caching, and CDN delivery                            | Confirmation document reference supplied                          |

## Launch-data fields

The controlled business source records:

- `productImageOwner`
- `productImageLicenseStatus`
- `embeddedBrandName`
- `embeddedBrandRelationship`
- `permittedPublicUse`
- `permittedModification`
- `attributionRequired`
- `confirmationDocumentReference`
- `imageRightsConfirmed`
- `trademarkRightsConfirmed`

The related explicit confirmations are:

- `hoyangBrandRelationship`
- `hoyangImageUsageRights`
- `productImageOwnership`
- `collectionOwnershipAndNamingRights`
- `trademarkUsageRights`

Every resolved confirmation needs the responsible confirmer, confirmation date,
and an evidence reference. `not-applicable` is not a silent bypass: it still
requires those fields and an explanation.

## Handling rules

1. Preserve all originals under `assets/images/products/originals/`.
2. Continue using deterministic normalized copies; do not modify originals.
3. Do not infer rights from possession of the files.
4. Do not infer a HOYANG relationship from the visible mark.
5. Keep legal evidence references internal; do not publish internal warnings on
   customer pages.
6. If public use is denied or restricted beyond the site's use, mark affected
   products non-customer-visible or replace images only with authorized assets.
7. Re-run image import, preview validation, build, quality audit, and production
   validation after any authorized replacement.
