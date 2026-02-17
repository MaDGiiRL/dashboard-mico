export default function Card({ title, children, right }) {
  return (
    <div className="rounded-3xl overflow-hidden bg-white/55 backdrop-blur-md shadow-[0_18px_50px_rgba(0,0,0,0.10)] ring-1 ring-white/45">
      <div className="h-1.5 bg-gradient-to-r from-olympic-blue via-olympic-yellow to-olympic-red" />

      {title ? (
        <div className="px-5 py-4 bg-white/55 border-b border-black/5">
          <div className="flex items-center justify-between gap-3">
            <div className="font-extrabold text-neutral-900">{title}</div>
            {right ? <div className="shrink-0">{right}</div> : null}
          </div>
        </div>
      ) : null}

      <div className="p-5">{children}</div>
    </div>
  );
}
