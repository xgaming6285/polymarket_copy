"use client";

import { useState } from "react";
import Image from "next/image";
import EventChartContainer from "./EventChartContainer";
import TradePanel from "./TradePanel";

import { Market as ApiMarket } from "@/app/lib/polymarket";

export interface OutcomeItem {
  id: string; // token_id of Yes token (or main token)
  title: string; // outcome name
  price: number; // Yes price
  yesTokenId: string;
  noTokenId: string;
  market: ApiMarket; // full market if needed
}

interface EventData {
  title: string;
  image?: string;
  volume?: string | number;
}

export default function EventPageContent({
  event,
  outcomes,
}: {
  event: EventData;
  outcomes: OutcomeItem[];
}) {
  const [selectedOutcome, setSelectedOutcome] = useState<OutcomeItem>(
    outcomes[0]
  );

  // Tokens for chart
  const chartTokens = outcomes.map((o) => ({
    token_id: o.yesTokenId,
    outcome: o.title,
    price: o.price,
  }));

  return (
    <div className="px-[6%] py-8">
      {/* Event Header Info */}
      <div className="mb-8">
        <div className="flex gap-3 items-start">
          {event.image && (
            <div className="relative w-[64px] h-[64px] shrink-0">
              <Image
                src={event.image}
                alt={event.title}
                fill
                className="object-cover rounded-lg"
                sizes="100vw"
              />
            </div>
          )}
          <h1
            className="font-bold"
            style={{
              fontFamily: '"Open Sauce One", sans-serif',
              fontSize: "24px",
              lineHeight: "1.3",
              marginTop: "14px",
            }}
          >
            {event.title}
          </h1>
        </div>
        <div
          className="flex items-center gap-1 mt-2"
          style={{
            color: "#899cb2",
            fontFamily: '"Open Sauce One", sans-serif',
            fontSize: "14px",
          }}
        >
          <svg
            height="18"
            width="18"
            viewBox="0 0 18 18"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g fill="currentColor">
              <path
                d="M9.5,12.25s0,2.938,3.75,4H4.75c3.75-1.062,3.75-4,3.75-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              ></path>
              <path
                d="M5.286,9C1.469,9,1.75,3.75,1.75,3.75H3.987"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              ></path>
              <path
                d="M12.714,9c3.818,0,3.536-5.25,3.536-5.25h-2.237"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              ></path>
              <path
                d="M14,1.75c-.625,6.531-2.281,10.219-4.75,10.5h-.25s-.25,0-.25,0c-2.469-.281-4.125-3.969-4.75-10.5H14Z"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
              ></path>
            </g>
          </svg>
          {event.volume && parseFloat(event.volume.toString()) > 0 && (
            <span>
              ${parseFloat(event.volume.toString()).toLocaleString("en-US")}{" "}
              Vol.
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content - Chart & List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-transparent rounded-lg h-[350px]">
            <EventChartContainer tokens={chartTokens} />
          </div>

          {/* Outcomes List */}
          <div className="flex flex-col gap-2">
            {outcomes.map((outcome) => (
              <div
                key={outcome.id}
                onClick={() => setSelectedOutcome(outcome)}
                className={`flex items-center justify-between p-4 rounded-lg cursor-pointer transition-colors border ${
                  selectedOutcome.id === outcome.id
                    ? "bg-[#2C3F51] border-[#00C08B]" // Highlight selected
                    : "bg-[#2C3F51] border-transparent hover:bg-[#374E65]"
                }`}
              >
                <span className="font-medium text-white">{outcome.title}</span>
                <div className="flex items-center gap-4">
                  <span className="text-[#00C08B] font-bold">
                    {(outcome.price * 100).toFixed(0)}%
                  </span>
                  <button
                    className="px-4 py-1.5 rounded bg-[#00C08B] hover:bg-[#00A07D] text-white text-sm font-bold transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOutcome(outcome);
                    }}
                  >
                    Buy Yes {(outcome.price * 100).toFixed(1)}¢
                  </button>
                  <button
                    className="px-4 py-1.5 rounded bg-[#E63757] hover:bg-[#CC2946] text-white text-sm font-bold transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOutcome(outcome);
                    }}
                  >
                    Buy No {(100 - outcome.price * 100).toFixed(1)}¢
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar - Trade Panel */}
        <div className="space-y-6">
          <div className="sticky top-4">
            <TradePanel
              selectedOutcome={selectedOutcome}
              eventImage={event.image}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
