import { NextRequest, NextResponse } from "next/server";

const CLOB_API_BASE = "https://clob.polymarket.com";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const url = `${CLOB_API_BASE}/prices`;
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch prices: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching prices:", error);
    return NextResponse.json(
      { error: "Failed to fetch prices" },
      { status: 500 }
    );
  }
}

