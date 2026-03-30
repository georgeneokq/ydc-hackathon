import { NextResponse, type NextRequest } from "next/server";

// Ensure you set this in your .env.local
const GNEWS_API_KEY = process.env.GNEWS_API_KEY!;

function publishedAtToTimestamp(publishedAt: string): number {
  return new Date(publishedAt).getTime();
}

export async function GET(request: NextRequest) {
  const url = new URL("https://gnews.io/api/v4/search");
  
  // GNews specific params
  url.searchParams.set("q", "investment OR stocks OR commodities OR cryptocurrency OR macroeconomics");
  url.searchParams.set("max", "10"); // Free tier limit is often 10 per request
  url.searchParams.set("lang", "en");
  url.searchParams.set("sortby", "publishedAt"); // GNews can sort server-side
  url.searchParams.set("apikey", GNEWS_API_KEY); 
  try {
    console.log(url)
    const response = await fetch(url.toString());
    // TODO: FIND OUT WHY GOT ERROR 500
    console.log(response)
    const data = await response.json();
    console.log(data)

    if (!response.ok) {
      return NextResponse.json({ error: data.errors || "GNews API Error" }, { status: response.status });
    }

    // Map GNews 'articles' to your existing 'news' structure
    const sortedNews = (data.articles || []).map((item: any) => {
      return {
        ...item,
        // Mapping GNews fields to match your frontend expectations if needed
        title: item.title,
        description: item.description,
        url: item.url,
        image: item.image,
        source: item.source.name,
        timestamp: publishedAtToTimestamp(item.publishedAt)
      };
    });

    return NextResponse.json({
      "news": sortedNews
    });
  } catch (error) {
    console.log(error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}