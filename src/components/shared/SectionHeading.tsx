import { motion } from 'framer-motion';

interface Props {
  title: string;
  subtitle?: string;
  className?: string;
}

export function SectionHeading({ title, subtitle, className = '' }: Props) {
  return (
    <div className={`mb-12 text-center ${className}`}>
      <div className="flex items-center justify-center gap-4">
        <div className="h-px w-12 bg-primary/40" />
        <h2 className="font-display text-3xl font-bold md:text-4xl">{title}</h2>
        <div className="h-px w-12 bg-primary/40" />
      </div>
      {subtitle && (
        <p className="mt-3 font-body text-muted-foreground">{subtitle}</p>
      )}
    </div>
  );
}
