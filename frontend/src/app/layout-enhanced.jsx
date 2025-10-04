"use client";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/EnhancedAuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Document Management System",
  description: "Enhanced role-based document management system",
};

export default function EnhancedRootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
