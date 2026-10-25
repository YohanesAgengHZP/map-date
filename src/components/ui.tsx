import type { ComponentProps, ReactNode } from "react";

export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "clay";
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap",
        tone === "clay"
          ? "bg-clay-soft text-clay-dark"
          : "border-line bg-paper text-ink-soft border",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Icon + label + value, the small fact rows used across cards and panels. */
export function Stat({
  icon,
  label,
  children,
  className,
}: {
  icon?: ReactNode;
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("flex items-start gap-2", className)}>
      {icon ? <span className="text-clay mt-0.5 shrink-0">{icon}</span> : null}
      <div className="min-w-0">
        {label ? (
          <div className="text-ink-muted text-[11px] tracking-wide uppercase">
            {label}
          </div>
        ) : null}
        <div className="text-ink text-sm">{children}</div>
      </div>
    </div>
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        variant === "primary" &&
          "bg-clay hover:bg-clay-dark text-white shadow-sm",
        variant === "secondary" &&
          "border-line-strong bg-paper text-ink hover:bg-clay-soft border",
        variant === "ghost" && "text-ink-soft hover:bg-clay-soft/60",
        className,
      )}
      {...rest}
    />
  );
}

/** Honest labelling: says exactly which parts are verified and which are not. */
export function SampleNote({ className }: { className?: string }) {
  return (
    <p className={cx("text-ink-muted text-xs leading-relaxed", className)}>
      Every place here is real and so is every photo. Hours only show up when
      somewhere actually publishes them, a few pins are rough, and travel times
      come from a live routing service.
    </p>
  );
}
