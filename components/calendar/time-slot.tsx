"use client";

type SlotState = "available" | "blocked" | "selected";

export function TimeSlot({ time, state, onSelect }: { time: string; state: SlotState; onSelect?: (time: string) => void }) {
  const isBlocked = state === "blocked";
  const classes = {
    available: "border-slate-200 bg-white text-slate-700 hover:border-ieptec-300 hover:bg-ieptec-50",
    blocked: "cursor-not-allowed border-rose-100 bg-rose-50 text-rose-400 line-through",
    selected: "border-ieptec-600 bg-ieptec-700 text-white shadow-md"
  };
  return (
    <button
      type="button"
      disabled={isBlocked}
      onClick={() => onSelect?.(time)}
      className={`rounded-xl border px-2 py-2 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-ieptec-500 focus:ring-offset-2 ${classes[state]}`}
      aria-label={`${time}, ${isBlocked ? "indisponível" : state === "selected" ? "selecionado" : "disponível"}`}
    >
      {time}
    </button>
  );
}
