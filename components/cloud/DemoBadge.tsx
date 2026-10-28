/** Marks anything simulated, so a mockup is never mistaken for a working integration. */
export function DemoBadge() {
  return (
    <span
      className="inline-flex items-center rounded border border-dashed border-amber-400 bg-amber-50 px-1.5 text-[10px] font-semibold uppercase leading-4 tracking-wide text-amber-800"
      title="Simulated: shows the flow, but nothing is sent"
    >
      Demo
    </span>
  );
}
