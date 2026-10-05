import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio IEPTEC | Sistema de Agendamento",
  description: "Consulte a disponibilidade do Studio e solicite seu horário de utilização.",
  robots: { index: false, follow: false }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
