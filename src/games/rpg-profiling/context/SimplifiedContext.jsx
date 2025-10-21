/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const KEY = "reity_rpg_simplified";

const SimplifiedContext = createContext({
  simplified: true,
  setSimplified: () => {},
  toggleSimplified: () => {},
});

export function SimplifiedProvider({ defaultValue = true, children }) {
  const [simplified, setSimplified] = useState(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = window?.localStorage?.getItem(KEY);
      if (raw === null || raw === undefined) return setSimplified(defaultValue);
      const v = JSON.parse(raw);
      if (typeof v === "boolean") setSimplified(v);
    } catch {
      setSimplified(defaultValue);
    }
  }, [defaultValue]);

  // Persist on change
  useEffect(() => {
    if (simplified === null) return;
    try {
      window?.localStorage?.setItem(KEY, JSON.stringify(simplified));
    } catch {
      // ignore storage write errors
    }
  }, [simplified]);

  const toggleSimplified = useCallback(() => setSimplified((v) => !v), []);

  const value = useMemo(
    () => ({ simplified, setSimplified, toggleSimplified }),
    [simplified, toggleSimplified]
  );

  return (
    <SimplifiedContext.Provider value={value}>
      {children}
    </SimplifiedContext.Provider>
  );
}

export function useSimplified() {
  return useContext(SimplifiedContext);
}

// No default export to satisfy react-refresh rule
