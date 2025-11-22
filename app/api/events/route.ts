import { NextRequest, NextResponse } from "next/server";

// Use Gamma API which is more stable than Next.js data endpoints
const GAMMA_API_BASE = "https://gamma-api.polymarket.com";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Build query string from all search params
    const queryString = searchParams.toString();
    const url = `${GAMMA_API_BASE}/events${
      queryString ? `?${queryString}` : ""
    }`;

    console.log("Fetching from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        `Failed to fetch: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        { error: `Failed to fetch events: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`Fetched ${Array.isArray(data) ? data.length : 0} events`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}
