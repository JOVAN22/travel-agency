import type { Metadata } from "next";
import { Geist_Mono, Figtree } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/Components/ThemeProvider";
import { Sidebar } from "@/Components/Sidebar";

const figtree = Figtree({ subsets: ['latin'], variable: '--font-sans' });

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TravelHub — Travel Agency Platform",
  description: "Premium travel agency management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("font-sans", figtree.variable, geistMono.variable)}
    >
      <body className="antialiased">
        <ThemeProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <main className="flex-1 overflow-y-auto md:ml-60 pb-20 md:pb-0 bg-white dark:bg-slate-950">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
