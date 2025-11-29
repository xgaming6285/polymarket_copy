"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function Header() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [navMoreOpen, setNavMoreOpen] = useState(false);
  const [activeMoreItem, setActiveMoreItem] = useState("");
  const [scrollPosition, setScrollPosition] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { user, logout, isLoading } = useAuth();

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTag = searchParams.get("tag");
  const currentSort = searchParams.get("sort");

  const isActive = (category: string) => {
    if (category === "Trending") {
      return (
        pathname === "/" &&
        !currentTag &&
        (!currentSort || currentSort === "trending")
      );
    }
    if (category === "Breaking") {
      return pathname === "/breaking";
    }
    if (category === "New") {
      return currentSort === "new" && !currentTag;
    }
    return currentTag === category;
  };

  const categories = [
    "Politics",
    "Sports",
    "Finance",
    "Crypto",
    "Geopolitics",
    "Earnings",
    "Tech",
    "Culture",
    "World",
    "Economy",
    "Elections",
    "Mentions",
  ];

  // Update scroll indicators
  useEffect(() => {
    const updateScrollIndicators = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollLeft = container.scrollLeft;

        setCanScrollLeft(scrollLeft > 0);
      }
    };

    updateScrollIndicators();

    // Update on resize
    window.addEventListener("resize", updateScrollIndicators);

    return () => window.removeEventListener("resize", updateScrollIndicators);
  }, [scrollPosition]);

  const handleScrollLeft = () => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth / 2;
      const newPosition = Math.max(0, scrollPosition - scrollAmount);

      container.scrollTo({
        left: newPosition,
        behavior: "smooth",
      });

      setScrollPosition(newPosition);
    }
  };

  return (
    <header className="bg-[#1D2B3A] border-b border-[#2A3F54]">
      {/* Top Header */}
      <div className="flex items-center justify-between px-[6%] pt-4 pb-2">
        {/* Left: Logo and Search */}
        <div className="flex items-center gap-4 flex-1">
          {/* Logo */}
          <div className="flex items-center gap-2 text-white">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-xl font-semibold">SupraCast</span>
            <span className="text-xl">🇺🇸</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="w-full bg-[#2f3f50] text-white placeholder-gray-400 rounded-lg px-4 py-2 pl-10 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              {/* Shortcut hint */}
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">
                /
              </span>
            </div>
          </div>

          {/* How it works */}
          <button
            className="flex items-center gap-2 text-[#2c9cdb] hover:text-[#3db0ef] ml-2 font-bold"
            style={{ fontSize: "14px" }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
            <span>How it works</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {!isLoading && user && user.firstName && user.lastName ? (
            <>
              {/* Portfolio */}
              <div className="text-center mr-2">
                <div className="text-gray-400 text-xs">Portfolio</div>
                <div className="text-green-400 font-bold text-sm">$0.00</div>
              </div>

              {/* Cash */}
              <div className="text-center mr-2">
                <div className="text-gray-400 text-xs">Cash</div>
                <div className="text-green-400 font-bold text-sm">$0.00</div>
              </div>

              {/* Deposit Button */}
              <button className="bg-[#2c9cdb] hover:bg-[#3db0ef] text-white font-bold px-6 py-2 rounded-lg text-sm mr-2">
                Deposit
              </button>

              {/* Notification Bell */}
              <button className="text-gray-400 hover:text-white p-2">
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
              </button>

              {/* User Avatar Dropdown */}
              <div className="relative ml-2">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2"
                >
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-purple-500 via-blue-500 to-green-400 flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user.firstName?.charAt(0) || "U"}
                      {user.lastName?.charAt(0) || "S"}
                    </span>
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`text-gray-400 transition-transform ${
                      userMenuOpen ? "rotate-180" : ""
                    }`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-[#1D2B3A] border border-[#2A3F54] rounded-lg shadow-lg py-2 z-50">
                    {/* User Info */}
                    <div className="px-4 py-3 border-b border-[#2A3F54]">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-linear-to-br from-purple-500 via-blue-500 to-green-400 flex items-center justify-center">
                          <span className="text-white font-bold">
                            {user.firstName?.charAt(0) || "U"}
                            {user.lastName?.charAt(0) || "S"}
                          </span>
                        </div>
                        <div>
                          <div className="text-white font-semibold">
                            {user.firstName || ""} {user.lastName || ""}
                          </div>
                          <div className="text-gray-400 text-xs flex items-center gap-1">
                            {user.id?.substring(0, 6) || "0xef4f"}...
                            {user.id?.substring(user.id.length - 4) || "298C"}
                            <button className="text-gray-400 hover:text-white">
                              <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <rect
                                  x="9"
                                  y="9"
                                  width="13"
                                  height="13"
                                  rx="2"
                                  ry="2"
                                ></rect>
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Settings */}
                    <button
                      className="w-full text-right px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2A3F54] flex items-center justify-end gap-2"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6m8.66-11.66l-4.24 4.24m-4.24 4.24L7.34 20.66M1 12h6m6 0h6m-1.34 8.66l-4.24-4.24m-4.24-4.24L7.34 3.34"></path>
                      </svg>
                    </button>

                    {/* Menu Items */}
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2A3F54]"
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
                      <span>🏆 Leaderboard</span>
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2A3F54]"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="20 12 20 22 4 22 4 12"></polyline>
                        <rect x="2" y="7" width="20" height="5"></rect>
                        <path d="M12 22V7"></path>
                        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
                      </svg>
                      <span>🎁 Rewards</span>
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2A3F54]"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                      </svg>
                      <span>📮 APIs</span>
                    </a>
                    <a
                      href="#"
                      className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2A3F54]"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="3" y="3" width="7" height="7"></rect>
                        <rect x="14" y="3" width="7" height="7"></rect>
                        <rect x="14" y="14" width="7" height="7"></rect>
                        <rect x="3" y="14" width="7" height="7"></rect>
                      </svg>
                      <span>🔨 Builders</span>
                    </a>

                    {/* Dark Mode Toggle */}
                    <div className="flex items-center justify-between px-4 py-2 hover:bg-[#2A3F54]">
                      <div className="flex items-center gap-3 text-gray-400">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                        </svg>
                        <span>🌙 Dark mode</span>
                      </div>
                      <div className="w-12 h-6 bg-blue-500 rounded-full relative cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                      </div>
                    </div>

                    <hr className="border-[#2A3F54] my-2" />

                    {/* Bottom Menu Items */}
                    <a
                      href="#"
                      className="block px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2A3F54]"
                    >
                      Accuracy
                    </a>
                    <a
                      href="#"
                      className="block px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2A3F54]"
                    >
                      Watchlist
                    </a>
                    <a
                      href="#"
                      className="block px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2A3F54]"
                    >
                      Documentation
                    </a>
                    <a
                      href="#"
                      className="block px-4 py-2 text-gray-400 hover:text-white hover:bg-[#2A3F54]"
                    >
                      Terms of Use
                    </a>

                    <hr className="border-[#2A3F54] my-2" />

                    {/* Logout */}
                    <button
                      onClick={() => {
                        logout();
                        setUserMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-red-400 hover:text-red-300 hover:bg-[#2A3F54]"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Log In */}
              <Link
                href="/login"
                className="text-blue-400 hover:text-blue-300 text-sm font-bold px-4 py-2"
              >
                Log In
              </Link>

              {/* Sign Up */}
              <Link
                href="/signup"
                className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-lg"
              >
                Sign Up
              </Link>
            </>
          )}

          {/* More Menu */}
          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="text-white hover:text-gray-300 p-2"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            {moreOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-[#2A3F54] rounded-lg shadow-lg py-2 z-50">
                <a
                  href="#"
                  className="block px-4 py-2 text-white hover:bg-[#3D5266]"
                >
                  Activity
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-white hover:bg-[#3D5266]"
                >
                  Leaderboard
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-white hover:bg-[#3D5266]"
                >
                  Dashboards
                </a>
                <a
                  href="#"
                  className="block px-4 py-2 text-white hover:bg-[#3D5266]"
                >
                  Rewards
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="relative  overflow-visible">
        {/* Left Arrow - appears when scrolled */}
        {canScrollLeft && (
          <button
            onClick={handleScrollLeft}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-[#1D2B3A] text-white hover:text-gray-300 hover:bg-[#2A3F54] p-2 rounded-full shadow-lg transition-all duration-200"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
        )}

        <div className="flex items-center px-[6%] py-3 overflow-visible">
          {/* Scrollable Categories Container */}
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-6 overflow-x-hidden flex-1 scroll-smooth pointer-events-none"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Trending - Special First Item */}
            <Link
              href="/"
              className={`flex items-center gap-2 whitespace-nowrap pointer-events-auto ${
                isActive("Trending")
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
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
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
              <span className="font-medium">Trending</span>
            </Link>
            <Link
              href="/breaking"
              className={`whitespace-nowrap pointer-events-auto ${
                isActive("Breaking")
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              Breaking
            </Link>
            <Link
              href="/?sort=new"
              className={`whitespace-nowrap pointer-events-auto ${
                isActive("New")
                  ? "text-white border-b-2 border-white"
                  : "text-gray-400 hover:text-gray-300"
              }`}
            >
              New
            </Link>
            <span className="text-gray-600">|</span>

            {/* Category Links */}
            {categories.map((category, index) => (
              <Link
                key={index}
                href={`/?tag=${category}`}
                className={`whitespace-nowrap pointer-events-auto ${
                  isActive(category)
                    ? "text-white border-b-2 border-white"
                    : "text-gray-400 hover:text-gray-300"
                }`}
              >
                {category}
              </Link>
            ))}

            <div
              className="relative pointer-events-auto"
              onMouseEnter={() => setNavMoreOpen(true)}
              onMouseLeave={() => setNavMoreOpen(false)}
            >
              <button className="flex items-center gap-1 text-gray-400 hover:text-gray-300 whitespace-nowrap">
                <span>More</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`transition-transform ${
                    navMoreOpen ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Dropdown positioned outside overflow container */}
        {navMoreOpen && (
          <div
            className="absolute right-[6%] top-full bg-[#1D2B3A] border border-[#2A3F54] rounded-lg shadow-lg py-2 z-100 min-w-[180px]"
            style={{ fontSize: "15px" }}
            onMouseEnter={() => setNavMoreOpen(true)}
            onMouseLeave={() => setNavMoreOpen(false)}
          >
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveMoreItem("Activity");
              }}
              className={`flex items-center gap-3 px-4 py-2 whitespace-nowrap ${
                activeMoreItem === "Activity"
                  ? "bg-[#20415A] text-[#2C9CDB]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
              </svg>
              <span>Activity</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveMoreItem("Leaderboard");
              }}
              className={`flex items-center gap-3 px-4 py-2 whitespace-nowrap ${
                activeMoreItem === "Leaderboard"
                  ? "bg-[#20415A] text-[#2C9CDB]"
                  : "text-gray-400 hover:text-white"
              }`}
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
              <span>Leaderboard</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveMoreItem("Dashboards");
              }}
              className={`flex items-center gap-3 px-4 py-2 whitespace-nowrap ${
                activeMoreItem === "Dashboards"
                  ? "bg-[#20415A] text-[#2C9CDB]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Dashboards</span>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setActiveMoreItem("Rewards");
              }}
              className={`flex items-center gap-3 px-4 py-2 whitespace-nowrap ${
                activeMoreItem === "Rewards"
                  ? "bg-[#20415A] text-[#2C9CDB]"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="20 12 20 22 4 22 4 12"></polyline>
                <rect x="2" y="7" width="20" height="5"></rect>
                <path d="M12 22V7"></path>
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
              </svg>
              <span>Rewards</span>
            </a>
          </div>
        )}
      </div>
    </header>
  );
}
