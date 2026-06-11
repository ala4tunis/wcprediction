import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import { cookies, headers } from "next/headers";
import { getUser } from "@/lib/supabase/server";
import { logout } from "@/lib/auth-actions";
import { Globe2, Trophy, User, Calendar, Newspaper, LogOut } from "lucide-react";
import { prisma } from "@/lib/db";
import { getLocale, t } from "@/lib/i18n";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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

function getSiteUrl() {
  try {
    const requestOrigin = headers().get("origin");
    if (requestOrigin) return requestOrigin;
  } catch {
    // headers() called outside request scope during build
  }
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredUrl) return configuredUrl;
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return "http://localhost:3000";
}

export const metadata: Metadata = {
  title: "Ayeb Cafe Prediction | World Cup 2026",
  description:
    "Join the ultimate football prediction challenge at Ayeb Cafe. Predict match scores, group stages, tournament awards, and final teams to top the real-time leaderboard!",
  metadataBase: new URL(getSiteUrl()),
  openGraph: {
    title: "Ayeb Cafe Prediction | World Cup 2026",
    description:
      "Predict matches, win points, and join the elite leaderboard in the cozy and thrilling atmosphere of Ayeb Cafe.",
    images: ["/og-image.jpg"],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = getLocale(cookies().get("locale")?.value);
  const supabaseUser = await getUser();
  let dbUser = null;
  if (supabaseUser) {
    dbUser = await prisma.user.findUnique({
      where: { id: supabaseUser.id },
    });
  }

  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${inter.variable} ${outfit.variable} ${inter.className} font-sans antialiased text-stone-100 min-h-screen flex flex-col`}>
        <header className="sticky top-0 z-50 w-full bg-slate-950/88 backdrop-blur-xl border-b border-amber-500/15">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <img src="/logo.png" alt="Ayeb" className="w-16 h-16 object-contain" />
              <div>
                <span className="font-extrabold text-xl tracking-tight text-stone-100">
                  {t(locale, "siteName")}
                </span>
                <span className="hidden sm:inline-block ml-2 px-1.5 py-0.5 rounded-sm text-[10px] font-bold tracking-wider bg-emerald-500/12 text-emerald-300 border border-emerald-500/25">
                  PREDICTION
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-semibold text-stone-300 hover:text-amber-400 transition-colors">
                <Globe2 className="w-4 h-4" /> {t(locale, "nav.dashboard")}
              </Link>
              <Link href="/predictions" className="flex items-center gap-1.5 text-sm font-semibold text-stone-300 hover:text-amber-400 transition-colors">
                <Calendar className="w-4 h-4" /> {t(locale, "nav.predictions")}
              </Link>
              <Link href="/leaderboard" className="flex items-center gap-1.5 text-sm font-semibold text-stone-300 hover:text-amber-400 transition-colors">
                <Trophy className="w-4 h-4" /> {t(locale, "nav.leaderboard")}
              </Link>
              <Link href="/news" className="flex items-center gap-1.5 text-sm font-semibold text-stone-300 hover:text-amber-400 transition-colors">
                <Newspaper className="w-4 h-4" /> {t(locale, "nav.news")}
              </Link>
              <Link href="/#support" className="flex items-center gap-1.5 text-sm font-semibold text-stone-300 hover:text-amber-400 transition-colors">
                <User className="w-4 h-4" /> {t(locale, "nav.contact")}
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <LanguageSwitcher locale={locale} />
              {dbUser ? (
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex flex-col text-right">
                    <span className="text-sm font-bold text-stone-100">{dbUser.name}</span>
                    <span className="text-xs text-amber-400 font-medium">
                      Rank #{dbUser.rank} | {dbUser.totalPoints} pts
                    </span>
                  </div>
                  <div className="relative w-9 h-9 rounded-full bg-slate-900 border border-amber-500/25 flex items-center justify-center overflow-hidden">
                    {dbUser.avatarUrl ? (
                      <img src={dbUser.avatarUrl} alt={dbUser.name} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                  <form action={logout}>
                    <button type="submit" className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-red-950/40 hover:border-red-900/50 text-stone-400 hover:text-red-400 transition-all" title="Sign Out">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link href="/login" className="px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-900 text-stone-300 transition-all">
                    Login
                  </Link>
                  <Link href="/login?tab=signup" className="px-4 py-2 rounded-lg text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-sm shadow-amber-500/20">
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </header>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-950/92 backdrop-blur-xl border-t border-amber-500/15 px-4 py-2 flex justify-around items-center shadow-2xl">
          <Link href="/dashboard" className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-stone-400 hover:text-amber-400 transition-colors">
            <Globe2 className="w-5 h-5" /> {t(locale, "nav.dashboard")}
          </Link>
          <Link href="/predictions" className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-stone-400 hover:text-amber-400 transition-colors">
            <Calendar className="w-5 h-5" /> {t(locale, "nav.predictions")}
          </Link>
          <Link href="/leaderboard" className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-stone-400 hover:text-amber-400 transition-colors">
            <Trophy className="w-5 h-5" /> {t(locale, "nav.leaderboard")}
          </Link>
          <Link href="/news" className="flex flex-col items-center gap-0.5 text-[11px] font-medium text-stone-400 hover:text-amber-400 transition-colors">
            <Newspaper className="w-5 h-5" /> {t(locale, "nav.news")}
          </Link>
        </nav>

        <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          {children}
        </main>

        <footer className="w-full border-t border-slate-900 bg-slate-950/45 py-6 text-center text-xs text-stone-500">
          <p>{t(locale, "shared.disclaimer")}</p>
        </footer>
      </body>
    </html>
  );
}
