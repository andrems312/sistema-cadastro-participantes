import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Sistema de Cadastro de Participantes",
    template: "%s · Cadastro de Participantes",
  },
  description: "Cadastro, pesquisa e geolocalização de participantes e empresas.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2647ea",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-dvh font-sans">
        {children}
        <Toaster richColors closeButton position="top-right" toastOptions={{ duration: 4500 }} />
      </body>
    </html>
  );
}
