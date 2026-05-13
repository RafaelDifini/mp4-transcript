import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MP4 → Texto",
  description: "Transcrição local de vídeos MP4 com faster-whisper. Zero custo, sem API key.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
