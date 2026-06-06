import { fetchFootballNews } from "@/lib/newsApi";

export const dynamic = "force-dynamic";

export async function GET() {
  // Try to fetch real news from API
  const apiArticles = await fetchFootballNews();

  let articles;

  if (apiArticles.length > 0) {
    // Use real news from API
    articles = apiArticles.map((article) => ({
      title: article.title,
      description: article.description,
      link: article.url,
      pubDate: new Date(article.publishedAt).toUTCString(),
    }));
  } else {
    // Fallback to mock data if API fails
    articles = [
      {
        title: "Argentina's Messi eyes World Cup 2026 swan song",
        description: "Lionel Messi confirms he will lead Argentina in what could be his final World Cup appearance. The reigning champions look to defend their title in North America.",
        link: "https://ayeb-cafe.com/news/1",
        pubDate: new Date().toUTCString(),
      },
      {
        title: "Brazil announces Vinicius Jr. as new captain for 2026 campaign",
        description: "Brazil national team names Vinicius Jr. as captain, marking a new era after Neymar's leadership. The Seleção aims for their sixth World Cup trophy.",
        link: "https://ayeb-cafe.com/news/2",
        pubDate: new Date(Date.now() - 6 * 3600 * 1000).toUTCString(),
      },
      {
        title: "France's Mbappé ready to lead Les Bleus to glory",
        description: "Kylian Mbappé expresses confidence in France's squad depth ahead of World Cup 2026. The 2018 champions look to reclaim the title they lost in 2022.",
        link: "https://ayeb-cafe.com/news/3",
        pubDate: new Date(Date.now() - 12 * 3600 * 1000).toUTCString(),
      },
      {
        title: "Germany rebuilds under new coach for World Cup 2026",
        description: "Germany national team undergoes transformation with new tactical approach. Young talents like Musiala and Wirtz expected to lead Die Mannschaft.",
        link: "https://ayeb-cafe.com/news/4",
        pubDate: new Date(Date.now() - 18 * 3600 * 1000).toUTCString(),
      },
      {
        title: "England's Kane determined to end trophy drought",
        description: "Harry Kane remains focused on bringing silverware to England. The Three Lions enter World Cup 2026 as one of the favorites with a strong squad.",
        link: "https://ayeb-cafe.com/news/5",
        pubDate: new Date(Date.now() - 24 * 3600 * 1000).toUTCString(),
      },
      {
        title: "Spain's young generation ready to shine on world stage",
        description: "Spain's La Roja boasts impressive youth talent including Pedri and Gavi. The 2010 champions aim to return to form with possession-based football.",
        link: "https://ayeb-cafe.com/news/6",
        pubDate: new Date(Date.now() - 30 * 3600 * 1000).toUTCString(),
      },
      {
        title: "Portugal's Ronaldo confirms participation in World Cup 2026",
        description: "Cristiano Ronaldo commits to playing in World Cup 2026 at age 41. Portugal looks to capitalize on their talented squad around their legendary captain.",
        link: "https://ayeb-cafe.com/news/7",
        pubDate: new Date(Date.now() - 36 * 3600 * 1000).toUTCString(),
      },
      {
        title: "Netherlands' Van Dijk leads defensive revival",
        description: "Virgil van Dijk anchors a resurgent Dutch defense. The Netherlands aims to improve on their quarterfinal exit in 2022 with a balanced squad.",
        link: "https://ayeb-cafe.com/news/8",
        pubDate: new Date(Date.now() - 42 * 3600 * 1000).toUTCString(),
      },
      {
        title: "Belgium's Golden Generation makes final push",
        description: "Kevin De Bruyne and Romelu Lukaku lead Belgium's experienced squad. The Red Devils aim to finally reach a World Cup final before their core retires.",
        link: "https://ayeb-cafe.com/news/9",
        pubDate: new Date(Date.now() - 48 * 3600 * 1000).toUTCString(),
      },
      {
        title: "Croatia's Modrić inspires another World Cup run",
        description: "Luka Modrić continues to lead Croatia despite age. The 2018 finalists and 2022 third-place team remain dangerous with their midfield mastery.",
        link: "https://ayeb-cafe.com/news/10",
        pubDate: new Date(Date.now() - 54 * 3600 * 1000).toUTCString(),
      },
      {
        title: "Uruguay's emerging talents impress in qualifiers",
        description: "Uruguay's young stars including Darwin Núñez and Federico Valverde show promise. La Celeste aims to return to World Cup glory with their new generation.",
        link: "https://ayeb-cafe.com/news/11",
        pubDate: new Date(Date.now() - 60 * 3600 * 1000).toUTCString(),
      },
      {
        title: "Italy returns to World Cup after missing 2022 edition",
        description: "Italy ends their World Cup absence with a strong qualifying campaign. The Azzurri look to add a fifth star to their jersey in North America.",
        link: "https://ayeb-cafe.com/news/12",
        pubDate: new Date(Date.now() - 66 * 3600 * 1000).toUTCString(),
      },
    ];
  }

  const rssXml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>Ayeb Café Prediction Football News Feed</title>
  <link>https://ayeb-cafe.com/news</link>
  <description>Latest football updates, match predictions, and leaderboard highlights from Ayeb Café.</description>
  <language>en-us</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="https://ayeb-cafe.com/api/news/rss" rel="self" type="application/rss+xml" />
  ${articles
    .map(
      (art) => `
  <item>
    <title>${escapeXml(art.title)}</title>
    <link>${art.link}</link>
    <description>${escapeXml(art.description)}</description>
    <pubDate>${art.pubDate}</pubDate>
    <guid>${art.link}</guid>
  </item>`
    )
    .join("")}
</channel>
</rss>`;

  return new Response(rssXml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}

function escapeXml(unsafe: string) {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case "&":
        return "&amp;";
      case "'":
        return "&apos;";
      case '"':
        return "&quot;";
      default:
        return c;
    }
  });
}
