import { create } from "zustand";
export const useLoginStore = create((set) => ({
  isOpen: false,
  step: 1,
  openModal: () => set({ isOpen: true, step: 1 }),
  closeModal: () => set({ isOpen: false }),
  nextStep: () => set({ step: 2 }),
}));
