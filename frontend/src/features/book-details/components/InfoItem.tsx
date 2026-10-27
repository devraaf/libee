export default function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <strong className="block text-gray-500 text-xs uppercase">{label}</strong>
      <span className="text-gray-800">{value}</span>
    </div>
  );
}