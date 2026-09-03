declare const __PUBLIC_ASSET_BASE_PATH__: string;

const publicAssetBasePath = __PUBLIC_ASSET_BASE_PATH__;

export function publicAssetPath(assetPath: string): string {
  const normalizedPath = assetPath.startsWith('/')
    ? assetPath
    : `/${assetPath}`;
  return `${publicAssetBasePath}${normalizedPath}`;
}
