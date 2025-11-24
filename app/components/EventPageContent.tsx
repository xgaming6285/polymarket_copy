"use client";

import { useState } from "react";
import Image from "next/image";
import EventChartContainer from "./EventChartContainer";
import TradePanel from "./TradePanel";

import { Market as ApiMarket } from "@/app/lib/polymarket";

import OutcomeRow from "./OutcomeRow";

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
  const [selectedOutcome, setSelectedOutcome] = useState<
    OutcomeItem | undefined
  >(outcomes[0]);

  // Tokens for chart (top 4 max)
  const chartTokens = outcomes.slice(0, 4).map((o) => ({
    token_id: o.yesTokenId,
    outcome: o.title,
    price: o.price,
  }));

  if (!selectedOutcome) {
    return (
      <div className="px-[6%] py-8 text-center text-gray-400">
        No active markets found for this event.
      </div>
    );
  }

  return (
    <div className="px-[6%] py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Header & Main Content */}
        <div className="lg:col-span-2">
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

          {/* Main Content - Chart & List */}
          <div className="space-y-6">
            <div className="bg-transparent rounded-lg h-[350px]">
              <EventChartContainer tokens={chartTokens} />
            </div>

            {/* Outcomes List */}
            <div className="flex flex-col gap-2">
              {outcomes.map((outcome) => (
                <OutcomeRow
                  key={outcome.id}
                  outcome={outcome}
                  isSelected={selectedOutcome.id === outcome.id}
                  onSelect={setSelectedOutcome}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Trade Panel */}
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
