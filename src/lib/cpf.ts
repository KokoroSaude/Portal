export function stripCpf(value: string) {
  return value.replace(/\D/g, "");
}

export function formatCpfDisplay(digits: string | null | undefined) {
  if (!digits) return "—";
  const d = stripCpf(digits).padStart(11, "0").slice(-11);
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

export function maskCpf(digits: string | null | undefined) {
  if (!digits || stripCpf(digits).length < 11) return "—";
  const d = stripCpf(digits);
  return `•••.•••.•••-${d.slice(-2)}`;
}
