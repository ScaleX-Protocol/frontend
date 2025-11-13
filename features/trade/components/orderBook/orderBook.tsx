"use client";

import { useState } from "react";
import Orders from "./orders";
import Trades from "./trades";

export default function OrderBook() {
  const [activeTab, setActiveTab] = useState<"orders" | "trades">("orders");

  return (
    <div className="w-full h-full bg-[#2C2C2C] rounded-md p-2">
      <div className="flex items-center">
        <button
          type="button"
          onClick={() => setActiveTab("orders")}
          className={`flex-1 px-6 py-2 pt-0 text-lg font-medium ${
            activeTab === "orders"
              ? "text-[#E0E0E0] border-b-2 border-[#F06718]"
              : "border-b border-[#E0E0E0]/70 text-[#E0E0E0]/70"
          }`}
        >
          Orders
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("trades")}
          className={`flex-1 px-6 py-2 pt-0 text-lg font-medium ${
            activeTab === "trades"
              ? "text-[#E0E0E0] border-b-2 border-[#F06718]"
              : "border-b border-[#E0E0E0]/70 text-[#E0E0E0]/70"
          }`}
        >
          Trades
        </button>
      </div>
      {activeTab === "orders" && <Orders />}
      {activeTab === "trades" && <Trades />}
    </div>
  );
}
