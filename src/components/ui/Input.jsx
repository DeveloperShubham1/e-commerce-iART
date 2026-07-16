import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const Input = forwardRef(
  (
    {
      label,
      name,
      type = "text",
      error,
      icon: Icon,
      hint,
      className = "",
      ...rest
    },
    ref,
  ) => {
    const [show, setShow] = useState(false);
    const isPassword = type === "password";
    const inputType = isPassword ? (show ? "text" : "password") : type;

    return (
      <div className={className}>
        {label && <label htmlFor={name} className="label">{label}</label>}
        <div className="relative">
          {Icon && (
            <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          )}
          <input
            ref={ref}
            id={name}
            name={name}
            type={inputType}
            className={`input ${Icon ? "pl-10" : ""} ${isPassword ? "pr-10" : ""} ${
              error ? "border-error-500 focus:border-error-500 focus:ring-error-200" : ""
            }`}
            {...rest}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              tabIndex={-1}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>
        {hint && !error && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
        {error && <p className="mt-1 text-xs text-error-600">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
