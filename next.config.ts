import type { NextConfig } from 'next';

const isGitHubPages = process.env.GITHUB_PAGES === 'true';
const repositoryName =
  process.env.GITHUB_REPOSITORY?.split('/').at(-1) ?? 'isekai-tower-awakening';
const pagesBasePath = isGitHubPages ? `/${repositoryName}` : '';

const nextConfig: NextConfig = isGitHubPages
  ? {
      output: 'export',
      trailingSlash: true,
      assetPrefix: pagesBasePath,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
