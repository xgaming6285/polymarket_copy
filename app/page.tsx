"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "./components/Header";
import FilterSection from "./components/FilterSection";
import EventsGrid from "./components/EventsGrid";
import { fetchRelatedTags } from "./lib/polymarket";

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Derived state from URL
  const activeTag = searchParams.get("tag") || "All";
  const sortParam = searchParams.get("sort");

  let sortBy = "Trending";
  if (sortParam === "new") sortBy = "Newest";
  else if (sortParam === "volume") sortBy = "24hr Volume";
  else if (sortParam === "total_volume") sortBy = "Total Volume";
  else if (sortParam === "liquidity") sortBy = "Liquidity";
  else if (sortParam === "ending_soon") sortBy = "Ending Soon";
  else if (sortParam === "competitive") sortBy = "Competitive";
  else if (sortParam === "trending") sortBy = "Trending";

  const [otherFilters, setOtherFilters] = useState({
    frequency: "All",
    status: "Active",
    hideSports: false,
    hideCrypto: false,
    hideEarnings: false,
    searchQuery: "",
  });

  const [relatedTags, setRelatedTags] = useState<string[]>(["All"]);

  useEffect(() => {
    async function loadRelatedTags() {
      const tags = await fetchRelatedTags(activeTag);
      setRelatedTags(tags);
    }
    loadRelatedTags();
  }, [activeTag]);

  const handleFiltersChange = (newFilters: {
    activeTag: string;
    sortBy: string;
    frequency: string;
    status: string;
    hideSports: boolean;
    hideCrypto: boolean;
    hideEarnings: boolean;
    searchQuery: string;
  }) => {
    setOtherFilters({
      frequency: newFilters.frequency,
      status: newFilters.status,
      hideSports: newFilters.hideSports,
      hideCrypto: newFilters.hideCrypto,
      hideEarnings: newFilters.hideEarnings,
      searchQuery: newFilters.searchQuery,
    });

    const params = new URLSearchParams(searchParams.toString());

    // Update Tag
    if (newFilters.activeTag !== "All") {
      params.set("tag", newFilters.activeTag);
    } else {
      params.delete("tag");
    }

    // Update Sort
    if (newFilters.sortBy === "Newest") params.set("sort", "new");
    else if (newFilters.sortBy === "24hr Volume") params.set("sort", "volume");
    else if (newFilters.sortBy === "Total Volume")
      params.set("sort", "total_volume");
    else if (newFilters.sortBy === "Liquidity") params.set("sort", "liquidity");
    else if (newFilters.sortBy === "Ending Soon")
      params.set("sort", "ending_soon");
    else if (newFilters.sortBy === "Competitive")
      params.set("sort", "competitive");
    else if (newFilters.sortBy === "Trending") params.delete("sort");

    const newUrl = `/?${params.toString()}`;
    if (newUrl !== `/?${searchParams.toString()}`) {
      router.push(newUrl);
    }
  };

  return (
    <div className="min-h-screen bg-[#1D2B3A]">
      <Header />
      <div className="pt-0">
        <FilterSection
          onFiltersChange={handleFiltersChange}
          activeTag={activeTag}
          sortBy={sortBy}
          tags={relatedTags}
        />
        <EventsGrid
          activeTag={activeTag}
          sortBy={sortBy}
          frequency={otherFilters.frequency}
          status={otherFilters.status}
          hideSports={otherFilters.hideSports}
          hideCrypto={otherFilters.hideCrypto}
          hideEarnings={otherFilters.hideEarnings}
          searchQuery={otherFilters.searchQuery}
        />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1D2B3A]" />}>
      <HomeContent />
    </Suspense>
  );
}
