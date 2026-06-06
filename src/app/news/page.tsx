import type { Metadata } from "next";
import Link from "next/link";
import { Newspaper, Rss, Calendar, ArrowUpRight, Sparkles } from "lucide-react";
import { fetchFootballNews } from "@/lib/newsApi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Football News & World Cup Updates | Ayeb Café",
  description: "Get the latest football news, tactical previews, group stage analysis, and RSS updates. Optimize your predictor strategies at Ayeb Café.",
  openGraph: {
    title: "Football News & World Cup Updates | Ayeb Café",
    description: "Read elite match reports, player reviews, and tactical reviews to refine your predictions at Ayeb Café.",
    type: "article",
    url: "/news",
  },
};

export default async function NewsPage() {
  // Try to fetch real news from API
  const apiArticles = await fetchFootballNews();

  let articles;

  if (apiArticles.length > 0) {
    // Use real news from API
    articles = apiArticles.map((article, index) => ({
      id: String(index + 1),
      title: article.title,
      summary: article.description,
      category: article.source.name,
      date: new Date(article.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      readTime: "3 min read",
      image: article.urlToImage || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=600&auto=format&fit=crop",
      url: article.url,
    }));
  } else {
    // Fallback to mock data if API fails
    articles = [
      {
        id: "1",
        title: "Argentina's Messi Eyes World Cup 2026 Swan Song",
        summary: "Lionel Messi confirms he will lead Argentina in what could be his final World Cup appearance. The reigning champions look to defend their title in North America.",
        category: "Argentina",
        date: "June 02, 2026",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=600&auto=format&fit=crop",
        url: "#",
      },
      {
        id: "2",
        title: "Brazil Announces Vinicius Jr. as New Captain for 2026 Campaign",
        summary: "Brazil national team names Vinicius Jr. as captain, marking a new era after Neymar's leadership. The Seleção aims for their sixth World Cup trophy.",
        category: "Brazil",
        date: "June 02, 2026",
        readTime: "5 min read",
        image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=600&auto=format&fit=crop",
        url: "#",
      },
      {
        id: "3",
        title: "France's Mbappé Ready to Lead Les Bleus to Glory",
        summary: "Kylian Mbappé expresses confidence in France's squad depth ahead of World Cup 2026. The 2018 champions look to reclaim the title they lost in 2022.",
        category: "France",
        date: "June 01, 2026",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=600&auto=format&fit=crop",
        url: "#",
      },
      {
        id: "4",
        title: "Germany Rebuilds Under New Coach for World Cup 2026",
        summary: "Germany national team undergoes transformation with new tactical approach. Young talents like Musiala and Wirtz expected to lead Die Mannschaft.",
        category: "Germany",
        date: "June 01, 2026",
        readTime: "5 min read",
        image: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=600&auto=format&fit=crop",
        url: "#",
      },
      {
        id: "5",
        title: "England's Kane Determined to End Trophy Drought",
        summary: "Harry Kane remains focused on bringing silverware to England. The Three Lions enter World Cup 2026 as one of the favorites with a strong squad.",
        category: "England",
        date: "May 31, 2026",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?q=80&w=600&auto=format&fit=crop",
        url: "#",
      },
      {
        id: "6",
        title: "Spain's Young Generation Ready to Shine on World Stage",
        summary: "Spain's La Roja boasts impressive youth talent including Pedri and Gavi. The 2010 champions aim to return to form with possession-based football.",
        category: "Spain",
        date: "May 31, 2026",
        readTime: "5 min read",
        image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=600&auto=format&fit=crop",
        url: "#",
      },
      {
        id: "7",
        title: "Portugal's Ronaldo Confirms Participation in World Cup 2026",
        summary: "Cristiano Ronaldo commits to playing in World Cup 2026 at age 41. Portugal looks to capitalize on their talented squad around their legendary captain.",
        category: "Portugal",
        date: "May 30, 2026",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=600&auto=format&fit=crop",
        url: "#",
      },
      {
        id: "8",
        title: "Netherlands' Van Dijk Leads Defensive Revival",
        summary: "Virgil van Dijk anchors a resurgent Dutch defense. The Netherlands aims to improve on their quarterfinal exit in 2022 with a balanced squad.",
        category: "Netherlands",
        date: "May 30, 2026",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=600&auto=format&fit=crop",
        url: "#",
      },
      {
        id: "9",
        title: "Belgium's Golden Generation Makes Final Push",
        summary: "Kevin De Bruyne and Romelu Lukaku lead Belgium's experienced squad. The Red Devils aim to finally reach a World Cup final before their core retires.",
        category: "Belgium",
        date: "May 29, 2026",
        readTime: "5 min read",
        image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=600&auto=format&fit=crop",
        url: "#",
      },
      {
        id: "10",
        title: "Croatia's Modrić Inspires Another World Cup Run",
        summary: "Luka Modrić continues to lead Croatia despite age. The 2018 finalists and 2022 third-place team remain dangerous with their midfield mastery.",
        category: "Croatia",
        date: "May 29, 2026",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1553778263-73a83bab9b0c?q=80&w=600&auto=format&fit=crop",
        url: "#",
      },
      {
        id: "11",
        title: "Uruguay's Emerging Talents Impress in Qualifiers",
        summary: "Uruguay's young stars including Darwin Núñez and Federico Valverde show promise. La Celeste aims to return to World Cup glory with their new generation.",
        category: "Uruguay",
        date: "May 28, 2026",
        readTime: "4 min read",
        image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=600&auto=format&fit=crop",
        url: "#",
      },
      {
        id: "12",
        title: "Italy Returns to World Cup After Missing 2022 Edition",
        summary: "Italy ends their World Cup absence with a strong qualifying campaign. The Azzurri look to add a fifth star to their jersey in North America.",
        category: "Italy",
        date: "May 28, 2026",
        readTime: "5 min read",
        image: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?q=80&w=600&auto=format&fit=crop",
        url: "#",
      },
    ];
  }

  // Structural JSON-LD news schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": "Ayeb Café Prediction Football News Hub",
    "description": "Latest tournament previews and point calculations from Ayeb Café.",
    "image": "https://ayeb-cafe.com/og-image.jpg",
    "datePublished": "2026-06-01T00:00:00Z",
    "author": {
      "@type": "Organization",
      "name": "Ayeb Café Media",
    },
  };

  return (
    <div className="flex flex-col gap-8">
      {/* JSON-LD structural schema insertion */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header section with RSS Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-850 pb-5">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-stone-100 flex items-center gap-2">
            <Newspaper className="w-8 h-8 text-yellow-500" /> Football News Hub
          </h1>
          <p className="text-stone-400 text-sm">
            Read expert match previews and tactical insights to stay ahead in your predictions.
          </p>
        </div>

        <Link
          href="/api/news/rss"
          target="_blank"
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 hover:text-yellow-350 hover:bg-yellow-500/15 font-bold text-xs transition-all shadow-md"
        >
          <Rss className="w-4 h-4 text-yellow-500" /> RSS Football Feed
        </Link>
      </div>

      {/* Hero Highlight Box */}
      <div className="relative glass-panel p-8 rounded-3xl overflow-hidden border border-stone-800 flex flex-col md:flex-row gap-6 items-center">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-emerald-500/5 blur-[50px] pointer-events-none -z-10" />

        <div className="w-full md:w-1/2 rounded-2xl overflow-hidden border border-stone-800 relative aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={articles[0].image} alt="World Cup Café Prediction" className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-yellow-500 text-stone-950 text-[9px] font-extrabold uppercase tracking-wider">
            {articles[0].category}
          </span>
        </div>

        <div className="w-full md:w-1/2 flex flex-col gap-3">
          <span className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 fill-yellow-500" /> Headline Feature
          </span>
          <a href={articles[0].url} target="_blank" rel="noopener noreferrer" className="block">
            <h2 className="text-2xl font-extrabold text-stone-100 hover:text-yellow-500 transition-colors leading-tight">
              {articles[0].title}
            </h2>
          </a>
          <p className="text-stone-400 text-sm leading-relaxed">
            {articles[0].summary}
          </p>
          <div className="flex items-center gap-4 text-xs text-stone-500 font-medium mt-2">
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {articles[0].date}</span>
            <span>•</span>
            <span>{articles[0].readTime}</span>
          </div>
        </div>
      </div>

      {/* Grid of other articles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.slice(1).map((art) => (
          <div key={art.id} className="glass-panel rounded-3xl border border-stone-800 overflow-hidden flex flex-col glass-panel-hover">
            <div className="relative aspect-video w-full border-b border-stone-850">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
              <span className="absolute top-3 left-3 px-2 py-0.5 rounded bg-stone-900 border border-stone-800 text-yellow-500 text-[9px] font-bold uppercase tracking-wider">
                {art.category}
              </span>
            </div>

            <div className="p-5 flex flex-col gap-3 flex-grow justify-between">
              <div className="flex flex-col gap-2">
                <a href={art.url} target="_blank" rel="noopener noreferrer" className="block">
                  <h3 className="text-base font-bold text-stone-100 hover:text-yellow-500 transition-colors line-clamp-2">
                    {art.title}
                  </h3>
                </a>
                <p className="text-stone-400 text-xs leading-relaxed line-clamp-3">
                  {art.summary}
                </p>
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-stone-850/50">
                <div className="flex items-center gap-3 text-[10px] text-stone-500">
                  <span>{art.date}</span>
                  <span>•</span>
                  <span>{art.readTime}</span>
                </div>
                <a href={art.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-yellow-500 font-bold hover:underline flex items-center gap-0.5">
                  Read <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
