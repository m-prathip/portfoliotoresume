/**
 * License registry contract.
 *
 * Production rule: no externally sourced template/design is publishable
 * unless its license explicitly permits the intended commercial use,
 * modification and redistribution.
 */

export interface TemplateLicenseRecord {
  id: string;
  type: "original" | "MIT" | "Apache-2.0" | "BSD" | "CC0" | "other";
  source: "internal" | "external";
  author?: string;
  repository?: string;
  licenseName?: string;
  licenseUrl?: string;
  commercialUseAllowed: boolean;
  modificationAllowed: boolean;
  redistributionAllowed: boolean;
  attributionRequired: boolean;
  attributionText?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  evidenceUrl?: string;
}

export function canPublishLicense(license: TemplateLicenseRecord): boolean {
  return (
    license.commercialUseAllowed &&
    license.modificationAllowed &&
    license.redistributionAllowed
  );
}

export const ORIGINAL_INTERNAL_LICENSE: TemplateLicenseRecord = {
  id: "LIC-ORIGINAL-INTERNAL",
  type: "original",
  source: "internal",
  commercialUseAllowed: true,
  modificationAllowed: true,
  redistributionAllowed: true,
  attributionRequired: false,
};
