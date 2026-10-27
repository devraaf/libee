export default function ExemplarRow({ tombo, local, status }: { tombo: string; local: string; status: string }) {
  const isAvailable = status === 'Disponível';
  return (
    <tr className="border-b border-gray-100 last:border-0">
      <td className="p-3 text-gray-700">{tombo}</td>
      <td className="p-3 text-gray-700">{local}</td>
      <td className="p-3 text-center">
        <span className={`px-3 py-1 rounded-full text-xs border ${
          isAvailable ? 'bg-green-100 text-green-700 border-green-200' : 'bg-blue-100 text-blue-700 border-blue-200'
        }`}>
          ● {status}
        </span>
      </td>
    </tr>
  );
}