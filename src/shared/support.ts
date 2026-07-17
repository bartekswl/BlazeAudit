/** Public support links — offline app opens these in the system browser. */
export const SUPPORT = {
  createdBy: 'SubraLab',
  contactEmail: 'support@subralab.com',
  docsUrl: 'https://github.com/bartekswl/BlazeAudit#documentation',
  reportBugUrl: 'https://github.com/bartekswl/BlazeAudit/issues/new',
  /** Prefills a feature-request email to SubraLab. */
  featureRequestMailto: `mailto:support@subralab.com?subject=${encodeURIComponent('BlazeAudit feature request')}`,
} as const;
