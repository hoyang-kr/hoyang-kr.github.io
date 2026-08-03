import type { ProductVariant } from "@/types/product";

type FinishSelectorProps = {
  variants: ProductVariant[];
  selectedId: string;
  onChange: (id: string) => void;
};

export function FinishSelector({
  variants,
  selectedId,
  onChange,
}: FinishSelectorProps) {
  return (
    <fieldset>
      <legend className="mb-3 text-xs font-semibold">마감 선택</legend>
      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => {
          const selected = variant.id === selectedId;
          const singleFinish = variants.length === 1;
          return singleFinish ? (
            <span
              aria-label={`마감: ${variant.finish}`}
              className="finish-chip finish-chip-static"
              key={variant.id}
            >
              <span className={`finish-swatch finish-${variant.finish}`} />
              <span>{variant.finish}</span>
            </span>
          ) : (
            <button
              aria-label={`마감: ${variant.finish}`}
              aria-pressed={selected}
              className="finish-chip"
              data-selected={selected}
              key={variant.id}
              onClick={() => onChange(variant.id)}
              type="button"
            >
              <span className={`finish-swatch finish-${variant.finish}`} />
              <span>{variant.finish}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
