const variants = {
  success: "bg-success-100 text-success-700",
  warning: "bg-warning-100 text-warning-700",
  error: "bg-error-100 text-error-700",
  info: "bg-primary-100 text-primary-700",
  neutral: "bg-slate-100 text-slate-600",
};

const Badge = ({ children, variant = "neutral", className = "" }) => {
  return (
    <span className={`badge ${variants[variant]} ${className}`}>{children}</span>
  );
};

export default Badge;
