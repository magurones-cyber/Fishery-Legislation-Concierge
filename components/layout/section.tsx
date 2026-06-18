import { cn } from "@/lib/utils";

export function Section({
  title,
  action,
  className,
  children
}: {
  title: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-lg font-semibold leading-tight">{title}</h1>
        {action}
      </div>
      {children}
    </section>
  );
}
