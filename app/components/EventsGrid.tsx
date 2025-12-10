"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Event, fetchEvents, fetchTags, Tag } from "../lib/polymarket";
import EventCard from "./EventCard";

interface EventsGridProps {
  activeTag?: string;
  sortBy?: string;
  frequency?: string;
  status?: string;
  hideSports?: boolean;
  hideCrypto?: boolean;
  hideEarnings?: boolean;
  searchQuery?: string;
}

export default function EventsGrid({
  activeTag = "All",
  sortBy = "24hr Volume",
  frequency = "All",
  status = "Active",
  hideSports = false,
  hideCrypto = false,
  hideEarnings = false,
  searchQuery = "",
}: EventsGridProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [activeTradingCardId, setActiveTradingCardId] = useState<string | null>(
    null
  );
  const observer = useRef<IntersectionObserver | null>(null);
  const ITEMS_PER_PAGE = 100;

  // Last element ref for infinite scroll
  const lastEventElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          setOffset((prevOffset) => prevOffset + ITEMS_PER_PAGE);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore, loading]
  );

  // Reset pagination when filters change
  useEffect(() => {
    setOffset(0);
    setEvents([]);
    setHasMore(true);
  }, [
    activeTag,
    sortBy,
    frequency,
    status,
    hideSports,
    hideCrypto,
    hideEarnings,
    searchQuery,
  ]);

  // Load initial tags once
  useEffect(() => {
    async function loadTags() {
      try {
        const tagsData = await fetchTags();
        setTags(tagsData);
      } catch (err) {
        console.error("Failed to load tags:", err);
      }
    }
    loadTags();
  }, []); // Only run once on mount

  useEffect(() => {
    async function loadData() {
      const isInitialLoad = offset === 0;

      if (isInitialLoad) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      try {
        // Build fetch params based on filters
        const params: Parameters<typeof fetchEvents>[0] = {
          limit: ITEMS_PER_PAGE,
          offset: offset,
          active: status === "Active" ? true : undefined,
          closed:
            status === "Resolved"
              ? true
              : status === "Active"
              ? false
              : undefined,
        };

        // Map sort options
        if (sortBy === "Trending") {
          params.order = "trending";
        } else if (sortBy === "24hr Volume" || sortBy === "Total Volume") {
          params.order = "volume";
        } else if (sortBy === "Liquidity") {
          params.order = "liquidity";
        } else if (sortBy === "Ending Soon") {
          params.order = "volume";
        } else if (sortBy === "Newest") {
          params.order = "volume";
        } else if (sortBy === "Competitive") {
          params.order = "competitive";
        }

        // Add tag filter if not "All"
        if (activeTag !== "All" && tags.length > 0) {
          // Special mappings for categories that don't match tag slugs exactly
          const categoryToSlugMap: Record<string, string> = {
            Culture: "pop-culture",
            // Add more mappings here as discovered
          };

          // First check if there's a special mapping
          let tagSlug = categoryToSlugMap[activeTag];

          if (!tagSlug) {
            // Try to find matching tag slug from the fetched tags
            const matchingTag = tags.find(
              (t) => t.label.toLowerCase() === activeTag.toLowerCase()
            );
            if (matchingTag) {
              tagSlug = matchingTag.slug;
            }
          }

          if (!tagSlug) {
            // Fallback: convert to lowercase with dashes
            tagSlug = activeTag.toLowerCase().replace(/\s+/g, "-");
          }

          params.tag_slug = tagSlug;
        }

        // Fetch events
        let eventsData = await fetchEvents(params);

        // Check if we got fewer events than requested (means no more data)
        if (eventsData.length < ITEMS_PER_PAGE) {
          setHasMore(false);
        }

        // Client-side sorting for options not supported by API
        if (sortBy === "Ending Soon") {
          eventsData = eventsData.sort((a, b) => {
            const dateA = a.end_date_iso
              ? new Date(a.end_date_iso).getTime()
              : Infinity;
            const dateB = b.end_date_iso
              ? new Date(b.end_date_iso).getTime()
              : Infinity;
            return dateA - dateB;
          });
        } else if (sortBy === "Newest") {
          eventsData = eventsData.sort((a, b) => {
            const dateA = a.start_date ? new Date(a.start_date).getTime() : 0;
            const dateB = b.start_date ? new Date(b.start_date).getTime() : 0;
            return dateB - dateA;
          });
        }

        // Client-side filtering
        eventsData = eventsData.filter((event) => {
          // Filter by search query
          if (searchQuery && searchQuery.trim() !== "") {
            const query = searchQuery.toLowerCase();
            const matchesTitle = event.title.toLowerCase().includes(query);
            const matchesDescription = event.description
              ?.toLowerCase()
              .includes(query);
            const matchesMarket = event.markets?.some((m) =>
              m.question?.toLowerCase().includes(query)
            );

            if (!matchesTitle && !matchesDescription && !matchesMarket) {
              return false;
            }
          }

          // Filter by category checkboxes
          const eventTags = event.tags?.map((t) => t.label.toLowerCase()) || [];

          if (hideSports && eventTags.some((t) => t.includes("sport"))) {
            return false;
          }

          if (
            hideCrypto &&
            eventTags.some((t) => t.includes("crypto") || t.includes("bitcoin"))
          ) {
            return false;
          }

          if (hideEarnings && eventTags.some((t) => t.includes("earning"))) {
            return false;
          }

          return true;
        });

        // Append new events to existing ones (or replace if initial load)
        if (isInitialLoad) {
          setEvents(eventsData);
        } else {
          setEvents((prevEvents) => [...prevEvents, ...eventsData]);
        }
      } catch (err) {
        console.error("Failed to load events:", err);
        setError(err instanceof Error ? err.message : "Failed to load events");
      } finally {
        if (isInitialLoad) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
      }
    }

    // Only load data if tags have been loaded or if we're filtering by "All"
    if (tags.length > 0 || activeTag === "All") {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    offset,
    activeTag,
    sortBy,
    frequency,
    status,
    hideSports,
    hideCrypto,
    hideEarnings,
    searchQuery,
    tags.length, // Using tags.length instead of tags to prevent infinite loop
  ]);

  if (loading) {
    return (
      <div className="px-3 sm:px-[6%] py-4 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="bg-[#2A3F54] rounded-lg p-3 h-40 animate-pulse"
            >
              <div className="h-4 bg-[#1D2B3A] rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-[#1D2B3A] rounded w-full mb-2"></div>
              <div className="h-3 bg-[#1D2B3A] rounded w-5/6 mb-4"></div>
              <div className="h-2 bg-[#1D2B3A] rounded w-full mb-4"></div>
              <div className="flex justify-between">
                <div className="h-3 bg-[#1D2B3A] rounded w-1/4"></div>
                <div className="h-3 bg-[#1D2B3A] rounded w-1/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 sm:px-[6%] py-4 sm:py-8">
        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 sm:p-6 text-center">
          <p className="text-red-400 font-medium mb-2">Failed to load events</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="px-3 sm:px-[6%] py-4 sm:py-8">
        <div className="bg-[#2A3F54] rounded-lg p-6 sm:p-8 text-center">
          <svg
            className="mx-auto mb-4 text-gray-400"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
          <p className="text-gray-400 text-lg">No events found</p>
          <p className="text-gray-500 text-sm mt-2">
            Try adjusting your filters or search query
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-[6%] pb-4 sm:pb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {events.map((event, index) => {
          if (events.length === index + 1) {
            // Last element - attach ref for intersection observer
            return (
              <div key={event.id} ref={lastEventElementRef}>
                <EventCard
                  event={event}
                  isActive={activeTradingCardId === event.id}
                  onActivate={() => setActiveTradingCardId(event.id)}
                  onDeactivate={() => setActiveTradingCardId(null)}
                />
              </div>
            );
          } else {
            return (
              <EventCard
                key={event.id}
                event={event}
                isActive={activeTradingCardId === event.id}
                onActivate={() => setActiveTradingCardId(event.id)}
                onDeactivate={() => setActiveTradingCardId(null)}
              />
            );
          }
        })}
      </div>

      {/* Loading more indicator */}
      {loadingMore && (
        <div className="mt-4 sm:mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-[#2A3F54] rounded-lg p-3 h-40 animate-pulse"
              >
                <div className="h-4 bg-[#1D2B3A] rounded w-3/4 mb-3"></div>
                <div className="h-3 bg-[#1D2B3A] rounded w-full mb-2"></div>
                <div className="h-3 bg-[#1D2B3A] rounded w-5/6 mb-4"></div>
                <div className="h-2 bg-[#1D2B3A] rounded w-full mb-4"></div>
                <div className="flex justify-between">
                  <div className="h-3 bg-[#1D2B3A] rounded w-1/4"></div>
                  <div className="h-3 bg-[#1D2B3A] rounded w-1/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No more events indicator */}
      {!hasMore && events.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">No more events to load</p>
        </div>
      )}
    </div>
  );
}
