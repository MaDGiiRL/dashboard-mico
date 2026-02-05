export default function Card({ children }) {
  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-950/30 p-4">
      {children}
    </div>
  );
}
