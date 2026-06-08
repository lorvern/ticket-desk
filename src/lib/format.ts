export function formatGHS(pesewas: number): string {
  const ghs = pesewas / 100;
  return new Intl.NumberFormat("en-GH", {
    style: "currency",
    currency: "GHS",
    minimumFractionDigits: ghs % 1 === 0 ? 0 : 2,
  }).format(ghs);
}

export function formatEventDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatEventTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-GH", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export const HANDLING_FEE_PERCENT = 2.5; // configurable later via settings table
export function computeHandlingFee(subtotalPesewas: number): number {
  return Math.round((subtotalPesewas * HANDLING_FEE_PERCENT) / 100);
}
