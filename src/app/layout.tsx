import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "./components/PWARegister";
import InstallApp from "./components/InstallApp";

export const metadata: Metadata = {
  metadataBase: new URL("https://bikashbhattarai.com.np"),
  title: {
    default: "Bikash Bhattarai — Personal Operating System",
    template: "%s · Bikash Bhattarai",
  },
  description: "A connected digital workspace for engineering, research, projects and everyday work.",
  applicationName: "Bikash OS",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#090d18",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><PWARegister />{children}<InstallApp /></body>
    </html>
  );
}
