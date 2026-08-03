import { Breadcrumbs } from "@/components/ui/breadcrumbs";

type PageIntroProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumb?: string;
  titleClassName?: string;
};

export function PageIntro({
  eyebrow,
  title,
  description,
  breadcrumb,
  titleClassName,
}: PageIntroProps) {
  return (
    <div className="page-shell py-12 md:py-18">
      {breadcrumb ? <Breadcrumbs items={[{ label: breadcrumb }]} /> : null}
      <div className={breadcrumb ? "mt-12" : ""}>
        {eyebrow ? <p className="eyebrow-section mb-5">{eyebrow}</p> : null}
        <h1
          className={
            titleClassName ??
            "text-4xl leading-tight font-medium tracking-[-0.05em] md:text-6xl"
          }
        >
          {title}
        </h1>
        {description ? (
          <p className="mt-6 max-w-2xl text-[15px] leading-7 text-muted">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
