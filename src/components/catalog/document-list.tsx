import { DownloadIcon } from "@/components/icons";
import type { ProductDocument } from "@/types/product";

export function DocumentList({ documents }: { documents?: ProductDocument[] }) {
  if (!documents || documents.length === 0) {
    return <p className="text-sm text-muted">제공 가능한 문서 준비 중</p>;
  }

  return (
    <ul className="divide-y divide-line border-y border-line">
      {documents.map((document) => (
        <li key={document.url}>
          <a
            className="flex items-center justify-between py-4 text-sm font-medium hover:text-muted"
            href={document.url}
            rel="noopener noreferrer"
            target="_blank"
          >
            {document.label}
            <DownloadIcon className="size-4" />
          </a>
        </li>
      ))}
    </ul>
  );
}
