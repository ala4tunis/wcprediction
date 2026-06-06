"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { localeLabels, locales, type Locale } from "@/lib/i18n";

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const changeLocale = async (nextLocale: Locale) => {
    document.cookie = `locale=${nextLocale}; path=/; max-age=31536000`;
    const params = new URLSearchParams(searchParams.toString());
    params.set("lang", nextLocale);
    router.refresh();
    router.push(`?${params.toString()}`);
  };

  return (
    <select
      value={locale}
      onChange={(event) => changeLocale(event.target.value as Locale)}
      className="rounded-lg bg-stone-900 border border-stone-800 text-stone-200 text-xs font-semibold px-2 py-2"
      aria-label="Language selector"
    >
      {locales.map((item) => (
        <option key={item} value={item}>
          {localeLabels[item]}
        </option>
      ))}
    </select>
  );
}
