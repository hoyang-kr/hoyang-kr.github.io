import type { Finish, ProductVariant } from "@/types/product";

export function resolveProductVariant(
  variants: ProductVariant[],
  preferredFinish?: Finish,
) {
  const visibleVariants = variants.filter((variant) => variant.customerVisible);
  const candidates = visibleVariants.length > 0 ? visibleVariants : variants;

  return (
    (preferredFinish
      ? candidates.find((variant) => variant.finish === preferredFinish)
      : undefined) ?? candidates[0]
  );
}
