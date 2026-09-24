import versionData from './version.json';

export interface VersionInfo {
  version: string;
  baseVersion: string;
  branch: string;
  commit: string;
  environment: 'production' | 'development';
  builtAt: string;
}

export const APP_VERSION: VersionInfo = versionData as VersionInfo;
