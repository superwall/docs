'use client';

import Image from 'next/image';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface OptimizedFrameProps {
  src: string;
  alt?: string;
  caption?: string;
  className?: string;
  priority?: boolean;
  quality?: number;
}

export function OptimizedFrame({
  src,
  alt = '',
  caption,
  className,
  priority = false,
  quality = 75,
}: OptimizedFrameProps) {
  const [isLoading, setIsLoading] = useState(true);

  // Calculate sizes based on typical documentation layout
  const sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px";

  return (
    <figure className={cn("my-8", className)}>
      <div className="relative overflow-hidden rounded-lg border">
        <Image
          src={src}
          alt={alt}
          width={1200}
          height={600}
          sizes={sizes}
          quality={quality}
          priority={priority}
          className={cn(
            "duration-300 ease-in-out",
            isLoading ? "scale-105 blur-sm" : "scale-100 blur-0"
          )}
          onLoad={() => setIsLoading(false)}
          style={{
            width: '100%',
            height: 'auto',
          }}
        />
      </div>
      {caption && (
        <figcaption className="mt-2 text-center text-sm text-muted-foreground">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}