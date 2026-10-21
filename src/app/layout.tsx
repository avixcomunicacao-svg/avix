import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Avix", template: "%s · Avix" },
  description: "Mentoria em Marketing, Vendas e Tecnologia — do que foi dito ao que foi feito.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fffbf2" },
    { media: "(prefers-color-scheme: dark)", color: "#0a001c" },
  ],
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

const FONTS = "https://fonts.googleapis.com/css2?family=Sora:wght@600;700&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono&display=swap";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="stylesheet" href={FONTS} />
      </head>
      <body>{children}</body>
    </html>
  );
}
