import ConvexClientProvider from "@/components/ConvexClientProvider";
import { Toaster } from "@/components/Sonner";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FirstModel — From dataset to first model in minutes",
  description:
    "FirstModel helps data scientists go from dataset to reproducible baseline models in minutes: profile, auto‑plan, train, and export pipelines.",
  keywords: [
    "AutoML",
    "tabular",
    "scikit-learn",
    "baseline models",
    "pipelines",
    "profiling",
    "training",
  ],
  applicationName: "FirstModel",
  authors: [{ name: "Pedro Navarrete" }, { name: "FirstModel" }],
  creator: "Pedro Navarrete",
  publisher: "FirstModel",
  openGraph: {
    title: "FirstModel — From dataset to first model in minutes",
    description:
      "Profile your data, auto‑generate a plan, train baselines, and export reproducible pipelines.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FirstModel — From dataset to first model in minutes",
    description:
      "Profile your data, auto‑generate a plan, train baselines, and export reproducible pipelines.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="sunset" className="overflow-x-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ConvexClientProvider>{children}</ConvexClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
