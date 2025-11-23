import { NextRequest, NextResponse } from "next/server";

const CLOB_API_BASE = "https://clob.polymarket.com";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tokenId = searchParams.get("tokenId");

    if (!tokenId) {
      return NextResponse.json(
        { error: "tokenId is required" },
        { status: 400 }
      );
    }

    const url = `${CLOB_API_BASE}/book?token_id=${tokenId}`;
    
    console.log("Fetching order book from:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `Failed to fetch order book: ${response.status} ${response.statusText} - ${errorText}`
      );
      return NextResponse.json(
        { error: `Failed to fetch order book: ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching order book:", error);
    return NextResponse.json(
      { error: "Failed to fetch order book" },
      { status: 500 }
    );
  }
}

