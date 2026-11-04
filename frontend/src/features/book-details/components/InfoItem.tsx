export interface InfoItemProps {
  label: string;
  value: string;
}

export default function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="min-w-0">
      <dt className="type-caption font-semibold uppercase text-muted">
        {label}
      </dt>
      <dd className="type-small mt-1 wrap-break-word text-fg">{value}</dd>
    </div>
  );
}
