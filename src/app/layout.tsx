import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { getUser } from "@/lib/supabase/server";
import { logout } from "@/lib/auth-actions";
import { Coffee, Trophy, User, Calendar, Newspaper, LogOut } from "lucide-react";
import { prisma } from "@/lib/db";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ayeb Café Prediction | World Cup 2026",
  description: "Join the ultimate football prediction challenge at Ayeb Café. Predict match scores, group stages, tournament awards, and final teams to top the real-time leaderboard!",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "Ayeb Café Prediction | World Cup 2026",
    description: "Predict matches, win points, and join the elite leaderboard in the cozy and thrilling atmosphere of Ayeb Café.",
    images: ["/og-image.jpg"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseUser = await getUser();
  
  let dbUser = null;
  if (supabaseUser) {
    dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });
  }

  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} ${inter.className} font-sans antialiased text-stone-100 min-h-screen flex flex-col`}
      >
        {/* Premium Header */}
        <header className="sticky top-0 z-50 w-full glass-panel border-b border-stone-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-xl bg-yellow-900/40 border border-yellow-500/30 group-hover:border-emerald-500/40 transition-colors">
                <img src="/logo.png" alt="Ayeb Café" className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-yellow-500 via-yellow-200 to-emerald-400 bg-clip-text text-transparent">
                  AYEB CAFÉ
                </span>
                <span className="hidden sm:inline-block ml-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider bg-emerald-950 text-emerald-400 border border-emerald-500/20">
                  PREDICTION
                </span>
              </div>
            </Link>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-semibold hover:text-amber-500 transition-colors">
                <Coffee className="w-4 h-4" /> Dashboard
              </Link>
              <Link href="/predictions" className="flex items-center gap-1.5 text-sm font-semibold hover:text-amber-500 transition-colors">
                <Calendar className="w-4 h-4" /> Predictions
              </Link>
              <Link href="/leaderboard" className="flex items-center gap-1.5 text-sm font-semibold hover:text-amber-500 transition-colors">
                <Trophy className="w-4 h-4" /> Leaderboard
              </Link>
              <Link href="/news" className="flex items-center gap-1.5 text-sm font-semibold hover:text-amber-500 transition-colors">
                <Newspaper className="w-4 h-4" /> News
              </Link>
            </nav>

            {/* User Profile / Auth Area */}
            <div className="flex items-center gap-4">
              {dbUser ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-bold text-stone-100">{dbUser.name}</span>
                    <span className="text-xs text-amber-500 font-medium">
                      Rank #{dbUser.rank} | {dbUser.totalPoints} pts
                    </span>
                  </div>
                  
                  {/* User Avatar or Default Icon */}
                  <div className="relative w-9 h-9 rounded-full bg-stone-800 border border-amber-500/30 flex items-center justify-center overflow-hidden">
                    {dbUser.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={dbUser.avatarUrl} alt={dbUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-stone-400" />
                    )}
                  </div>

                  <form action={logout}>
                    <button type="submit" className="p-2 rounded-lg bg-stone-900 border border-stone-800 hover:bg-red-950/40 hover:border-red-900/50 text-stone-400 hover:text-red-400 transition-all" title="Sign Out">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-stone-900 hover:text-stone-100 text-stone-300 transition-all">
                    Login
                  </Link>
                  <Link href="/login?tab=signup" className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold transition-all shadow-lg shadow-amber-500/10">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation bar at the bottom */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-stone-800/80 px-4 py-2 flex justify-around items-center rounded-t-2xl shadow-2xl">
          <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-stone-400 hover:text-amber-500 transition-colors">
            <Coffee className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/predictions" className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-stone-400 hover:text-amber-500 transition-colors">
            <Calendar className="w-5 h-5" /> Predict
          </Link>
          <Link href="/leaderboard" className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-stone-400 hover:text-amber-500 transition-colors">
            <Trophy className="w-5 h-5" /> Leader
          </Link>
          <Link href="/news" className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-stone-400 hover:text-amber-500 transition-colors">
            <Newspaper className="w-5 h-5" /> News
          </Link>
        </nav>

        {/* Main Content Area */}
        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="w-full border-t border-stone-900 bg-stone-950/40 py-6 text-center text-xs text-stone-500">
          <p>© 2026 Ayeb Café Prediction. All rights reserved.</p>
        </footer>
      </body>
    </html>
  );
}
