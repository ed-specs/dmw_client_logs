import "./globals.css";
import { inter } from "./components/fonts";

export const metadata = {
  title: "DMW Client Logs",
  description: "Department of Migrant Workers Client Logs System for MIMAROPA Region",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
