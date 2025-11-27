// Polymarket API Client
// Use our Next.js API routes to avoid CORS issues

const getBaseUrl = () => {
  if (typeof window !== "undefined") return ""; // Browser should use relative path
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000"; // Default to localhost
};

const API_BASE = `${getBaseUrl()}/api`;

// Types
export interface Market {
  condition_id: string;
  question_id: string;
  tokens: Token[];
  rewards?: {
    event_id?: string;
    max_spread?: string;
    min_size?: number;
    rates?: Array<{
      outcome: string;
      rate: number;
    }>;
  };
  minimum_order_size?: number;
  minimum_tick_size?: number;
  description?: string;
  category?: string;
  end_date_iso?: string;
  game_start_time?: string;
  question?: string;
  market_slug?: string;
  min_incentive_size?: number;
  max_incentive_spread?: number;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  new?: boolean;
  featured?: boolean;
  submitted_by?: string;
  maker_base_fee?: number;
  taker_base_fee?: number;
  volume?: string;
  volume_24hr?: string;
  liquidity?: string;
  neg_risk?: boolean;
  neg_risk_market_id?: string;
  neg_risk_request_id?: string;
  clobTokenIds?: string[] | string; // Added for CLOB integration
  outcomes?: string[];
  outcomePrices?: string[] | string; // Can be JSON string or array
  accepting_orders?: boolean;
  accepting_order_timestamp?: string;
  enable_order_book?: boolean;
  seconds_delay?: number;
  icon?: string;
  image?: string;
  competitive?: number;
  groupItemTitle?: string;
}

export interface Token {
  token_id: string;
  outcome: string;
  price?: string;
  winner?: boolean;
}

export interface Event {
  id: string;
  slug: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  end_date_iso?: string;
  image?: string;
  icon?: string;
  active?: boolean;
  closed?: boolean;
  archived?: boolean;
  new?: boolean;
  featured?: boolean;
  restricted?: boolean;
  liquidity_num?: number;
  volume_num?: number;
  volume?: string;
  liquidity?: string;
  markets?: Market[];
  enable_order_book?: boolean;
  comment_count?: number;
  competitive?: number;
  tags?: Tag[];
  cyom?: boolean;
}

export interface Tag {
  id: string;
  label: string;
  slug: string;
}

export interface PriceData {
  token_id: string;
  price: string;
  market?: string;
}

// API Functions
export async function fetchEvents(params?: {
  limit?: number;
  offset?: number;
  archived?: boolean;
  closed?: boolean;
  active?: boolean;
  order?: "volume" | "liquidity" | "competitive" | "trending";
  ascending?: boolean;
  tag?: string;
  tag_slug?: string;
  slug?: string;
  category?: string;
}): Promise<Event[]> {
  const queryParams = new URLSearchParams();

  // For "trending", we'll use volume sorting with a higher limit
  if (params?.order === "trending") {
    queryParams.append("order", "volume");
    queryParams.append("ascending", "false"); // Highest volume first
    queryParams.append("limit", params?.limit?.toString() || "100");
  } else {
    if (params?.limit !== undefined)
      queryParams.append("limit", params.limit.toString());
    if (params?.order) queryParams.append("order", params.order);
    if (params?.ascending !== undefined)
      queryParams.append("ascending", params.ascending.toString());
  }

  if (params?.offset !== undefined)
    queryParams.append("offset", params.offset.toString());
  if (params?.archived !== undefined)
    queryParams.append("archived", params.archived.toString());
  if (params?.closed !== undefined)
    queryParams.append("closed", params.closed.toString());
  if (params?.active !== undefined)
    queryParams.append("active", params.active.toString());
  if (params?.tag) queryParams.append("tag", params.tag);
  if (params?.tag_slug) queryParams.append("tag_slug", params.tag_slug);
  if (params?.slug) queryParams.append("slug", params.slug);

  const url = `${API_BASE}/events?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch events: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}

export async function fetchEventById(eventId: string): Promise<Event> {
  const url = `${API_BASE}/events/${eventId}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch event: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching event:", error);
    throw error;
  }
}

export async function fetchEventBySlug(slug: string): Promise<Event | null> {
  try {
    const events = await fetchEvents({ slug });
    return events[0] || null;
  } catch (error) {
    console.error("Error fetching event by slug:", error);
    return null;
  }
}

