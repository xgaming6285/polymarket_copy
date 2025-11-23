"use client";

import { useState, useRef, useEffect } from "react";

interface FilterSectionProps {
  onFiltersChange?: (filters: {
    activeTag: string;
    sortBy: string;
    frequency: string;
    status: string;
    hideSports: boolean;
    hideCrypto: boolean;
    hideEarnings: boolean;
    searchQuery: string;
  }) => void;
}

export default function FilterSection({ onFiltersChange }: FilterSectionProps) {
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [sortBy, setSortBy] = useState("Trending");
  const [frequency, setFrequency] = useState("All");
  const [status, setStatus] = useState("Active");
  const [hideSports, setHideSports] = useState(false);
  const [hideCrypto, setHideCrypto] = useState(false);
  const [hideEarnings, setHideEarnings] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [frequencyOpen, setFrequencyOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeTag, setActiveTag] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Notify parent of filter changes
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        activeTag,
        sortBy,
        frequency,
        status,
        hideSports,
        hideCrypto,
        hideEarnings,
        searchQuery,
      });
    }
  }, [
    activeTag,
    sortBy,
    frequency,
    status,
    hideSports,
    hideCrypto,
    hideEarnings,
    searchQuery,
    onFiltersChange,
  ]);

  const tags = [
    "All",
    "Trump",
    "Ukraine",
    "Epstein",
    "Trump x Mamdani",
    "Fed",
    "Token Sales",
    "Gemini 3",
    "Venezuela",
    "Best of 2025",
    "Monad",
    "Chile Election",
    "Gaza",
    "China",
    "Mamdani",
    "Google Search",
    "Earnings",
    "Global Elections",
    "Israel",
    "Trade War",
    "India-Pakistan",
    "AI",
    "Parlays",
    "Earn 4%",
    "US Election",
    "Crypto Prices",
    "Bitcoin",
    "Weather",
    "Movies",
  ];

  const updateScrollButtons = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    // Initial check after mount
    const timer = setTimeout(() => {
      updateScrollButtons();
    }, 100);

    const handleResize = () => updateScrollButtons();
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const scrollRight = () => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth / 2;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(updateScrollButtons, 300);
    }
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      const scrollAmount = scrollRef.current.clientWidth / 2;
      scrollRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
      setTimeout(updateScrollButtons, 300);
    }
  };

  return (
    <div className="bg-[#1D2B3A]">
      {/* Search and Filter Bar */}
      <div className="flex items-center gap-4 px-[6%] py-3">
        {/* Search */}
        <div className="relative w-53">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#2f3f50] text-white placeholder-gray-400 rounded-lg px-4 py-2 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>

        {/* Filter Icon */}
        <button
          onClick={() => setFiltersVisible(!filtersVisible)}
          className={`p-2 ${
            filtersVisible ? "text-white" : "text-gray-400 hover:text-white"
          }`}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <line x1="4" y1="6" x2="16" y2="6"></line>
            <line x1="8" y1="12" x2="20" y2="12"></line>
            <line x1="4" y1="18" x2="16" y2="18"></line>
            <circle cx="18" cy="6" r="2"></circle>
            <circle cx="6" cy="12" r="2"></circle>
            <circle cx="18" cy="18" r="2"></circle>
          </svg>
        </button>

        {/* Bookmark Icon */}
        <button className="p-2 text-gray-400 hover:text-white">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
          </svg>
        </button>

        {/* Vertical Separator */}
        <div className="h-6 w-px bg-gray-600"></div>

        {/* Tags Container with Overlay Arrows */}
        <div className="flex-1 relative flex items-center min-w-0">
          {/* Left Arrow - Overlayed on left side */}
          <div
            className={`absolute top-0 bottom-0 z-10 flex items-center pointer-events-none ${
              canScrollLeft ? "opacity-100" : "opacity-0"
            } transition-opacity duration-200 bg-linear-to-r from-[#1D2B3A] via-[#1D2B3A] to-transparent pl-2 pr-8`}
            style={{ left: "-15px" }}
          >
            <button
              onClick={scrollLeft}
              className="pointer-events-auto text-gray-400 hover:text-white p-1"
            >
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          </div>

          {/* All button - Overlayed on left side when at start */}
          <div
            className={`absolute left-0 top-0 bottom-0 z-10 flex items-center ${
              !canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
            } transition-opacity duration-200`}
          >
            <button
              onClick={() => setActiveTag("All")}
              className={`whitespace-nowrap m-0 px-3 py-1.5 rounded-md ${
                activeTag === "All"
                  ? "bg-[#20415A] text-[#2C9CDB]"
                  : "text-gray-400 hover:text-white"
              }`}
              style={{ fontSize: "15px" }}
            >
              All
            </button>
          </div>

          {/* Tags */}
          <div
            ref={scrollRef}
            className="flex-1 flex items-center gap-0 overflow-x-auto scrollbar-hide min-w-0"
            onScroll={updateScrollButtons}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingLeft: "48px",
            }}
          >
            {tags.slice(1).map((tag, index) => (
              <button
                key={index}
                onClick={() => setActiveTag(tag)}
                className={`whitespace-nowrap shrink-0 m-0 px-3 py-1.5 rounded-md ${
                  activeTag === tag
                    ? "bg-[#20415A] text-[#2C9CDB]"
                    : "text-gray-400 hover:text-white"
                }`}
                style={{ fontSize: "15px" }}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Right Arrow - Overlayed on right side */}
          <div
            className={`absolute right-0 top-0 bottom-0 z-10 flex items-center pointer-events-none ${
              canScrollRight ? "opacity-100" : "opacity-0"
            } transition-opacity duration-200 bg-linear-to-l from-[#1D2B3A] via-[#1D2B3A] to-transparent pr-2 pl-8`}
          >
            <button
              onClick={scrollRight}
              className="pointer-events-auto text-gray-400 hover:text-white p-1"
            >
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Sorting and Options - Only visible when filter button is clicked */}
      {filtersVisible && (
        <div className="flex items-center gap-2 px-[6%] py-3 border-t border-[#2A3F54]">
          {/* Sort By */}
          <div className="relative">
            <button
              onClick={() => setSortOpen(!sortOpen)}
              className="flex items-center gap-1 text-white hover:bg-[#4a637b] bg-[#3D5266] px-2 py-1.5 rounded-full transition-colors"
            >
              <span className="text-sm text-gray-400">Sort by:</span>
              <span className="text-sm font-medium">{sortBy}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {sortOpen && (
              <div className="absolute left-0 mt-2 w-48 bg-[#2A3F54] rounded-lg shadow-lg py-2 z-50">
                <button
                  onClick={() => {
                    setSortBy("Trending");
                    setSortOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-[#3D5266] flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  </svg>
                  <span>Trending</span>
                </button>
                <button
                  onClick={() => {
                    setSortBy("24hr Volume");
                    setSortOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-[#3D5266] flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                  </svg>
                  <span>24hr Volume</span>
                </button>
                <button
                  onClick={() => {
                    setSortBy("Total Volume");
                    setSortOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-[#3D5266] flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  <span>Total Volume</span>
                </button>
                <button
                  onClick={() => {
                    setSortBy("Liquidity");
                    setSortOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-[#3D5266] flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                  </svg>
                  <span>Liquidity</span>
                </button>
                <button
                  onClick={() => {
                    setSortBy("Newest");
                    setSortOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-[#3D5266] flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20 9v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V9"></path>
                    <path d="M9 22V12h6v10M2 10.6L12 2l10 8.6"></path>
                  </svg>
                  <span>Newest</span>
                </button>
                <button
                  onClick={() => {
                    setSortBy("Ending Soon");
                    setSortOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-[#3D5266] flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                  </svg>
                  <span>Ending Soon</span>
                </button>
                <button
                  onClick={() => {
                    setSortBy("Competitive");
                    setSortOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-[#3D5266] flex items-center gap-2"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path>
                    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path>
                    <path d="M4 22h16"></path>
                    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"></path>
                    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"></path>
                    <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"></path>
                  </svg>
                  <span>Competitive</span>
                </button>
              </div>
            )}
          </div>

          {/* Frequency */}
          <div className="relative">
            <button
              onClick={() => setFrequencyOpen(!frequencyOpen)}
              className="flex items-center gap-1 text-white hover:bg-[#4a637b] bg-[#3D5266] px-2 py-1.5 rounded-full transition-colors"
            >
              <span className="text-sm text-gray-400">Frequency:</span>
              <span className="text-sm font-medium">{frequency}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {frequencyOpen && (
              <div className="absolute left-0 mt-2 w-32 bg-[#2A3F54] rounded-lg shadow-lg py-2 z-50">
                <button
                  onClick={() => {
                    setFrequency("Daily");
                    setFrequencyOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-[#3D5266] flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span>Daily</span>
                </button>
                <button
                  onClick={() => {
                    setFrequency("Weekly");
                    setFrequencyOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-[#3D5266]"
                >
                  Weekly
                </button>
                <button
                  onClick={() => {
                    setFrequency("Monthly");
                    setFrequencyOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-[#3D5266]"
                >
                  Monthly
                </button>
                <button
                  onClick={() => {
                    setFrequency("All");
                    setFrequencyOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-[#3D5266] flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span>All</span>
                </button>
              </div>
            )}
          </div>

          {/* Status */}
          <div className="relative">
            <button
              onClick={() => setStatusOpen(!statusOpen)}
              className="flex items-center gap-1 text-white hover:bg-[#4a637b] bg-[#3D5266] px-2 py-1.5 rounded-full transition-colors"
            >
              <span className="text-sm text-gray-400">Status:</span>
              <span className="text-sm font-medium">{status}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>

            {statusOpen && (
              <div className="absolute left-0 mt-2 w-32 bg-[#2A3F54] rounded-lg shadow-lg py-2 z-50">
                <button
                  onClick={() => {
                    setStatus("Active");
                    setStatusOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-[#3D5266] flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-white"></span>
                  <span>Active</span>
                </button>
                <button
                  onClick={() => {
                    setStatus("Resolved");
                    setStatusOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-white hover:bg-[#3D5266]"
                >
                  Resolved
                </button>
              </div>
            )}
          </div>

          {/* Checkboxes */}
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white bg-[#3D5266] px-2 py-1.5 rounded-full transition-colors">
              <span>Hide sports?</span>
              <input
                type="checkbox"
                checked={hideSports}
                onChange={(e) => setHideSports(e.target.checked)}
                className="appearance-none w-4 h-4 rounded-sm border border-gray-500 bg-transparent checked:bg-blue-500 checked:border-blue-500 focus:outline-none focus:ring-0 focus:ring-offset-0 bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22white%22%3E%3Cpath%20d%3D%22M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%22%2F%3E%3C%2Fsvg%3E')]"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white bg-[#3D5266] px-2 py-1.5 rounded-full transition-colors">
              <span>Hide crypto?</span>
              <input
                type="checkbox"
                checked={hideCrypto}
                onChange={(e) => setHideCrypto(e.target.checked)}
                className="appearance-none w-4 h-4 rounded-sm border border-gray-500 bg-transparent checked:bg-blue-500 checked:border-blue-500 focus:outline-none focus:ring-0 focus:ring-offset-0 bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22white%22%3E%3Cpath%20d%3D%22M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%22%2F%3E%3C%2Fsvg%3E')]"
              />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-white bg-[#3D5266] px-2 py-1.5 rounded-full transition-colors">
              <span>Hide earnings?</span>
              <input
                type="checkbox"
                checked={hideEarnings}
                onChange={(e) => setHideEarnings(e.target.checked)}
                className="appearance-none w-4 h-4 rounded-sm border border-gray-500 bg-transparent checked:bg-blue-500 checked:border-blue-500 focus:outline-none focus:ring-0 focus:ring-offset-0 bg-center bg-no-repeat checked:bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22white%22%3E%3Cpath%20d%3D%22M12.207%204.793a1%201%200%20010%201.414l-5%205a1%201%200%2001-1.414%200l-2-2a1%201%200%20011.414-1.414L6.5%209.086l4.293-4.293a1%201%200%20011.414%200z%22%2F%3E%3C%2Fsvg%3E')]"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
