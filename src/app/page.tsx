import Link from "next/link";
import { Trophy, Zap, ArrowRight, Circle } from "lucide-react";
import { getUser } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { getLocale, t } from "@/lib/i18n";
import SupportForm from "@/components/SupportForm";

export default async function Home() {
  const user = await getUser();
  const locale = getLocale(cookies().get("locale")?.value);
  const titles = {
    badge: t(locale, "home.badge"),
    title: t(locale, "home.title"),
    description: t(locale, "home.description"),
    join: t(locale, "home.join"),
    signIn: t(locale, "home.signIn"),
    goDashboard: t(locale, "home.goDashboard"),
    matchTitle: t(locale, "home.cards.matchTitle"),
    matchBody: t(locale, "home.cards.matchBody"),
    bonusTitle: t(locale, "home.cards.bonusTitle"),
    bonusBody: t(locale, "home.cards.bonusBody"),
    liveTitle: t(locale, "home.cards.liveTitle"),
    liveBody: t(locale, "home.cards.liveBody"),
    disclaimerTitle: t(locale, "home.disclaimerTitle"),
    disclaimerBody: t(locale, "home.disclaimerBody"),
    supportTitle: t(locale, "home.supportTitle"),
    supportSubmit: t(locale, "home.supportSubmit"),
    supportSuccess: t(locale, "home.supportSuccess"),
  };
  const shared = {
    yourEmail: t(locale, "shared.yourEmail"),
    issueType: t(locale, "shared.issueType"),
    yourMessage: t(locale, "shared.yourMessage"),
    issuePlaceholder: t(locale, "shared.issuePlaceholder"),
    loading: t(locale, "shared.loading"),
    error: t(locale, "shared.error"),
  };

  return (
    <div className="relative py-10 sm:py-14">
      <section className="min-h-[68vh] flex items-stretch">
        <div
          className="relative overflow-hidden border border-amber-500/18 px-6 py-8 sm:px-10 sm:py-12 shadow-[0_26px_70px_rgba(0,0,0,0.28)] w-full"
          style={{
            backgroundImage: "url('/hero-bg.png')",
            backgroundSize: "cover",
            backgroundPosition: "center right",
          }}
        >
          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/50" />
          <div className="absolute inset-y-0 left-0 w-1.5 bg-amber-500" />
          <div className="absolute inset-0 football-pattern opacity-20" />
          <div className="absolute right-5 top-5 hidden sm:grid grid-cols-4 gap-1 opacity-45">
            {Array.from({ length: 16 }).map((_, index) => (
              <span key={index} className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            ))}
          </div>

          <div className="relative inline-flex items-center gap-2 border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.18em] text-amber-300 mb-8 text-center">
            <Circle className="w-3.5 h-3.5 fill-amber-400" />
            {titles.badge}
          </div>

          <h1 className="relative text-4xl sm:text-6xl md:text-7xl font-black tracking-tight max-w-4xl mb-6 leading-[0.93] text-stone-100">
            <span>{titles.title.split(".")[0]}.</span>{" "}
            <span className="block trophy-shine">{titles.title.split(".")[1]?.trim()}</span>
          </h1>

          <p className="relative text-stone-400 text-base sm:text-xl max-w-2xl mb-10 leading-relaxed">
            {titles.description}
          </p>

          <div className="relative flex flex-col sm:flex-row gap-3 w-full max-w-md">
            {user ? (
              <Link href="/dashboard" className="flex items-center justify-center gap-2 px-7 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold transition-all group w-full shadow-lg shadow-amber-500/15">
                {titles.goDashboard}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <>
                <Link href="/login?tab=signup" className="flex items-center justify-center gap-2 px-7 py-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold transition-all group w-full sm:w-auto shadow-lg shadow-amber-500/15">
                  {titles.join}
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/login" className="flex items-center justify-center px-7 py-4 border border-emerald-500/30 hover:border-amber-500/45 bg-slate-900/70 text-stone-200 font-bold transition-all w-full sm:w-auto">
                  {titles.signIn}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        <div className="glass-panel p-6 flex flex-col items-start gap-4">
          <div className="p-3 bg-amber-500 text-slate-950">
            <Circle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-stone-100">{titles.matchTitle}</h3>
          <p className="text-stone-400 text-sm leading-relaxed">{titles.matchBody}</p>
        </div>
        <div className="bg-emerald-950/55 border border-emerald-500/25 p-6 flex flex-col items-start gap-4 text-stone-100">
          <div className="p-3 bg-emerald-400/12 text-emerald-300">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black">{titles.bonusTitle}</h3>
          <p className="text-stone-400 text-sm leading-relaxed">{titles.bonusBody}</p>
        </div>
        <div className="glass-panel p-6 flex flex-col items-start gap-4">
          <div className="p-3 bg-slate-800 text-amber-300 border border-amber-500/20">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-black text-stone-100">{titles.liveTitle}</h3>
          <p className="text-stone-400 text-sm leading-relaxed">{titles.liveBody}</p>
        </div>
      </div>

      <div className="mt-8 bg-slate-950/55 p-4 border-l-4 border-amber-500 text-stone-400 text-xs max-w-3xl">
        <span className="font-black text-amber-300">{titles.disclaimerTitle}:</span> {titles.disclaimerBody}
      </div>

      <div id="support" className="w-full max-w-3xl mt-12">
        <SupportForm
          locale={locale}
          labels={{
            reportIssue: titles.supportTitle,
            yourEmail: shared.yourEmail,
            issueType: shared.issueType,
            yourMessage: shared.yourMessage,
            issuePlaceholder: shared.issuePlaceholder,
            submit: titles.supportSubmit,
            loading: shared.loading,
            success: titles.supportSuccess,
            error: shared.error,
          }}
        />
      </div>
    </div>
  );
}
