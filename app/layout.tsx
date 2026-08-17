import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "디지털 포렌식 수사관",
  description:
    "CASE 017 사라진 목격 사진을 해결하는 중학생 온·오프라인 디지털 포렌식 직업체험",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
