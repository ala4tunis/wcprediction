async function testRss() {
  const url = "https://feeds.bbci.co.uk/sport/football/rss.xml";
  try {
    const res = await fetch(url);
    const xmlText = await res.text();
    
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemContent = match[1];
      
      const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))/);
      const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))/);
      const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))/);
      const pubDateMatch = itemContent.match(/<pubDate>(?:<!\[CDATA\[([\s\S]*?)\]\]>|([^<]*))/);
      const thumbMatch = itemContent.match(/<media:thumbnail[^>]+url="([^"]+)"/);
      
      const title = (titleMatch ? (titleMatch[1] || titleMatch[2]) : "").trim();
      const description = (descMatch ? (descMatch[1] || descMatch[2]) : "").trim();
      const link = (linkMatch ? (linkMatch[1] || linkMatch[2]) : "").trim();
      const pubDate = (pubDateMatch ? (pubDateMatch[1] || pubDateMatch[2]) : "").trim();
      const urlToImage = thumbMatch ? thumbMatch[1] : undefined;
      
      items.push({
        title,
        description,
        url: link,
        publishedAt: pubDate,
        source: { name: "BBC Sport" },
        urlToImage
      });
    }
    
    console.log("Parsed items count:", items.length);
    if (items.length > 0) {
      console.log("First item:", JSON.stringify(items[0], null, 2));
    }
  } catch (err) {
    console.error("Failed to fetch/parse RSS:", err);
  }
}

testRss();
