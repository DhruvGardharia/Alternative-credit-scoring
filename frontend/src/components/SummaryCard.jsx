export default function SummaryCard({ title, value }) {
  return (
    <div className="bg-white shadow rounded p-4">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-xl font-bold">{value}</h2>
    </div>
  );
}
