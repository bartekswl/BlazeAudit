import type { ReactNode } from 'react';
import type { DocumentContext } from '../../../shared/document';
import { CFAA_MEMBER_LOGO_DATA_URL } from '../../../shared/form/cfaaHeaderAsset';

export function FormPageHeaderBranding({
  context,
  children,
  page1 = false,
}: {
  context?: DocumentContext | null;
  children: ReactNode;
  /** Page 1 cover header — larger logos than meta-header pages. */
  page1?: boolean;
}) {
  const companyLogo = context?.business.logoDataUrl ?? null;

  return (
    <div className={page1 ? 'form-page-header-branding form-page-header-branding--page1' : 'form-page-header-branding'}>
      <div className="form-page-header-brand form-page-header-brand--company">
        {companyLogo ? (
          <img src={companyLogo} alt="Company logo" className="form-page-header-brand-img" />
        ) : null}
      </div>
      <div className="form-page-header-branding-content">{children}</div>
      <div className="form-page-header-brand form-page-header-brand--cfaa">
        <img
          src={CFAA_MEMBER_LOGO_DATA_URL}
          alt="Canadian Fire Alarm Association member"
          className="form-page-header-brand-img"
        />
      </div>
    </div>
  );
}
