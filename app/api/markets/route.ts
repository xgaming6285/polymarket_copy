import { NextRequest, NextResponse } from "next/server";

const GAMMA_API_BASE = "https://gamma-api.polymarket.com";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build query string from all search params
    const queryString = searchParams.toString();
    const url = `${GAMMA_API_BASE}/markets${queryString ? `?${queryString}` : ""}`;
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch markets: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching markets:", error);
    return NextResponse.json(
      { error: "Failed to fetch markets" },
      { status: 500 }
    );
  }
}

