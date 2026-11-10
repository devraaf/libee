export interface InfoItemProps {
  label: string;
  value: string;
}

export default function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="min-w-0">
      <dt className="type-small font-semibold text-fg">{label}</dt>
      <dd className="type-small mt-0.5 wrap-break-word text-fg">{value}</dd>
    </div>
  );
}
