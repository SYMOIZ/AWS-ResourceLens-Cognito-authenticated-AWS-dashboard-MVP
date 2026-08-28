import { useState } from "react";

const KEY = "resourcelens.region";

export function useRegion() {
  const [region, setRegionState] = useState(
    () => localStorage.getItem(KEY) || import.meta.env.VITE_AWS_REGION || "us-east-1",
  );
  const setRegion = (next: string) => {
    localStorage.setItem(KEY, next);
    setRegionState(next);
  };
  return { region, setRegion };
}
