import type { Metadata } from "next";
import Sidebar from "./sidebar";
import "../styles/globals.css";

export const metadata: Metadata = {
  title: "Pharmacy Dashboard - LocalMed",
  description: "Manage your pharmacy orders and inventory",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="dashboard">
          <Sidebar />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
