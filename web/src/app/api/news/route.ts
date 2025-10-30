import { NextResponse, type NextRequest } from "next/server";

const YDC_API_KEY = process.env.YDC_API_KEY!;

// Helper function to convert page_age ISO string to timestamp
function pageAgeToTimestamp(pageAge: string): number {
  // Convert ISO timestamp string to Date object and then to milliseconds
  return new Date(pageAge).getTime();
}

export async function GET(request: NextRequest) {
  const url = new URL("https://api.ydc-index.io/livenews");
  url.searchParams.set("q", "News on investment, including stocks, commodities, market indices, and cryptocurrency. Also include news on macroeconomic factors that affects investments in general.");
  url.searchParams.set("count", "20");
  const response = await fetch(url.toString(), {
    headers: {
      "X-API-Key": YDC_API_KEY
    }
  });
  const data = await response.json();
  
  // Sort news by page_age (newest first) and add timestamp to each item
  const sortedNews = [...data.news.results].map((item: any) => {
    // Add a timestamp field to each news item based on page_age
    return {
      ...item,
      timestamp: pageAgeToTimestamp(item.page_age)
    };
  }).sort((a: any, b: any) => {
    // Sort by actual timestamp from page_age (newest first)
    return b.timestamp - a.timestamp;
  });
  
  return NextResponse.json({
    "news": sortedNews
  });
}
