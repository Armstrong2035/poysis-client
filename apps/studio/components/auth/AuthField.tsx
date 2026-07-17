export function AuthField({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
  hint,
  action,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label
          htmlFor={name}
          className="text-[11px] font-semibold uppercase tracking-[1.5px] text-[#55594D]"
        >
          {label}
        </label>
        {action}
      </div>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-[#E4DFCC] bg-white px-4 py-3 text-[15px] text-[#262922] outline-none transition-colors placeholder:text-[#B8AF98] focus:border-[#849F7A] focus:ring-2 focus:ring-[rgba(132,159,122,0.25)]"
      />
      {hint && <p className="ml-1 text-[12px] text-[#8A8672]">{hint}</p>}
    </div>
  );
}
