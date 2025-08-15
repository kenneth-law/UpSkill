export default function GradientCard({ title, children }) {
  return (
    <div className="bg-gradient text-white p-6 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-2 text-shadow">{title}</h3>
      <div className="text-white/90">{children}</div>
    </div>
  );
}