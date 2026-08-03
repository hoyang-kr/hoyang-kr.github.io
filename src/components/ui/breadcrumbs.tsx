import Link from "next/link";

type Breadcrumb = {
  label: string;
  href?: string;
};

export function Breadcrumbs({ items }: { items: Breadcrumb[] }) {
  return (
    <nav aria-label="현재 위치" className="text-xs text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        <li>
          <Link className="transition-colors hover:text-ink" href="/">
            홈
          </Link>
        </li>
        {items.map((item) => (
          <li className="flex items-center gap-2" key={item.label}>
            <span aria-hidden="true">/</span>
            {item.href ? (
              <Link
                className="transition-colors hover:text-ink"
                href={item.href}
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
