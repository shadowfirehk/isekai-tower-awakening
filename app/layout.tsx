import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const repositoryName =
  process.env.GITHUB_REPOSITORY?.split('/').at(-1) ?? 'isekai-tower-awakening';
const assetBasePath =
  process.env.GITHUB_PAGES === 'true' ? `/${repositoryName}` : '';
const assetStyles = {
  '--asset-bg-earth': `url("${assetBasePath}/BG_Earth_Main.png")`,
  '--asset-career-wall-guardian': `url("${assetBasePath}/CAREER_WallGuardian.png")`,
  '--asset-earth-tower-atlas': `url("${assetBasePath}/assets/earth-tower-atlas.png")`,
  '--asset-earth-enemy-atlas': `url("${assetBasePath}/assets/earth-enemy-boss-atlas.png")`,
  '--asset-earth-wall-guardian': `url("${assetBasePath}/assets/earth-wall-guardian.png")`,
} as React.CSSProperties;

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: '異界炮台：命運覺醒',
  description:
    '17歲覺醒、異界入侵、命運抽取。踏入裂隙，取得你唯一且永久的地球職業。',
  openGraph: {
    title: '異界炮台：命運覺醒',
    description:
      '17歲覺醒、異界入侵、命運抽取。踏入裂隙，取得你唯一且永久的地球職業。',
    images: [`${assetBasePath}/og.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: '異界炮台：命運覺醒',
    description: '17歲覺醒、異界入侵、命運抽取。',
    images: [`${assetBasePath}/og.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={assetStyles}
      >
        {children}
      </body>
    </html>
  );
}
