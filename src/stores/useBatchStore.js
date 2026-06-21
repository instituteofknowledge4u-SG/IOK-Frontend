import { create } from "zustand";
import toast from "react-hot-toast";
import { api } from "../api/api";
import useTradeStore from "./useTradeStore";

// Helper to process incoming batches (Hydrates Trade Store & Cleans Name)
const processBatchForTrade = (batch) => {
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

// Helper to format outgoing batches (Appends Trade Name for cross-device persistence)
const formatBatchNameForTrade = (name, batchId, tradeIdOverride) => {
  let tradeId = tradeIdOverride;
  if (!tradeId && batchId) {
    tradeId = useTradeStore.getState().batchTradeMap[batchId];
  }
  if (tradeId) {
    const tradeLabel = useTradeStore.getState().getTradeLabel(tradeId);
    if (tradeLabel && name && !name.includes(`[Trade:`)) {
      return `${name} [Trade: ${tradeLabel}]`;
    }
  }
  return name;
};

const useBatchStore = create((set, get) => ({
  batches: [],
  currentBatch: null,
  batchStudents: [],
  isLoading: false,
  error: null,

  // 1. Fetch all batches (Backend should ideally filter this if a Student requests it)
  fetchBatches: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/batch");
      const processedBatches = response.data.map(processBatchForTrade);
      set({ batches: processedBatches, isLoading: false });
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch batches";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // 2. Fetch single batch details
  fetchBatchById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/batch/show/${id}`);
      const processedBatch = processBatchForTrade(response.data);
      set({ currentBatch: processedBatch, isLoading: false });
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch batch details";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // 3. Fetch students in a batch
  fetchBatchStudents: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/batch/students/${id}`);
      set({ batchStudents: response.data, isLoading: false });
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to fetch batch students";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // 4. Create a batch (Admin)
  createBatch: async (batchData, navigate, tradeId) => {
    set({ isLoading: true, error: null });
    try {
      if (batchData.name) {
        batchData.name = formatBatchNameForTrade(batchData.name, null, tradeId);
      }

      const response = await api.post("/batch/create", batchData);
      const processedBatch = processBatchForTrade(response.data);

      // Enrich the batch with teacher information from the request
      if (batchData.teachers && batchData.teachers.length > 0) {
        processedBatch.teachers = batchData.teachers.map((teacherId, idx) => ({
          _id: teacherId,
          name: batchData.teacherName || "Teacher",
          email: batchData.teacherEmail || `teacher-${idx}@institute.local`,
        }));
      }

      set((state) => ({
        batches: [...state.batches, processedBatch],
        isLoading: false,
      }));

      toast.success("Batch created successfully!");

      // Refresh the batch list after a short delay to ensure backend has processed it
      setTimeout(() => {
        get().fetchBatches();
      }, 500);

      if (navigate) navigate(-1);

      return processedBatch;
    } catch (error) {
      const message = error.response?.data?.error || "Failed to create batch";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // 5. Add student to batch (Admin/Teacher)
  addStudentToBatch: async (id, studentData) => {
    set({ isLoading: true, error: null });
    try {
      await api.post(`/batch/add-student/${id}`, studentData);
      toast.success("Student added successfully!");
      // Optionally refresh batch details
      get().fetchBatchById(id);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to add student";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // 6. Update batch (Admin)
  updateBatch: async (id, updatedData, navigate) => {
    set({ isLoading: true, error: null });
    try {
      if (updatedData.name) {
        updatedData.name = formatBatchNameForTrade(updatedData.name, id);
      }

      const response = await api.put(`/batch/edit/${id}`, updatedData);
      toast.success("Batch updated successfully!");
      get().fetchBatchById(id); // Refresh current batch
      // if (navigate) navigate(`/batches`);
      if (navigate) navigate(-1);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to update batch";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // 7. Delete batch (Admin)
  deleteBatch: async (id, navigate) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/batch/delete/${id}`);
      set((state) => ({
        batches: state.batches.filter((batch) => batch._id !== id),
        isLoading: false,
      }));
      toast.success("Batch deleted successfully!");
      if (navigate) navigate(-1);
    } catch (error) {
      const message = error.response?.data?.message || "Failed to delete batch";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },

  // 8. Remove student from batch (Admin/Teacher)
  removeStudentFromBatch: async (id, studentId, mainClassId) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/batch/remove-student/${id}`, {
        data: {
          studentId: studentId,
          mainClassId: mainClassId,
        },
      });
      toast.success("Student removed successfully!");
      // Refresh batch details to show the updated student list
      get().fetchBatchById(id);
    } catch (error) {
      const message =
        error.response?.data?.message || "Failed to remove student";
      set({ error: message, isLoading: false });
      toast.error(message);
    }
  },
}));

export default useBatchStore;