export async function fetchMarkets(params?: {
  limit?: number;
  offset?: number;
  archived?: boolean;
  closed?: boolean;
  active?: boolean;
  order?: "volume" | "liquidity";
  ascending?: boolean;
  tag?: string;
}): Promise<Market[]> {
  const queryParams = new URLSearchParams();

  if (params?.limit !== undefined)
    queryParams.append("limit", params.limit.toString());
  if (params?.offset !== undefined)
    queryParams.append("offset", params.offset.toString());
  if (params?.archived !== undefined)
    queryParams.append("archived", params.archived.toString());
  if (params?.closed !== undefined)
    queryParams.append("closed", params.closed.toString());
  if (params?.active !== undefined)
    queryParams.append("active", params.active.toString());
  if (params?.order) queryParams.append("order", params.order);
  if (params?.ascending !== undefined)
    queryParams.append("ascending", params.ascending.toString());
  if (params?.tag) queryParams.append("tag", params.tag);

  const url = `${API_BASE}/markets?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch markets: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching markets:", error);
    throw error;
  }
}

export async function fetchMarketPrices(
  tokenIds: string[]
): Promise<PriceData[]> {
  const url = `${API_BASE}/prices`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token_ids: tokenIds }),
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch prices: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching prices:", error);
    throw error;
  }
}

export async function fetchTags(): Promise<Tag[]> {
  const url = `${API_BASE}/tags`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch tags: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching tags:", error);
    throw error;
  }
}

export async function fetchRelatedTags(tag: string): Promise<string[]> {
  // First, we need to determine the slug to query
  // For "All" or "Trending", we fetch from the main /tags endpoint and extract popular tags
  // For other categories, we use the filteredBySlug endpoint

  try {
    if (tag === "All" || tag === "Trending") {
      // Fetch all tags and return a curated list for trending
      const allTags = await fetchTags();

      // For trending/all, we could either:
      // 1. Return all tag labels
      // 2. Return a subset of popular tags
      // Let's return the first 30 tags as a reasonable default
      const trendingTags = ["All", ...allTags.slice(0, 30).map((t) => t.label)];
      return trendingTags;
    }

    // Special mappings for categories that don't match tag slugs exactly
    const categoryToSlugMap: Record<string, string> = {
      Culture: "pop-culture",
      // Add more mappings here as discovered
    };

    // For specific categories, we need to find the correct slug
    // First check if there's a special mapping
    let querySlug = categoryToSlugMap[tag];

    if (!querySlug) {
      // Try to fetch all tags and find a matching one
      const allTags = await fetchTags();
      const matchingTag = allTags.find(
        (t) =>
          t.label.toLowerCase() === tag.toLowerCase() ||
          t.slug.toLowerCase() === tag.toLowerCase().replace(/\s+/g, "-")
      );

      querySlug = matchingTag?.slug || tag.toLowerCase().replace(/\s+/g, "-");
    }

    // Now fetch related tags using the filteredBySlug endpoint
    const url = `${API_BASE}/tags/filtered?tag=${encodeURIComponent(
      querySlug
    )}`;

    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      console.warn(
        `Failed to fetch related tags for ${tag} (slug: ${querySlug})`
      );
      return ["All"];
    }

    const data: {
      id: string;
      label: string;
      slug: string;
      forceShow?: boolean;
      forceHide?: boolean;
      publishedAt?: string;
      createdAt: string;
      updatedAt?: string;
      createdBy?: number;
      updatedBy?: number;
    }[] = await response.json();

    // Return all tags without filtering (show both forceShow true/false and forceHide true/false)
    const tags = ["All", ...data.map((t) => t.label)];
    console.log(
      `[fetchRelatedTags] ${tag} -> ${querySlug} -> ${tags.length} tags:`,
      tags
    );
    return tags;
  } catch (error) {
    console.error("Error fetching related tags:", error);
    return ["All"];
  }
}

export async function searchMarkets(query: string): Promise<{
  markets: Market[];
  events: Event[];
}> {
  const url = `${API_BASE}/search?query=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Failed to search: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error searching:", error);
    throw error;
  }
}

// Helper function to get all token IDs from events
export function extractTokenIds(events: Event[]): string[] {
  const tokenIds: string[] = [];

  events.forEach((event) => {
    event.markets?.forEach((market) => {
      market.tokens.forEach((token) => {
        tokenIds.push(token.token_id);
      });
    });
  });

  return tokenIds;
}

// Helper function to map categories
export function mapCategoryToTag(category: string): string | undefined {
  const categoryMap: Record<string, string> = {
    Politics: "politics",
    Sports: "sports",
    Finance: "finance",
    Crypto: "crypto",
    Geopolitics: "geopolitics",
    Earnings: "earnings",
    Tech: "technology",
    Culture: "culture",
    World: "world",
    Economy: "economy",
    Elections: "elections",
  };

  return categoryMap[category];
}
