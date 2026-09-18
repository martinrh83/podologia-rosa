/** Un aviso: neutro, de error o de que algo salió bien. */
export function Notice({
  tone,
  title,
  children,
}: {
  tone: "muted" | "danger" | "success";
  title: string;
  children?: React.ReactNode;
}) {
  const toneClass = {
    muted: "border-border bg-surface-muted",
    danger: "border-[color:var(--danger)] bg-[color:var(--danger)]/5",
    success: "border-[color:var(--success)] bg-[color:var(--success)]/5",
  }[tone];

  return (
    <div role="status" className={`border-2 p-5 ${toneClass}`}>
      <p className="text-[1.15rem] font-bold">{title}</p>
      {children && <div className="mt-1.5 leading-relaxed text-muted">{children}</div>}
    </div>
  );
}
