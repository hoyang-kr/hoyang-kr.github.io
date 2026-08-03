import Link from "next/link";

export default function NotFound() {
  return (
    <section className="page-shell flex min-h-[62vh] items-center py-20">
      <div>
        <p className="eyebrow-section mb-6">404 — Page not found</p>
        <h1 className="text-4xl font-medium tracking-[-0.045em] md:text-6xl">
          페이지를 찾을 수 없습니다.
        </h1>
        <p className="mt-5 text-sm leading-7 text-muted">
          주소가 변경되었거나 존재하지 않는 페이지입니다.
        </p>
        <div className="mt-8 flex gap-3">
          <Link className="button-primary" href="/">
            홈으로
          </Link>
          <Link className="button-secondary" href="/products">
            제품 보기
          </Link>
        </div>
      </div>
    </section>
  );
}
