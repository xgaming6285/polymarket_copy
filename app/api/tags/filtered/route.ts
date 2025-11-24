import { NextResponse } from "next/server";

// Note: This endpoint seems to use the main Polymarket API, not the Gamma API.
// Gamma API endpoint for tags is different.
const POLYMARKET_MAIN_API = "https://polymarket.com/api";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tag = searchParams.get("tag");
  const status = searchParams.get("status") || "active";

  if (!tag) {
    return NextResponse.json(
      { error: "Tag parameter is required" },
      { status: 400 }
    );
  }

  try {
    const url = `${POLYMARKET_MAIN_API}/tags/filteredBySlug?tag=${encodeURIComponent(
      tag
    )}&status=${status}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        // Add a User-Agent to look like a browser, as main site API might check
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch filtered tags: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching filtered tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch filtered tags" },
      { status: 500 }
    );
  }
}

