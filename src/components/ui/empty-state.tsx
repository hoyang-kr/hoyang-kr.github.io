import Link from "next/link";

type EmptyStateProps = {
  title?: string;
  description?: string;
  href?: string;
  actionLabel?: string;
};

export function EmptyState({
  title = "조건에 맞는 제품이 없습니다.",
  description = "필터를 변경하거나 전체 제품을 다시 확인해 주세요.",
  href = "/products",
  actionLabel = "전체 제품 보기",
}: EmptyStateProps) {
  return (
    <div className="border-y border-line px-5 py-24 text-center">
      <p className="text-xl font-medium">{title}</p>
      <p className="mt-3 text-sm leading-6 text-muted">{description}</p>
      <Link className="button-secondary mt-7" href={href}>
        {actionLabel}
      </Link>
    </div>
  );
}
