import type { Category, Collection, Finish } from "@/types/product";

export type CatalogFilterValues = {
  category: string;
  collection: string;
  finish: string;
};

type ProductFiltersProps = {
  categories: Category[];
  collections: Collection[];
  finishes: Finish[];
  values: CatalogFilterValues;
  onChange: (key: keyof CatalogFilterValues, value: string) => void;
  onClear: () => void;
};

export function ProductFilters({
  categories,
  collections,
  finishes,
  values,
  onChange,
  onClear,
}: ProductFiltersProps) {
  return (
    <div>
      <div className="mb-7 flex items-center justify-between">
        <p className="text-sm font-semibold">필터</p>
        <button
          className="border-b border-brand pb-0.5 text-[11px] font-medium"
          onClick={onClear}
          type="button"
        >
          전체 해제
        </button>
      </div>

      <FilterGroup
        label="카테고리"
        onChange={(value) => onChange("category", value)}
        options={categories.map((category) => ({
          label: category.name,
          value: category.id,
        }))}
        value={values.category}
      />
      <FilterGroup
        label="컬렉션"
        onChange={(value) => onChange("collection", value)}
        options={collections.map((collection) => ({
          label: collection.nameKo,
          value: collection.id,
        }))}
        value={values.collection}
      />
      <FilterGroup
        label="마감"
        onChange={(value) => onChange("finish", value)}
        options={finishes.map((finish) => ({
          label: finish,
          value: finish,
        }))}
        value={values.finish}
      />
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <fieldset className="border-t border-line py-6">
      <legend className="mb-4 text-xs font-semibold">{label}</legend>
      <div className="space-y-1">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <label
              className="flex cursor-pointer items-center gap-3 py-1.5 text-sm"
              key={option.value}
            >
              <input
                checked={active}
                className="size-4 accent-brand"
                name={`filter-${label}`}
                onChange={() => onChange(active ? "" : option.value)}
                type="checkbox"
              />
              <span
                className={active ? "font-medium text-brand" : "text-muted"}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
