import type { LucideIcon } from "lucide-react";

interface PagePlaceholderProps {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  message: string;
}

export function PagePlaceholder({
  icon: Icon,
  eyebrow,
  title,
  description,
  message,
}: PagePlaceholderProps) {
  return (
    <section aria-labelledby="page-title">
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="size-6" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-primary">{eyebrow}</p>
          <h1 id="page-title" className="mt-1 text-2xl font-semibold">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="mt-10 flex min-h-56 flex-col items-center justify-center border-y border-dashed border-border px-5 text-center">
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
    </section>
  );
}