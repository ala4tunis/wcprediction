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
    <div className="flex flex-col items-center justify-center min-h-[80vh] turf-grid football-pattern relative py-12">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-gradient-to-tr from-yellow-500/15 to-emerald-500/10 blur-[80px] pointer-events-none -z-10" />

      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-950/40 border border-yellow-500/30 text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse text-center">
        <Circle className="w-3.5 h-3.5 fill-yellow-400" />
        {titles.badge}
      </div>

      <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-center tracking-tight max-w-4xl mb-6">
        <span className="trophy-shine">{titles.title.split(".")[0]}.</span>{" "}
        <span className="bg-gradient-to-r from-yellow-400 via-yellow-200 to-emerald-400 bg-clip-text text-transparent">
          {titles.title.split(".")[1]?.trim()}
        </span>
      </h1>

      <p className="text-stone-400 text-center text-base sm:text-xl max-w-2xl mb-10 leading-relaxed">
        {titles.description}
      </p>

      <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full justify-center max-w-md px-4">
        {user ? (
          <Link href="/dashboard" className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-bold transition-all shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 group w-full glow-gold">
            {titles.goDashboard}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        ) : (
          <>
            <Link href="/login?tab=signup" className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-stone-950 font-bold transition-all shadow-lg shadow-yellow-500/10 hover:shadow-yellow-500/20 group w-full sm:w-auto glow-gold">
              {titles.join}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/login" className="flex items-center justify-center px-8 py-4 rounded-xl bg-stone-900 border border-stone-800 hover:bg-stone-850 hover:border-yellow-500/30 text-stone-200 font-semibold transition-all w-full sm:w-auto">
              {titles.signIn}
            </Link>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4">
          <div className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-500/20 text-yellow-500">
            <Circle className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-stone-100">{titles.matchTitle}</h3>
          <p className="text-stone-400 text-sm leading-relaxed">{titles.matchBody}</p>
        </div>
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4">
          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/20 text-emerald-400">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-stone-100">{titles.bonusTitle}</h3>
          <p className="text-stone-400 text-sm leading-relaxed">{titles.bonusBody}</p>
        </div>
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl flex flex-col items-start gap-4">
          <div className="p-3 rounded-xl bg-yellow-950/40 border border-yellow-500/20 text-yellow-500">
            <Trophy className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-stone-100">{titles.liveTitle}</h3>
          <p className="text-stone-400 text-sm leading-relaxed">{titles.liveBody}</p>
        </div>
      </div>

      <div className="mt-12 glass-panel p-4 rounded-xl border border-yellow-900/30 text-stone-400 text-xs text-center max-w-3xl">
        <span className="font-bold text-yellow-500">{titles.disclaimerTitle}:</span> {titles.disclaimerBody}
      </div>

      <div id="support" className="w-full max-w-3xl mt-12 px-4">
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
