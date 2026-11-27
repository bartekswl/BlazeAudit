import { useId } from 'react';
import { cn } from '../lib/cn';
import {
  BLAZE_SHIELD_SVG_PATH,
  BLAZE_WORDMARK_AUDIT_PATH,
  BLAZE_WORDMARK_BLAZE_PATH,
  ENABLE_BRANDED_LOADING_SCREEN,
} from '../../shared/bootSplash';
import {
  BOOT_PHOTO_BOTTOM_LEFT_CENTER_URL,
  BOOT_PHOTO_RIGHT_MID_URL,
  BOOT_PHOTO_TOP_LEFT_URL,
} from '../../shared/loadingAssets';
import {
  PDF_PHOTO_BOTTOM_LEFT_CENTER_URL,
  PDF_PHOTO_RIGHT_MID_URL,
  PDF_PHOTO_TOP_LEFT_URL,
} from '../../shared/pdfLoadingAssets';

/** Peripheral translucent fire-safety equipment photographs behind loading screens. */
export function LoadingBrandPhotos({ variant = 'boot' }: { variant?: 'boot' | 'pdf' }) {
  if (!ENABLE_BRANDED_LOADING_SCREEN) return null;

  const topLeft = variant === 'pdf' ? PDF_PHOTO_TOP_LEFT_URL : BOOT_PHOTO_TOP_LEFT_URL;
  const rightMid = variant === 'pdf' ? PDF_PHOTO_RIGHT_MID_URL : BOOT_PHOTO_RIGHT_MID_URL;
  const bottomCenterLeft =
    variant === 'pdf' ? PDF_PHOTO_BOTTOM_LEFT_CENTER_URL : BOOT_PHOTO_BOTTOM_LEFT_CENTER_URL;

  return (
    <div className="ba-loading-photos" aria-hidden="true">
      <img
        className="ba-loading-photo ba-loading-photo--top-left"
        src={topLeft}
        alt=""
        draggable={false}
      />
      <img
        className="ba-loading-photo ba-loading-photo--right-mid"
        src={rightMid}
        alt=""
        draggable={false}
      />
      <img
        className="ba-loading-photo ba-loading-photo--bottom-center-left"
        src={bottomCenterLeft}
        alt=""
        draggable={false}
      />
    </div>
  );
}

/** Central semi-transparent BlazeAudit shield-flame logo (+ optional modern geometric vector lockup). */
export function LoadingBrandMark({ logoOnly = false }: { logoOnly?: boolean }) {
  const uid = useId().replace(/:/g, '');
  if (!ENABLE_BRANDED_LOADING_SCREEN) return null;
  const shieldGrad = `ba-shield-grad-${uid}`;
  const blazeGrad = `ba-wm-blaze-${uid}`;
  const auditGrad = `ba-wm-audit-${uid}`;

  return (
    <div
      className={cn('ba-loading-brand', logoOnly && 'ba-loading-brand--logo-only')}
      aria-hidden="true"
    >
      <div className="ba-loading-brand__halo" />
      <svg
        className="ba-loading-brand__logo"
        viewBox="0 0 331 400"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id={shieldGrad}
            x1="165"
            y1="9"
            x2="165"
            y2="391"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="38%" stopColor="#fb923c" />
            <stop offset="78%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#c2410c" />
          </linearGradient>
        </defs>
        <path d={BLAZE_SHIELD_SVG_PATH} fill={`url(#${shieldGrad})`} fillRule="evenodd" />
      </svg>
      {!logoOnly ? (
        <>
          <svg
            className="ba-loading-brand__wordmark-svg"
            viewBox="0 0 431 44"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id={blazeGrad}
                x1="0"
                y1="6"
                x2="0"
                y2="38"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#fed7aa" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
              <linearGradient
                id={auditGrad}
                x1="0"
                y1="6"
                x2="0"
                y2="38"
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="65%" stopColor="#e4e4e7" />
                <stop offset="100%" stopColor="#a1a1aa" />
              </linearGradient>
            </defs>
            <path d={BLAZE_WORDMARK_BLAZE_PATH} fill={`url(#${blazeGrad})`} fillRule="evenodd" />
            <path
              d={BLAZE_WORDMARK_AUDIT_PATH}
              className="ba-loading-brand__audit-path"
              fill={`url(#${auditGrad})`}
              fillRule="evenodd"
            />
          </svg>
          <div className="ba-loading-brand__badge">Fire Safety Documentation &amp; Reporting</div>
          <div className="ba-loading-brand__sub">SubraLab</div>
        </>
      ) : null}
    </div>
  );
}
