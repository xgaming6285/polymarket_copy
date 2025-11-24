"use client";

import { useEffect, useState, Suspense } from "react";
import Header from "../components/Header";
import BreakingMarketRow from "../components/BreakingMarketRow";
import Image from "next/image";
import {
  BreakingMarket,
  fetchBreakingMarkets,
  fetchTweets,
  Tweet,
} from "../lib/breaking";

const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "politics", label: "Politics" },
  { id: "world", label: "World" },
  { id: "sports", label: "Sports" },
  { id: "crypto", label: "Crypto" },
  { id: "finance", label: "Finance" },
  { id: "tech", label: "Tech" },
  { id: "culture", label: "Culture" },
];

export default function BreakingPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [markets, setMarkets] = useState<BreakingMarket[]>([]);
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMarkets = async () => {
      setLoading(true);
      try {
        const categoryParam =
          activeCategory === "all" ? undefined : activeCategory;
        const data = await fetchBreakingMarkets(categoryParam);
        setMarkets(data);
      } catch (error) {
        console.error("Failed to load markets", error);
      } finally {
        setLoading(false);
      }
    };

    loadMarkets();
  }, [activeCategory]);

  useEffect(() => {
    const loadTweets = async () => {
      try {
        const data = await fetchTweets();
        setTweets(data);
      } catch (error) {
        console.error("Failed to load tweets", error);
      }
    };

    loadTweets();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(date);
  };

  return (
    <div className="h-screen bg-[#1D2B3A] text-white font-sans flex flex-col overflow-hidden">
      <div className="shrink-0">
        <Suspense fallback={<div className="h-20 bg-[#1D2B3A]" />}>
          <Header />
        </Suspense>
      </div>

      <main className="flex-1 flex flex-col w-full px-[6%] pb-8 pt-0 overflow-hidden min-h-0">
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 h-full min-h-0 overflow-y-auto pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            {/* Banner Section */}
            <div className="mb-6 gap-5 flex flex-col mt-8">
              <div className="w-full rounded-2xl max-[730px]:h-32 overflow-hidden bg-[#1f3f56] h-[168px] flex items-center justify-start px-6 min-[730px]:px-10 relative border border-[#2A3F54]">
                <div className="flex flex-col gap-1 items-start">
                  <p className="text-gray-400 text-[15px] font-medium relative z-10">
                    Nov 23, 2025
                  </p>
                  <p className="text-white text-2xl font-medium relative z-10">
                    Breaking News
                  </p>
                  <p className="text-gray-400 text-[15px] font-medium mt-4 max-[730px]:hidden relative z-10">
                    See the markets that moved the most in the last 24 hours
                  </p>
                  <div className="absolute -right-4 top-1/2 -translate-y-1/2 w-96 max-[500px]:left-5/12 max-[500px]:-scale-x-100">
                    <svg
                      className="w-full h-auto"
                      viewBox="0 0 559 820"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect
                        x="243.868"
                        y="215.689"
                        width="325.125"
                        height="537.75"
                        rx="162.562"
                        transform="rotate(15 243.868 215.689)"
                        className="stroke-[#2A3F54] dark:stroke-[#3D5266]"
                        strokeWidth="1.125"
                      ></rect>
                      <rect
                        x="283.644"
                        y="284.581"
                        width="212.625"
                        height="425.25"
                        rx="106.312"
                        transform="rotate(15 283.644 284.581)"
                        className="stroke-[#2A3F54] dark:stroke-[#3D5266]"
                        strokeWidth="1.125"
                      ></rect>
                      <path
                        d="M188.541 395.367L193.492 400.157C193.864 400.517 194.396 400.66 194.899 400.534L201.581 398.861"
                        stroke="#D6D1CB"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      ></path>
                      <path
                        d="M169.131 467.811L174.081 472.6C174.454 472.961 174.986 473.103 175.489 472.977L182.171 471.305"
                        className="stroke-[#2A3F54] dark:stroke-[#3D5266]"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      ></path>
                      <path
                        d="M235.533 489.486L230.583 484.697C230.21 484.336 229.678 484.194 229.175 484.319L222.493 485.992"
                        className="stroke-[#2A3F54] dark:stroke-[#3D5266]"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      ></path>
                      <rect
                        x="0.688919"
                        y="-0.397748"
                        width="325.125"
                        height="537.75"
                        rx="162.562"
                        transform="matrix(0.965926 0.258819 0.258819 -0.965926 0.175247 519.766)"
                        className="stroke-[#2A3F54] dark:stroke-[#3D5266]"
                        strokeWidth="1.125"
                      ></rect>
                      <rect
                        x="0.688919"
                        y="-0.397748"
                        width="212.625"
                        height="425.25"
                        rx="106.312"
                        transform="matrix(0.965926 0.258819 0.258819 -0.965926 69.0678 479.991)"
                        className="stroke-[#2A3F54] dark:stroke-[#3D5266]"
                        strokeWidth="1.125"
                      ></rect>
                      <path
                        d="M42.6621 337.061L49.3443 335.388C49.847 335.262 50.3791 335.404 50.7516 335.765L55.7021 340.555"
                        className="stroke-[#2A3F54] dark:stroke-[#3D5266]"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      ></path>
                      <path
                        d="M62.0742 264.615L68.7564 262.942C69.2591 262.817 69.7912 262.959 70.1637 263.319L75.1142 268.109"
                        className="stroke-[#2A3F54] dark:stroke-[#3D5266]"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      ></path>
                      <path
                        d="M130.418 279.047L123.736 280.72C123.233 280.846 122.701 280.703 122.329 280.343L117.378 275.553"
                        className="stroke-[#2A3F54] dark:stroke-[#3D5266]"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      ></path>
                      <path
                        d="M111.006 351.49L104.324 353.163C103.821 353.289 103.289 353.146 102.916 352.786L97.9659 347.996"
                        className="stroke-[#2A3F54] dark:stroke-[#3D5266]"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      ></path>
                      <rect
                        width="101.25"
                        height="313.875"
                        rx="50.625"
                        transform="matrix(0.965926 0.258819 0.258819 -0.965926 137.834 441.176)"
                        fill="url(#paint0_linear_1167_586)"
                      ></rect>
                      <rect
                        width="101.25"
                        height="101.25"
                        rx="50.625"
                        transform="matrix(0.965926 0.258819 0.258819 -0.965926 137.834 441.176)"
                        fill="#2C9CDB"
                      ></rect>
                      <g filter="url(#filter0_d_1167_586)">
                        <path
                          d="M215.019 388.259C215.514 386.412 215.396 384.845 214.666 383.558C213.941 382.255 212.663 381.358 210.832 380.867L202.475 378.628C200.661 378.142 199.105 378.279 197.809 379.041C196.533 379.791 195.648 381.089 195.153 382.936L187.393 411.899C186.894 413.761 187.009 415.336 187.739 416.623C188.485 417.915 189.765 418.804 191.58 419.29L199.937 421.53C201.767 422.02 203.32 421.89 204.596 421.14C205.872 420.39 206.759 419.084 207.258 417.222L215.019 388.259ZM180.973 399.66C180.05 399.413 179.207 399.503 178.444 399.93C177.677 400.372 177.17 401.055 176.923 401.979C176.748 402.631 176.721 403.272 176.842 403.902C176.964 404.532 177.236 405.236 177.658 406.014L190.338 429.655C190.656 430.252 191.028 430.71 191.454 431.029C191.896 431.352 192.333 431.571 192.762 431.686C193.224 431.81 193.719 431.84 194.248 431.777C194.777 431.714 195.326 431.511 195.895 431.169L218.583 416.98C219.419 416.471 220.043 415.99 220.454 415.537C220.877 415.104 221.174 414.57 221.345 413.933C221.596 412.994 221.477 412.134 220.986 411.354C220.496 410.575 219.797 410.063 218.89 409.82L180.973 399.66Z"
                          fill="white"
                        ></path>
                      </g>
                      <rect
                        x="323.021"
                        y="352.785"
                        width="101.25"
                        height="313.875"
                        rx="50.625"
                        transform="rotate(15 323.021 352.785)"
                        fill="url(#paint1_linear_1167_586)"
                      ></rect>
                      <rect
                        x="323.021"
                        y="352.785"
                        width="101.25"
                        height="101.25"
                        rx="50.625"
                        transform="rotate(15 323.021 352.785)"
                        fill="#2C9CDB"
                      ></rect>
                      <g filter="url(#filter1_d_1167_586)">
                        <path
                          d="M363.407 437.205C362.912 439.052 362.027 440.35 360.751 441.1C359.471 441.866 357.915 442.004 356.085 441.513L347.728 439.274C345.913 438.788 344.635 437.891 343.894 436.583C343.164 435.296 343.046 433.729 343.541 431.882L351.302 402.92C351.801 401.057 352.688 399.751 353.964 399.001C355.256 398.255 356.809 398.125 358.623 398.612L366.98 400.851C368.811 401.341 370.091 402.23 370.821 403.518C371.551 404.805 371.666 406.38 371.167 408.243L363.407 437.205ZM339.623 410.308C338.7 410.061 338.014 409.562 337.567 408.811C337.125 408.044 337.027 407.199 337.274 406.275C337.449 405.623 337.746 405.054 338.166 404.569C338.586 404.085 339.174 403.611 339.929 403.148L362.73 389.015C363.304 388.657 363.855 388.446 364.384 388.383C364.929 388.324 365.416 388.353 365.846 388.468C366.307 388.591 366.751 388.813 367.178 389.132C367.604 389.451 367.978 389.901 368.3 390.482L380.854 414.114C381.323 414.973 381.623 415.702 381.753 416.3C381.903 416.886 381.893 417.497 381.722 418.134C381.47 419.073 380.937 419.758 380.122 420.188C379.308 420.618 378.447 420.711 377.539 420.468L339.623 410.308Z"
                          fill="white"
                        ></path>
                      </g>
                      <defs>
                        <filter
                          id="filter0_d_1167_586"
                          x="101.773"
                          y="305.021"
                          width="180.632"
                          height="186.12"
                          filterUnits="userSpaceOnUse"
                          colorInterpolationFilters="sRGB"
                        >
                          <feFlood
                            floodOpacity="0"
                            result="BackgroundImageFix"
                          ></feFlood>
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          ></feColorMatrix>
                          <feOffset dx="-7.64266" dy="-7.64266"></feOffset>
                          <feGaussianBlur stdDeviation="30.5707"></feGaussianBlur>
                          <feComposite
                            in2="hardAlpha"
                            operator="out"
                          ></feComposite>
                          <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.7 0"
                          ></feColorMatrix>
                          <feBlend
                            mode="normal"
                            in2="BackgroundImageFix"
                            result="effect1_dropShadow_1167_586"
                          ></feBlend>
                          <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect1_dropShadow_1167_586"
                            result="shape"
                          ></feBlend>
                        </filter>
                        <filter
                          id="filter1_d_1167_586"
                          x="260.941"
                          y="313.734"
                          width="180.632"
                          height="186.122"
                          filterUnits="userSpaceOnUse"
                          colorInterpolationFilters="sRGB"
                        >
                          <feFlood
                            floodOpacity="0"
                            result="BackgroundImageFix"
                          ></feFlood>
                          <feColorMatrix
                            in="SourceAlpha"
                            type="matrix"
                            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                            result="hardAlpha"
                          ></feColorMatrix>
                          <feOffset dx="-7.64266" dy="-7.64266"></feOffset>
                          <feGaussianBlur stdDeviation="30.5707"></feGaussianBlur>
                          <feComposite
                            in2="hardAlpha"
                            operator="out"
                          ></feComposite>
                          <feColorMatrix
                            type="matrix"
                            values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.7 0"
                          ></feColorMatrix>
                          <feBlend
                            mode="normal"
                            in2="BackgroundImageFix"
                            result="effect1_dropShadow_1167_586"
                          ></feBlend>
                          <feBlend
                            mode="normal"
                            in="SourceGraphic"
                            in2="effect1_dropShadow_1167_586"
                            result="shape"
                          ></feBlend>
                        </filter>
                        <linearGradient
                          id="paint0_linear_1167_586"
                          x1="50.625"
                          y1="0"
                          x2="50.625"
                          y2="313.875"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#2C9CDB"></stop>
                          <stop offset="0.9999" stopColor="#1D2B3A"></stop>
                          <stop offset="1" stopColor="#2C3F50"></stop>
                        </linearGradient>
                        <linearGradient
                          id="paint1_linear_1167_586"
                          x1="373.646"
                          y1="352.785"
                          x2="373.646"
                          y2="666.66"
                          gradientUnits="userSpaceOnUse"
                        >
                          <stop stopColor="#2C9CDB"></stop>
                          <stop offset="0.9999" stopColor="#1D2B3A"></stop>
                          <stop offset="1" stopColor="#1D2B3A"></stop>
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-1 scrollbar-hide px-6 min-[730px]:px-10">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors border border-[#3d5266] ${
                    activeCategory === cat.id
                      ? "bg-[#1e3448] text-[#2c9cdb]"
                      : "bg-transparent text-gray-400 hover:text-white hover:bg-[#2A3F54]/30"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Market List */}
            <div className="">
              <div className="space-y-2">
                {loading ? (
                  // Skeleton loading
                  [...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-24 bg-[#2A3F54]/50 rounded-lg animate-pulse"
                    ></div>
                  ))
                ) : markets.length > 0 ? (
                  markets.map((market, index) => (
                    <BreakingMarketRow
                      key={market.id}
                      market={market}
                      rank={index + 1}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 text-gray-400">
                    No breaking news found.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Right Column */}
          <div className="flex flex-col h-full min-h-0 space-y-6">
            {/* Get Updates Widget */}
            <div className="shrink-0 bg-transparent rounded-xl p-6 border border-[#2A3F54] mt-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-2 bg-[#2A3F54] rounded-lg">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                  >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-white">Get daily updates</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    We&apos;ll send you an email every day with what&apos;s
                    moving on SupraCast
                  </p>
                </div>
              </div>
              <input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-[#2f3f50] border border-[#2A3F54] rounded-lg px-4 py-2 text-white mb-3 focus:outline-none focus:border-[#2C9CDB]"
              />
              <button className="w-full bg-[#2C9CDB] hover:bg-[#238ac3] text-white font-bold py-2 rounded-lg transition-colors">
                Get updates
              </button>
            </div>

            {/* Live Feed Widget */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="shrink-0 flex items-center justify-between mb-3">
                <span className="text-gray-400">Live from @SupraCast</span>
                <a
                  href="https://twitter.com/SupraCast"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white text-black px-3 py-2 rounded-full text-xs font-bold hover:bg-gray-200"
                >
                  Follow on X
                </a>
              </div>
              <div className="h-px bg-[#3d5266] -mx-2 mb-4"></div>

              <div className="flex-1 overflow-y-auto min-h-0 pr-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                <div className="space-y-4">
                  {tweets.map((tweet) => {
                    const isBreaking = tweet.text.includes("BREAKING");
                    const isNewMarket = tweet.text.includes("NEW POLYMARKET");
                    const label = isBreaking
                      ? "Breaking news"
                      : isNewMarket
                      ? "New SupraCast"
                      : "Update";
                    const labelColor = isBreaking
                      ? "text-[#F05252]"
                      : isNewMarket
                      ? "text-[#2C9CDB]"
                      : "text-gray-400";

                    return (
                      <div
                        key={tweet.id}
                        className="pb-4 border-b border-[#2A3F54]"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`${labelColor} text-xs font-bold`}>
                            {isBreaking && "🔥 "}
                            {isNewMarket && "🚨 "}
                            {label}
                          </span>
                          <span className="text-gray-500 text-xs">
                            {formatDate(tweet.created_at)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">
                          {tweet.text
                            .replace("BREAKING:", "")
                            .replace("🚨 NEW POLYMARKET:", "")
                            .trim()}
                        </p>
                        {tweet.image_url && (
                          <div className="relative w-full h-48 rounded-lg overflow-hidden mb-2">
                            <Image
                              src={tweet.image_url}
                              alt="Tweet image"
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {tweets.length === 0 && (
                    <div className="text-center text-gray-400 text-sm">
                      Loading live feed...
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
