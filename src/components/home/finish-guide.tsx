import Link from "next/link";

import { ArrowRightIcon } from "@/components/icons";
import { finishes } from "@/data/products";

const finishCopy = {
  크롬: "밝고 선명한 인상의 표면",
  사틴: "차분하고 부드러운 인상의 표면",
  블랙: "공간에 선명한 대비를 더하는 표면",
  무광: "빛 반사를 절제한 차분한 표면",
} as const;

export function FinishGuide() {
  const orderedFinishes = ["크롬", "사틴", "블랙", "무광"] as const;

  return (
    <div className="grid border-y border-line sm:grid-cols-2 lg:grid-cols-4">
      {orderedFinishes
        .filter((finish) => finishes.includes(finish))
        .map((finish, index) => (
          <Link
            className={`group flex min-h-64 flex-col justify-between p-6 transition-colors hover:bg-stone md:p-8 ${
              index > 0 ? "border-t border-line sm:border-t-0 sm:border-l" : ""
            } ${index === 2 ? "sm:border-t lg:border-t-0" : ""}`}
            href={`/products?finish=${finish}`}
            key={finish}
          >
            <span
              aria-hidden="true"
              className={`finish-swatch finish-${finish} size-14`}
            />
            <span>
              <strong className="text-xl font-medium">{finish}</strong>
              <span className="mt-2 block text-xs leading-5 text-muted">
                {finishCopy[finish]}
              </span>
              <span className="mt-5 flex items-center gap-2 text-xs font-semibold">
                제품 보기
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </span>
          </Link>
        ))}
    </div>
  );
}
