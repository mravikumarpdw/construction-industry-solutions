import { cn } from "@/lib/utils";

export function Table({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full text-sm", className)}>{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return (
    <thead className="text-left text-xs uppercase tracking-wide text-muted">
      {children}
    </thead>
  );
}

export function TR({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        "border-b border-border last:border-0 transition-colors hover:bg-surface-2/60",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TH({
  children,
  className,
  align,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "right" | "center";
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 font-medium",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  className,
  align,
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "right" | "center";
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 text-fg-soft",
        align === "right" && "text-right tabular",
        align === "center" && "text-center",
        className
      )}
    >
      {children}
    </td>
  );
}
