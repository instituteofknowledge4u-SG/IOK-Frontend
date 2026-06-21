/**
 * Fixed hardcoded trades constant
 * No more nested/dynamic trades management
 * Architecture: Trade → Course → Batch
 */

export const TRADES = [
  {
    id: "computer",
    name: "Computer",
  },
  {
    id: "tailoring",
    name: "Tailoring",
  },
  {
    id: "cooking",
    name: "Cooking",
  },
  {
    id: "coaching",
    name: "Coaching",
  },
  {
    id: "spoken_english",
    name: "Spoken English",
  },
];

/**
 * Helper function to get trade by id
 */
export const getTradeById = (id) => {
  return TRADES.find((trade) => trade.id === id) || null;
};

/**
 * Helper function to get trade label/name by id
 */
export const getTradeLabel = (id) => {
  const trade = getTradeById(id);
  return trade?.name || "Unassigned";
};
