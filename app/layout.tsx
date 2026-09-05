import type { Metadata } from 'next';
import './wwi.css';

const repositoryName =
  process.env.GITHUB_REPOSITORY?.split('/').at(-1) ?? 'isekai-tower-awakening';
const assetBasePath =
  process.env.GITHUB_PAGES === 'true' ? `/${repositoryName}` : '';
export const metadata: Metadata = {
  title: '西線戰報｜第一次世界大戰：凡爾登 1916',
  description:
    '第一次世界大戰歷史策略塔防。指揮法軍防禦區，部署步兵、機槍、野戰炮與工兵，守住凡爾登交通線。',
  openGraph: {
    title: '西線戰報 · WORLD WAR I',
    description: '凡爾登 1916 · 歷史風格戰役塔防',
    images: [`${assetBasePath}/wwi/verdun.png`],
  },
  twitter: {
    card: 'summary_large_image',
    title: '西線戰報 · 凡爾登 1916',
    description: '歷史風格戰役塔防',
    images: [`${assetBasePath}/wwi/verdun.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
