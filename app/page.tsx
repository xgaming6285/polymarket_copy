import Header from "./components/Header";
import FilterSection from "./components/FilterSection";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#1D2B3A]">
      <Header />
      <FilterSection />

      {/* Placeholder for event cards */}
      <div className="px-6 py-8">
        <p className="text-gray-400 text-center">
          Event cards will be displayed here using Polymarket API
        </p>
      </div>
    </div>
  );
}
