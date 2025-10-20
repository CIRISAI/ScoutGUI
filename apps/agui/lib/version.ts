/**
 * Application version information
 * Populated at build time with environment variables
 */

export interface VersionInfo {
  version: string;      // From package.json
  commit: string;       // Git commit SHA
  commitShort: string;  // Short commit SHA (first 7 chars)
  buildDate: string;    // ISO 8601 timestamp
  branch: string;       // Git branch name
}

export const VERSION_INFO: VersionInfo = {
  version: process.env.NEXT_PUBLIC_APP_VERSION || '1.5.1',
  commit: process.env.NEXT_PUBLIC_GIT_SHA || 'unknown',
  commitShort: (process.env.NEXT_PUBLIC_GIT_SHA || 'unknown').slice(0, 7),
  buildDate: process.env.NEXT_PUBLIC_BUILD_DATE || new Date().toISOString(),
  branch: process.env.NEXT_PUBLIC_GIT_BRANCH || 'unknown',
};

/**
 * Get a formatted version string for display
 * Example: "v1.5.1 (12e4db7)"
 */
export function getVersionString(): string {
  return `v${VERSION_INFO.version} (${VERSION_INFO.commitShort})`;
}

/**
 * Get a detailed version string
 * Example: "v1.5.1 (12e4db7) - Built on 2025-10-20 at 03:15 UTC from main"
 */
export function getDetailedVersionString(): string {
  const date = new Date(VERSION_INFO.buildDate);
  const formattedDate = date.toISOString().replace('T', ' at ').slice(0, -5) + ' UTC';
  return `v${VERSION_INFO.version} (${VERSION_INFO.commitShort}) - Built on ${formattedDate} from ${VERSION_INFO.branch}`;
}
