export interface BreakingMarketHistory {
  t: number;
  p: number;
}

export interface BreakingMarket {
  id: string;
  slug: string;
  question: string;
  image: string;
  outcomePrices: string[];
  oneDayPriceChange: number;
  events: Array<{
    slug: string;
    volume: number;
    commentCount: number;
    seriesSlug?: string;
  }>;
  clobTokenIds: string[];
  history: BreakingMarketHistory[];
  currentPrice: number;
  livePriceChange: number;
  closed: boolean;
}

export interface BreakingResponse {
  markets: BreakingMarket[];
}

export interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author_id: string;
  hidden: boolean;
  link_url?: string;
  image_url?: string;
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
    bookmark_count: number;
    impression_count: number;
  };
  entities?: {
    annotations?: Array<{
      start: number;
      end: number;
      probability: number;
      type: string;
      normalized_text: string;
    }>;
    urls?: Array<{
      start: number;
      end: number;
      url: string;
      expanded_url: string;
      display_url: string;
    }>;
  };
}

export interface TweetsResponse {
  tweets: Tweet[];
}

export async function fetchBreakingMarkets(category?: string): Promise<BreakingMarket[]> {
  const params = new URLSearchParams();
  if (category) {
    params.append("category", category);
  }
  
  const url = `/api/breaking?${params.toString()}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch breaking markets: ${response.status}`);
    }
    const data: BreakingResponse = await response.json();
    return data.markets;
  } catch (error) {
    console.error("Error fetching breaking markets:", error);
    return [];
  }
}

export async function fetchTweets(): Promise<Tweet[]> {
  const url = `/api/tweets`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch tweets: ${response.status}`);
    }
    const data: TweetsResponse = await response.json();
    return data.tweets;
  } catch (error) {
    console.error("Error fetching tweets:", error);
    return [];
  }
}
