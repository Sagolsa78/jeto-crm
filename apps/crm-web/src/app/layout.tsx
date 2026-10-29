import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jeto Vacations Travel CRM",
  description: "Advanced Operations & Sales CRM for Jeto Vacations Luxury Travel",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
