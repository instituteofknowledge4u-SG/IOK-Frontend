import { AlertCircle } from "lucide-react";

export const TextInput = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
  error,
  disabled,
  maxLength,
}) => (
  <div className="w-full">
    <label className="block text-sm font-medium text-foreground mb-1.5">
      {label} {required && <span className="text-destructive">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      maxLength={maxLength}
      className={`w-full px-4 py-3 rounded-xl border bg-background text-foreground focus:ring-2 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
        error
          ? "border-destructive focus:border-destructive focus:ring-destructive/20"
          : "border-border focus:border-primary focus:ring-primary/20"
      }`}
    />
    {error && (
      <p className="text-destructive text-xs mt-2 flex items-center gap-1 font-medium">
        <AlertCircle size={14} /> {error}
      </p>
    )}
  </div>
);
