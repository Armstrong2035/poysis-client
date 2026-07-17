export function AuthAlert({
  variant,
  children,
}: {
  variant: "error" | "success";
  children: React.ReactNode;
}) {
  const styles =
    variant === "error"
      ? "border-[#E4CBBF] bg-[#F2E1DB] text-[#7E3A33]"
      : "border-[#D0DCC5] bg-[#E4EAD9] text-[#3C5A2E]";
  return (
    <div
      className={`mb-6 flex items-start gap-2 rounded-xl border px-4 py-3 text-[13px] font-medium leading-[1.4] ${styles}`}
    >
      <span>{children}</span>
    </div>
  );
}
