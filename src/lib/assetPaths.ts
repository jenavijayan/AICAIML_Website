export function resolveAssetUrl(path: string): string {
  if (!path) return path;
  if (/^(https?:)?\/\//i.test(path)) return path;

  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const basePath = import.meta.env.BASE_URL || '/';
  return `${basePath.replace(/\/$/, '')}/${normalizedPath}`;
}
