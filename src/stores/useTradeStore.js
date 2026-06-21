import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { TRADES, getTradeById, getTradeLabel } from "../constants/trades";

/**
 * Trade Store - Simplified Version
 *
 * Manages trade assignments to courses and batches.
 * Uses hardcoded TRADES constant instead of dynamic creation.
 * Persists trade assignments in localStorage.
 *
 * Architecture: Trade → Course → Batch
 */
const useTradeStore = create(
  persist(
    (set, get) => ({
      trades: TRADES,
      courseTradeMap: {},
      batchTradeMap: {},

      /**
       * Assign a trade to a course
       */
      assignTradeToCourse: (courseId, tradeId) => {
        set((state) => ({
          courseTradeMap: {
            ...state.courseTradeMap,
            [courseId]: tradeId || null,
          },
        }));
      },

      /**
       * Assign a trade to a batch
       */
      assignTradeToBatch: (batchId, tradeId) => {
        set((state) => ({
          batchTradeMap: {
            ...state.batchTradeMap,
            [batchId]: tradeId || null,
          },
        }));
      },

      /**
       * Get trade by id from constant
       */
      getTradeById: (id) => {
        return getTradeById(id);
      },

      /**
       * Cross-browser fallback: Map trade with course name
       */
      getTradeFromCourseName: (courseName) => {
        if (!courseName) return null;
        const lowerName = courseName.toLowerCase();
        const match = TRADES.find((t) => lowerName.includes(t.name.toLowerCase()));
        return match ? match.id : null;
      },

      /**
       * Get trade label by id
       */
      getTradeLabel: (id) => {
        return getTradeLabel(id);
      },
    }),
    {
      name: "trade-store",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export default useTradeStore;
