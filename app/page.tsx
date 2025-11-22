"use client";

import { useState } from "react";
import Header from "./components/Header";
import FilterSection from "./components/FilterSection";
import EventsGrid from "./components/EventsGrid";

export default function Home() {
  const [filters, setFilters] = useState({
    activeTag: "All",
    sortBy: "Trending",
    frequency: "All",
    status: "Active",
    hideSports: false,
    hideCrypto: false,
    hideEarnings: false,
    searchQuery: "",
  });

  return (
    <div className="min-h-screen bg-[#1D2B3A]">
      <Header />
      <FilterSection onFiltersChange={setFilters} />
      <EventsGrid
        activeTag={filters.activeTag}
        sortBy={filters.sortBy}
        frequency={filters.frequency}
        status={filters.status}
        hideSports={filters.hideSports}
        hideCrypto={filters.hideCrypto}
        hideEarnings={filters.hideEarnings}
        searchQuery={filters.searchQuery}
      />
    </div>
  );
}
