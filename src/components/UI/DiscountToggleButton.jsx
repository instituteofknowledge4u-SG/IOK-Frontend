import React from "react";
import { Gift, X } from "lucide-react";

/**
 * Discount Toggle Button Component
 * Floating button to show/hide discount fields globally
 */
const DiscountToggleButton = ({ isVisible = false, onToggle = () => {} }) => {
  return (
    <button
      onClick={onToggle}
      className={`fixed bottom-8 right-8 rounded-full shadow-lg transition-all duration-300 hover:scale-110 active:scale-95 z-40 flex items-center gap-2 px-4 py-3 font-semibold ${
        isVisible
          ? "bg-destructive text-destructive-foreground hover:opacity-90"
          : "bg-primary text-primary-foreground hover:opacity-90"
      }`}
      title={isVisible ? "Hide discount fields" : "Show discount fields"}
    >
      {isVisible ? (
        <>
          <X className="w-5 h-5" />
          <span className="hidden sm:inline">H Con</span>
        </>
      ) : (
        <>
          <Gift className="w-5 h-5" />
          <span className="hidden sm:inline">S Con</span>
        </>
      )}
    </button>
  );
};

export default DiscountToggleButton;
