import { create } from "zustand";
import toast from "react-hot-toast";
import { api } from "../api/api";
import useTradeStore from "./useTradeStore";

// Helper to process batches to clean names and hydrate trade store
const processBatchName = (batch) => {
  if (!batch || !batch.name) return batch;
  const match = batch.name.match(/ \[Trade: (.*?)\]$/);
  if (match) {
    const tradeName = match[1];
    const trades = useTradeStore.getState().trades;
    const tradeObj = trades.find((t) => t.name === tradeName);
    if (tradeObj && batch._id) {
      useTradeStore.getState().assignTradeToBatch(batch._id, tradeObj.id);
    }
    return { ...batch, name: batch.name.replace(match[0], "") };
  }
  return batch;
};

// Helper to process batches inside classes
const processClassBatches = (cls) => {
  if (cls && cls.batches && Array.isArray(cls.batches)) {
    cls.batches = cls.batches.map(processBatchName);
  }
  return cls;
};

const useFeesStore = create((set, get) => ({
  students: [],
  mainClasses: [],
  batches: [],
  selectedMainClass: null,
  selectedBatch: null,
  isLoading: false,
  error: null,

  // Fetch all main classes
  fetchMainClasses: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/mainclass");
      const processedClasses = response.data.map(processClassBatches);
      set({ mainClasses: processedClasses, isLoading: false });
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch main classes";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // Fetch all batches
  fetchBatches: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/batch");
      const processedBatches = response.data.map(processBatchName);
      set({ batches: processedBatches, isLoading: false });
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch batches";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // Fetch students for a specific batch
  fetchStudentsForBatch: async (batchId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/batch/students/${batchId}`);
      set({ students: response.data, isLoading: false });
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch students";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // Fetch students for a specific main class (using batch endpoint)
  fetchStudentsForClass: async (mainClassId) => {
    set({ isLoading: true, error: null });
    try {
      // Get all batches and filter for the selected main class
      const batchesResponse = await api.get("/batch");
      const relevantBatches = batchesResponse.data
        .map(processBatchName)
        .filter((batch) =>
          batch.mainClasses?.some(
            (mc) => mc._id === mainClassId || mc === mainClassId,
          ),
        );

      // Collect all students from relevant batches
      const studentMap = new Map();
      for (const batch of relevantBatches) {
        if (batch.students && batch.students.length > 0) {
          // Fetch detailed student info from batch students endpoint
          try {
            const studentsResponse = await api.get(
              `/batch/students/${batch._id}`,
            );
            for (const student of studentsResponse.data) {
              if (!studentMap.has(student._id)) {
                studentMap.set(student._id, student);
              }
            }
          } catch (e) {
            // Continue if individual batch fetch fails
          }
        }
      }

      const students = Array.from(studentMap.values());
      set({ students, isLoading: false });
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch students";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // Get fees details for a student
  getFeesDetails: async (mainClassId, studentId) => {
    try {
      const response = await api.get(
        `/fees/details/${mainClassId}/${studentId}`,
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch fees details";
      toast.error(message);
      return null;
    }
  },

  // Calculate fine based on payment date
  calculateFine: async (mainClassId, studentId, paymentDate) => {
    try {
      const response = await api.post(
        `/fees/calculate-fine/${mainClassId}/${studentId}`,
        { paymentDate },
      );
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to calculate fine";
      toast.error(message);
      return null;
    }
  },

  // Record student fees payment
  recordFeesPaid: async (mainClassId, studentId, paymentData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post(
        `/fees/pay/${mainClassId}/${studentId}`,
        paymentData,
      );
      set({ isLoading: false });
      toast.success("Fees recorded successfully");
      // console.log(response.data);
      return response.data;
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to record fees payment";
      set({ error: message, isLoading: false });
      toast.error(message);
      return null;
    }
  },

  // Set selected main class
  setSelectedMainClass: (mainClassId) => {
    set({ selectedMainClass: mainClassId });
  },

  // Set selected batch
  setSelectedBatch: (batchId) => {
    set({ selectedBatch: batchId });
  },

  // Clear selections
  clearSelections: () => {
    set({ selectedMainClass: null, selectedBatch: null, students: [] });
  },
}));

export default useFeesStore;
