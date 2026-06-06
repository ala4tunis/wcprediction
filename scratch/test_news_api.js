const NEWS_API_KEY = "4c57745888024f7db5887b0fb8a2ce99";

async function testNews() {
  const url = `https://newsapi.org/v2/everything?q=World%20Cup%202026%20OR%20FIFA%20World%20Cup&language=en&sortBy=publishedAt&pageSize=12&apiKey=${NEWS_API_KEY}`;
  console.log("Fetching url:", url);
  try {
    const response = await fetch(url);
    console.log("Status:", response.status);
    console.log("StatusText:", response.statusText);
    const data = await response.json();
    console.log("Total articles returned:", data.articles ? data.articles.length : 0);
    if (data.status === "error") {
      console.error("API Error:", data.message);
    } else if (data.articles && data.articles.length > 0) {
      console.log("Sample article title:", data.articles[0].title);
    }
  } catch (err) {
    console.error("Fetch failed:", err);
  }
}

testNews();
