export function isWhatsappTimelineDebugEnabled() {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem("kokoro:debug-whatsapp") === "1") return true;
    return new URLSearchParams(window.location.search).get("debug-whatsapp") === "1";
  } catch {
    return false;
  }
}
