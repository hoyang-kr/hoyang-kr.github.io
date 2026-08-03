import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";

type SectionHeadingProps = {
  eyebrow?: string;
  eyebrowClassName?: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
  align?: "left" | "center";
};

export function SectionHeading({
  eyebrow,
  eyebrowClassName,
  title,
  description,
  action,
  align = "left",
}: SectionHeadingProps) {
  return (
    <div
      className={`mb-9 flex gap-6 md:mb-12 ${
        align === "center"
          ? "mx-auto max-w-2xl flex-col items-center text-center"
          : "items-end justify-between"
      }`}
    >
      <div>
        {eyebrow ? (
          <p
            className={["eyebrow-section mb-4", eyebrowClassName]
              .filter(Boolean)
              .join(" ")}
          >
            {eyebrow}
          </p>
        ) : null}
        <h2 className="text-3xl leading-tight font-medium tracking-[-0.035em] text-balance md:text-4xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-4 max-w-2xl text-[15px] leading-7 text-muted">
            {description}
          </p>
        ) : null}
      </div>
      {action ? (
        <Link
          className="text-link hidden shrink-0 md:inline-flex"
          href={action.href}
        >
          {action.label}
          <ArrowRightIcon className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}
