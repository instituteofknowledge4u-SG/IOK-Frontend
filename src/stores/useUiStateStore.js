import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUiStateStore = create(
  persist(
    (set) => ({
      appName: "Institute-of-knowledge",
      theme: "system",
      setTheme: (newTheme) => set({ theme: newTheme }),
    }),
    {
      name: "theme",
    },
  ),
);

export default useUiStateStore;
