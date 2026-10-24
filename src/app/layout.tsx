import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Oomi — Little questions, big discoveries", description: "Un petit compagnon d’exploration. Posez une question, puis partez découvrir le monde." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
