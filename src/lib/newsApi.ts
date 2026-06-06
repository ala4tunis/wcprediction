const NEWS_API_KEY = process.env.NEWS_API_KEY;

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: {
    name: string;
  };
  urlToImage?: string;
}

export async function fetchFootballNews(): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY) {
    console.warn("NEWS_API_KEY is missing. Using fallback data.");
    return [];
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=World%20Cup%202026%20OR%20FIFA%20World%20Cup%202026%20OR%20Qatar%202026&language=en&sortBy=publishedAt&pageSize=12&apiKey=${NEWS_API_KEY}`,
      { next: { revalidate: 1800 } } // Cache for 30 minutes
    );

    if (!response.ok) {
      console.warn("News API request failed:", response.statusText);
      return [];
    }

    const data = await response.json();
    const articles = data.articles || [];

    // Filter articles to ensure they're World Cup 2026 related
    const worldCupKeywords = [
      "world cup 2026",
      "fifa world cup 2026",
      "world cup",
      "fifa world cup",
      "qatar 2026",
      "north america 2026",
      "usa 2026",
      "mexico 2026",
      "canada 2026",
    ];

    const filteredArticles = articles.filter((article: NewsArticle) => {
      const titleLower = article.title.toLowerCase();
      const descriptionLower = article.description.toLowerCase();
      return worldCupKeywords.some(
        (keyword) =>
          titleLower.includes(keyword) || descriptionLower.includes(keyword)
      );
    });

    return filteredArticles.length > 0 ? filteredArticles : articles;
  } catch (error) {
    console.warn("Error fetching news:", error);
    return [];
  }
}

export async function fetchTeamNews(teamName: string): Promise<NewsArticle[]> {
  if (!NEWS_API_KEY) {
    return [];
  }

  try {
    const response = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(teamName)}%20football&language=en&sortBy=publishedAt&pageSize=5&apiKey=${NEWS_API_KEY}`,
      { next: { revalidate: 1800 } }
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();
    return data.articles || [];
  } catch (error) {
    console.warn(`Error fetching news for ${teamName}:`, error);
    return [];
  }
}
