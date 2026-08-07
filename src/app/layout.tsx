import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const monoTech = JetBrains_Mono({
  variable: "--font-mono-tech",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Programa Duplicar Norte — Auca Mahuida · Allen",
    template: "%s — Programa Duplicar Norte",
  },
  description:
    "Archivo audiovisual del Programa Duplicar Norte, la ampliación del oleoducto de Oldelval entre Auca Mahuida y Allen.",
};

export const viewport: Viewport = {
  themeColor: "#03060d",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" className={`${inter.variable} ${monoTech.variable} h-full`}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
