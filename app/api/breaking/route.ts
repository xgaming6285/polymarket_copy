import { NextRequest, NextResponse } from "next/server";

const API_BASE = "https://polymarket.com/api/biggest-movers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    let url = API_BASE;
    if (category) {
      url += `?category=${category}`;
    }

    console.log("Fetching from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36" // Sometimes needed for direct site APIs
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        { error: `Failed to fetch breaking news: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching breaking news:", error);
    return NextResponse.json(
      { error: "Failed to fetch breaking news" },
      { status: 500 }
    );
  }
}

