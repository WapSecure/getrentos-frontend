interface SectionHeaderProps {
  badge?: string;
  title: string;
  description?: string;
  className?: string;
}

export const SectionHeader = ({
  badge,
  title,
  description,
  className = '',
}: SectionHeaderProps) => {
  return (
    <div className={`mb-10 text-center ${className}`}>
      {badge && (
        <div className="mb-3 text-xs font-semibold uppercase tracking-[0.1em] text-primary">
          {badge}
        </div>
      )}
      <h2 className="mx-auto max-w-3xl text-3xl font-semibold tracking-[-0.035em] text-foreground md:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
          {description}
        </p>
      )}
    </div>
  );
};
