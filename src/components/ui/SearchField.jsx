import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";

/**
 * Reusable debounced search field.
 * Props:
 *  - value, onChange (debounced), placeholder
 *  - delay (ms, default 400)
 *  - className
 */
const SearchField = ({
  value: controlledValue,
  onChange,
  placeholder = "Search...",
  delay = 400,
  className = "",
}) => {
  const [internal, setInternal] = useState(controlledValue || "");
  const timerRef = useRef(null);
  const firstRender = useRef(true);

  // Keep internal state synced when controlled value changes externally
  useEffect(() => {
    setInternal(controlledValue || "");
  }, [controlledValue]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange?.(internal);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [internal, delay, onChange]);

  const handleClear = () => {
    setInternal("");
    onChange?.("");
  };

  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="text"
        value={internal}
        onChange={(e) => setInternal(e.target.value)}
        placeholder={placeholder}
        className="input pl-10 pr-9"
      />
      {internal && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition-colors hover:text-slate-600"
          tabIndex={-1}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

export default SearchField;
