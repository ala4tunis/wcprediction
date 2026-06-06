export type Locale = "en" | "fr" | "ar";

export const locales: Locale[] = ["en", "fr", "ar"];

export const localeLabels: Record<Locale, string> = {
  en: "English",
  fr: "Français",
  ar: "العربية",
};

export const translations = {
  en: {
    siteName: "Ayeb Cafe Prediction",
    nav: {
      dashboard: "Dashboard",
      predictions: "Predictions",
      leaderboard: "Leaderboard",
      news: "News",
      contact: "Contact",
    },
    home: {
      badge: "FIFA World Cup 2026 Prediction Challenge",
      title: "Predict Glory. Claim the Trophy.",
      description:
        "Join the ultimate World Cup 2026 prediction tournament at Ayeb Cafe. Compete with fans worldwide, predict match scores, group standings, and tournament awards to become the champion!",
      join: "Join the Tournament",
      signIn: "Sign In",
      goDashboard: "Go to Dashboard",
      cards: {
        matchTitle: "Match Predictions",
        matchBody: "Predict exact scores before kickoff. +3 points for perfect score, +1 point for correct result.",
        bonusTitle: "Early Finalist Bonus",
        bonusBody: "Predict finalists early for massive points! Round 1: +15 pts, Round 2: +13 pts, Round 3: +11 pts.",
        liveTitle: "Live Leaderboard",
        liveBody: "Watch your ranking change instantly as matches unfold.",
      },
      disclaimerTitle: "Gambling Disclaimer",
      disclaimerBody:
        "This website is for fun only. It is not made for gambling, betting, or any real-money activity.",
      supportTitle: "Report an Issue",
      supportBody: "Send a message to the admin if you spot a problem or need help.",
      supportSubmit: "Send Report",
      supportSuccess: "Your report was sent to the admin.",
    },
    shared: {
      backToDashboard: "Back to Dashboard",
      adminPanel: "Admin Panel",
      reportIssue: "Report an Issue",
      yourMessage: "Your message",
      yourEmail: "Your email",
      issueType: "Issue type",
      issuePlaceholder: "Describe the problem clearly...",
      submit: "Submit",
      loading: "Sending...",
      success: "Message sent successfully",
      error: "Could not send message",
      disclaimer:
        "This site is for fun only and is not intended for gambling, betting, or wagering of any kind.",
    },
  },
  fr: {
    siteName: "Ayeb Cafe Prediction",
    nav: {
      dashboard: "Tableau de bord",
      predictions: "Pronostics",
      leaderboard: "Classement",
      news: "Actualités",
      contact: "Contact",
    },
    home: {
      badge: "Défi de pronostics Coupe du Monde FIFA 2026",
      title: "Prédisez la gloire. Gagnez le trophée.",
      description:
        "Rejoignez le tournoi de pronostics ultime de la Coupe du Monde 2026 sur Ayeb Cafe. Affrontez des fans du monde entier, prédisez les scores, les classements et les récompenses du tournoi pour devenir champion !",
      join: "Rejoindre le tournoi",
      signIn: "Se connecter",
      goDashboard: "Aller au tableau de bord",
      cards: {
        matchTitle: "Pronostics des matchs",
        matchBody: "Prédisez les scores exacts avant le coup d'envoi. +3 points pour un score parfait, +1 point pour le bon résultat.",
        bonusTitle: "Bonus finalistes anticipés",
        bonusBody: "Prévoyez les finalistes tôt pour gagner un maximum de points ! Tour 1 : +15 pts, Tour 2 : +13 pts, Tour 3 : +11 pts.",
        liveTitle: "Classement en direct",
        liveBody: "Suivez l'évolution de votre rang au fil des matchs.",
      },
      disclaimerTitle: "Avertissement sur les jeux d'argent",
      disclaimerBody:
        "Ce site est uniquement destiné au divertissement. Il n'est pas conçu pour les jeux d'argent, les paris ou toute activité réelle avec de l'argent.",
      supportTitle: "Signaler un problème",
      supportBody: "Envoyez un message à l'admin si vous voyez un problème ou avez besoin d'aide.",
      supportSubmit: "Envoyer le signalement",
      supportSuccess: "Votre signalement a été envoyé à l'admin.",
    },
    shared: {
      backToDashboard: "Retour au tableau de bord",
      adminPanel: "Panneau admin",
      reportIssue: "Signaler un problème",
      yourMessage: "Votre message",
      yourEmail: "Votre e-mail",
      issueType: "Type de problème",
      issuePlaceholder: "Décrivez clairement le problème...",
      submit: "Envoyer",
      loading: "Envoi...",
      success: "Message envoyé avec succès",
      error: "Impossible d'envoyer le message",
      disclaimer:
        "Ce site est uniquement destiné au divertissement et n'est pas conçu pour les jeux d'argent, les paris ou les mises.",
    },
  },
  ar: {
    siteName: "توقعات أيّب كافيه",
    nav: {
      dashboard: "لوحة التحكم",
      predictions: "التوقعات",
      leaderboard: "الترتيب",
      news: "الأخبار",
      contact: "تواصل",
    },
    home: {
      badge: "تحدي توقعات كأس العالم FIFA 2026",
      title: "توقع المجد. احصد الكأس.",
      description:
        "انضم إلى بطولة التوقعات النهائية لكأس العالم 2026 على أيّب كافيه. تنافس مع المشجعين حول العالم، وتوقع النتائج والترتيب والجوائز لتصبح البطل!",
      join: "انضم إلى البطولة",
      signIn: "تسجيل الدخول",
      goDashboard: "اذهب إلى لوحة التحكم",
      cards: {
        matchTitle: "توقعات المباريات",
        matchBody: "توقع النتائج الدقيقة قبل انطلاق المباراة. 3 نقاط للنتيجة الكاملة و1 للنتيجة الصحيحة.",
        bonusTitle: "مكافأة المتأهلين المبكرين",
        bonusBody: "توقع المتأهلين مبكرًا لتحصد نقاطًا كبيرة! الجولة 1: 15، الجولة 2: 13، الجولة 3: 11.",
        liveTitle: "لوحة ترتيب مباشرة",
        liveBody: "تابع تغير ترتيبك فورًا مع تقدم المباريات.",
      },
      disclaimerTitle: "تنبيه بشأن المقامرة",
      disclaimerBody:
        "هذا الموقع مخصص للمتعة فقط. وهو غير مخصص للمقامرة أو المراهنة أو أي نشاط حقيقي بالمال.",
      supportTitle: "الإبلاغ عن مشكلة",
      supportBody: "أرسل رسالة إلى الإدارة إذا لاحظت مشكلة أو احتجت إلى مساعدة.",
      supportSubmit: "إرسال البلاغ",
      supportSuccess: "تم إرسال البلاغ إلى الإدارة.",
    },
    shared: {
      backToDashboard: "العودة إلى لوحة التحكم",
      adminPanel: "لوحة الإدارة",
      reportIssue: "الإبلاغ عن مشكلة",
      yourMessage: "رسالتك",
      yourEmail: "بريدك الإلكتروني",
      issueType: "نوع المشكلة",
      issuePlaceholder: "صف المشكلة بوضوح...",
      submit: "إرسال",
      loading: "جارٍ الإرسال...",
      success: "تم إرسال الرسالة بنجاح",
      error: "تعذر إرسال الرسالة",
      disclaimer:
        "هذا الموقع مخصص للمتعة فقط وليس للمقامرة أو المراهنة أو أي نشاط مالي حقيقي.",
    },
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function getLocale(value: string | null | undefined): Locale {
  return (value && locales.includes(value as Locale) ? value : "en") as Locale;
}

type TranslationTree = typeof translations.en;

export function t(locale: Locale, key: string): string {
  const segments = key.split(".");
  let current: string | TranslationTree | Record<string, unknown> = translations[locale];

  for (const segment of segments) {
    if (typeof current === "string" || current === null || typeof current !== "object") {
      return key;
    }
    current = current[segment as keyof typeof current] as string | TranslationTree | Record<string, unknown>;
  }

  return typeof current === "string" ? current : key;
}
