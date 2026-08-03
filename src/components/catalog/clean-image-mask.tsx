export function CleanImageMask({ src }: { src: string }) {
  if (!src.startsWith("/images/products/hg/")) return null;

  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute top-0 right-0 z-10 h-[28%] w-[45%] bg-inherit"
    />
  );
}
