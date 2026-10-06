export function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[0.7rem] tracking-[0.2em] text-muted-foreground uppercase">
      <span className="text-accent">{index}</span>
      <span className="h-px w-8 bg-border" aria-hidden="true" />
      <span>{label}</span>
    </p>
  );
}
