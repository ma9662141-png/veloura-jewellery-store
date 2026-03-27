interface Props {
  size?: 'sm' | 'md' | 'lg';
  theme?: 'light' | 'dark' | 'gold';
}

export function VelouraLogo({ size = 'md', theme = 'light' }: Props) {
  const sizeClasses = { sm: 'text-lg', md: 'text-2xl', lg: 'text-4xl' };
  const subSizeClasses = { sm: 'text-[7px]', md: 'text-[9px]', lg: 'text-[11px]' };
  const colorClasses = {
    light: 'text-foreground',
    dark: 'text-primary-foreground',
    gold: 'text-primary',
  };

  return (
    <div className="flex flex-col items-start leading-none">
      <span className={`font-display font-bold tracking-[0.15em] ${sizeClasses[size]} ${colorClasses[theme]}`}>
        Veloura
      </span>
      <span className={`font-body tracking-[0.2em] uppercase ${subSizeClasses[size]} text-muted-foreground`}>
        The House of Jewellery
      </span>
    </div>
  );
}
