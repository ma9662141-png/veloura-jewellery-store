import { useState } from 'react';
import { Gem, Camera } from 'lucide-react';

interface Props {
  src?: string;
  alt: string;
  className?: string;
  variant?: 'product' | 'instagram';
}

export function ImageFallback({ src, alt, className = '', variant = 'product' }: Props) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    const Icon = variant === 'instagram' ? Camera : Gem;
    return (
      <div className={`flex items-center justify-center bg-cream-dark ${className}`}>
        <Icon className="h-10 w-10 text-primary/40" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
