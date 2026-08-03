export function SpecificationTable({
  specifications,
}: {
  specifications: Record<string, string>;
}) {
  const entries = Object.entries(specifications).filter(
    ([, value]) => value.trim().length > 0,
  );

  if (entries.length === 0) {
    return null;
  }

  return (
    <dl className="border-t border-line">
      {entries.map(([label, value]) => (
        <div
          className="grid grid-cols-[8rem_1fr] border-b border-line py-4 text-sm"
          key={label}
        >
          <dt className="font-medium">{label}</dt>
          <dd className="text-muted">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
