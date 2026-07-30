const SCHEME_PATTERN = /^[a-z][a-z\d+.-]*:/i;

export function normalizeBasePath(value: string | undefined): string {
  const trimmed = value?.trim() || '';
  if (!trimmed || trimmed === '/') return '';

  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, '');
}

export function isExternalUrl(value: string): boolean {
  return value.startsWith('//') || SCHEME_PATTERN.test(value);
}

export function resolveSitePath(
  value: string,
  basePath: string | undefined
): string {
  const normalizedBasePath = normalizeBasePath(basePath);

  if (
    !normalizedBasePath ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value === normalizedBasePath ||
    value.startsWith(`${normalizedBasePath}/`) ||
    value.startsWith(`${normalizedBasePath}?`) ||
    value.startsWith(`${normalizedBasePath}#`)
  ) {
    return value;
  }

  return `${normalizedBasePath}${value}`;
}

export function buildSiteUrl(
  siteOrigin: string,
  basePath: string | undefined,
  sitePath: string
): string {
  const normalizedOrigin = siteOrigin.replace(/\/+$/, '');
  const rootRelativePath = sitePath.startsWith('/') ? sitePath : `/${sitePath}`;
  return `${normalizedOrigin}${resolveSitePath(rootRelativePath, basePath)}`;
}
