import type { ReactNode } from 'react';
import { cn } from '../lib/cn';

const SIZE_CLASS = {
  sm: 'size-11 rounded-xl',
  md: 'size-12 rounded-xl',
  lg: 'size-[5.25rem] rounded-2xl',
} as const;

/** Logo fills the framed tile. */
const IMG_SIZE = {
  sm: 'size-full',
  md: 'size-full',
  lg: 'size-full',
} as const;

/**
 * Soft rounded mask: heavily rounded rect + gaussian blur so the logo
 * fades into the plate (no hard corner line).
 */
const LOGO_SOFT_MASK = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" preserveAspectRatio="none">
    <defs>
      <filter id="f" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="6.5"/>
      </filter>
    </defs>
    <rect x="4" y="4" width="92" height="92" rx="46" ry="46" fill="white" filter="url(#f)"/>
  </svg>`,
)}")`;

export type CompanyLogoMarkSize = keyof typeof SIZE_CLASS;

/**
 * Company logo on a framed plate — logo corners are deeply rounded and
 * feathered into the plate background.
 */
export function CompanyLogoMark({
  src,
  size = 'sm',
  alt = '',
  className,
  fallback,
}: {
  src: string | null | undefined;
  size?: CompanyLogoMarkSize;
  alt?: string;
  className?: string;
  fallback?: ReactNode;
}) {
  return (
    <div
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden',
        'border-2 border-[var(--ba-logo-plate-ring)]',
        'bg-[var(--ba-logo-plate-bg)]',
        'shadow-[var(--ba-logo-plate-shadow)]',
        SIZE_CLASS[size],
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,var(--ba-flame-soft),transparent_55%)]"
        aria-hidden
      />
      {src ? (
        <div className={cn('relative z-[1] grid place-items-center p-0.5', IMG_SIZE[size])}>
          <img
            src={src}
            alt={alt}
            className="size-full object-cover"
            style={{
              WebkitMaskImage: LOGO_SOFT_MASK,
              maskImage: LOGO_SOFT_MASK,
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
            }}
          />
          {/* Plate-color vignette — blends logo rim into the tile */}
          <div
            className="pointer-events-none absolute inset-0"
            aria-hidden
            style={{
              background:
                'radial-gradient(ellipse 78% 78% at 50% 50%, transparent 0%, transparent 58%, color-mix(in srgb, var(--ba-logo-plate-fade) 30%, transparent) 82%, var(--ba-logo-plate-fade) 97%)',
            }}
          />
        </div>
      ) : (
        <div className="relative z-[1] grid place-items-center">{fallback}</div>
      )}
    </div>
  );
}
