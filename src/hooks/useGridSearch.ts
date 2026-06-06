import { useEffect, useState } from "react";

export function useGridSearch(debounceMs = 300) {
  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(input), debounceMs);
    return () => window.clearTimeout(timer);
  }, [input, debounceMs]);

  function reset() {
    setInput("");
    setQuery("");
  }

  return { input, setInput, query, reset };
}
