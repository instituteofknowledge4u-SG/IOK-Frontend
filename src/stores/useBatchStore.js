import { create } from "zustand";
import toast from "react-hot-toast";
import { api } from "../api/api";
import useTradeStore from "./useTradeStore";

const processBatchForTrade = (batch) => {
  if (!batch || !batch.name) return batch;
  const match = batch.name.match(/ \[Trade: (.*?)\]$/);
  if (match) {
    const tradeName = match[1];
    const tradeState = useTradeStore?.getState?.();
    if (tradeState) {
      const trades = tradeState.trades || [];
      const tradeObj = trades.find((t) => t.name === tradeName || String(t.id) === String(tradeName));
      const batchId = batch._id || batch.id;
      if (tradeObj && batchId && tradeState.assignTradeToBatch) {
        tradeState.assignTradeToBatch(batchId, tradeObj.id);
      }
    }
    return { ...batch, name: batch.name.replace(match[0], "") };
  }
  return batch;
};

// Helper to format outgoing batches (Appends Trade Name for cross-device persistence)
const formatBatchNameForTrade = (name, batchId, tradeIdOverride) => {
  if (!name) return name;
  let tradeId = tradeIdOverride;
  const tradeState = useTradeStore?.getState?.();

  if (!tradeId && batchId && tradeState?.batchTradeMap) {
    tradeId = tradeState.batchTradeMap[batchId];
  }

  if (tradeId) {
    const tradeLabel = tradeState?.getTradeLabel
      ? tradeState.getTradeLabel(tradeId)
      : tradeId;
    if (tradeLabel && !name.includes("[Trade:")) {
      return `${name} [Trade: ${tradeLabel}]`;
    }
  }
  return name;
};

const CACHE_TTL = 30 * 1000; // 30 seconds cache TTL

const cache = {
  batches: {
    data: null,
    timestamp: 0,
  },
  batchDetails: new Map(),
  batchStudents: new Map(),
};

const pendingRequests = {
  batches: null,
  batchDetails: new Map(),
  batchStudents: new Map(),
};

const isCacheValid = (timestamp) => {
  return Boolean(timestamp && Date.now() - timestamp < CACHE_TTL);
};

const clearBatchCache = (id) => {
  if (id) {
    const key = String(id);
    cache.batchDetails.delete(key);
    cache.batchStudents.delete(key);
    pendingRequests.batchDetails.delete(key);
    pendingRequests.batchStudents.delete(key);
  }
};

const clearAllBatchCache = () => {
  cache.batches = {
    data: null,
    timestamp: 0,
  };
  cache.batchDetails.clear();
  cache.batchStudents.clear();

  pendingRequests.batches = null;
  pendingRequests.batchDetails.clear();
  pendingRequests.batchStudents.clear();
};

const useBatchStore = create((set, get) => ({
  batches: [],
  currentBatch: null,
  batchStudents: [],
  isLoading: false,
  error: null,

  // Helper to sync in-place updates with cache
  syncCurrentBatchCache: (id, updatedBatch) => {
    if (!id || !updatedBatch) return;
    const key = String(id);
    cache.batchDetails.set(key, {
      data: updatedBatch,
      timestamp: Date.now(),
    });
    set({ currentBatch: updatedBatch });
  },

  // 1. Fetch all batches
  fetchBatches: async (force = false) => {
    const now = Date.now();

    if (!force && cache.batches.data && isCacheValid(cache.batches.timestamp)) {
      set({
        batches: cache.batches.data,
        isLoading: false,
        error: null,
      });
      return cache.batches.data;
    }

    if (pendingRequests.batches) {
      return pendingRequests.batches;
    }

    set({ isLoading: true, error: null });

    pendingRequests.batches = (async () => {
      try {
        const response = await api.get("/batch");
        const processedBatches = (response.data || []).map(processBatchForTrade);

        cache.batches = {
          data: processedBatches,
          timestamp: now,
        };

        set({
          batches: processedBatches,
          isLoading: false,
          error: null,
        });

        return processedBatches;
      } catch (error) {
        const message =
          error?.response?.data?.message || "Failed to fetch batches";
        set({ error: message, isLoading: false });
        toast.error(message);
        throw error;
      } finally {
        pendingRequests.batches = null;
      }
    })();

    return pendingRequests.batches;
  },

  // 2. Fetch single batch details
  fetchBatchById: async (id, force = false) => {
    if (!id) return null;

    const key = String(id);
    const cached = cache.batchDetails.get(key);

    if (!force && cached && isCacheValid(cached.timestamp)) {
      set({
        currentBatch: cached.data,
        isLoading: false,
        error: null,
      });
      return cached.data;
    }

    const existingRequest = pendingRequests.batchDetails.get(key);
    if (existingRequest) {
      return existingRequest;
    }

    set({ isLoading: true, error: null });

    const request = (async () => {
      try {
        const response = await api.get(`/batch/show/${id}`);
        const processedBatch = processBatchForTrade(response.data);

        cache.batchDetails.set(key, {
          data: processedBatch,
          timestamp: Date.now(),
        });

        set({
          currentBatch: processedBatch,
          isLoading: false,
          error: null,
        });

        return processedBatch;
      } catch (error) {
        const message =
          error?.response?.data?.message || "Failed to fetch batch details";
        set({ error: message, isLoading: false });
        toast.error(message);
        throw error;
      } finally {
        pendingRequests.batchDetails.delete(key);
      }
    })();

    pendingRequests.batchDetails.set(key, request);
    return request;
  },

  // 3. Fetch students of a batch
  fetchBatchStudents: async (id, force = false) => {
    if (!id) return [];

    const key = String(id);
    const cached = cache.batchStudents.get(key);

    if (!force && cached && isCacheValid(cached.timestamp)) {
      set({
        batchStudents: cached.data,
        isLoading: false,
        error: null,
      });
      return cached.data;
    }

    const existingRequest = pendingRequests.batchStudents.get(key);
    if (existingRequest) {
      return existingRequest;
    }

    set({ isLoading: true, error: null });

    const request = (async () => {
      try {
        const response = await api.get(`/batch/students/${id}`);
        const students = response.data || [];

        cache.batchStudents.set(key, {
          data: students,
          timestamp: Date.now(),
        });

        set({
          batchStudents: students,
          isLoading: false,
          error: null,
        });

        return students;
      } catch (error) {
        const message =
          error?.response?.data?.message || "Failed to fetch batch students";
        set({ error: message, isLoading: false });
        toast.error(message);
        throw error;
      } finally {
        pendingRequests.batchStudents.delete(key);
      }
    })();

    pendingRequests.batchStudents.set(key, request);
    return request;
  },

  // 4. Create a batch (Admin)
  createBatch: async (batchData, navigate, tradeId) => {
    set({ isLoading: true, error: null });

    try {
      const payload = { ...batchData };
      if (payload.name) {
        payload.name = formatBatchNameForTrade(payload.name, null, tradeId);
      }

      const response = await api.post("/batch/create", payload);
      const processedBatch = processBatchForTrade(response.data);

      if (payload.teachers && payload.teachers.length > 0 && processedBatch) {
        processedBatch.teachers = payload.teachers.map((teacherId, idx) => ({
          _id: teacherId,
          name: payload.teacherName || "Teacher",
          email: payload.teacherEmail || `teacher-${idx}@institute.local`,
        }));
      }

      clearAllBatchCache();

      set((state) => ({
        batches: processedBatch
          ? [...state.batches, processedBatch]
          : state.batches,
        isLoading: false,
        error: null,
      }));

      toast.success("Batch created successfully!");

      setTimeout(() => {
        get().fetchBatches(true).catch(() => {});
      }, 500);

      if (typeof navigate === "function") navigate(-1);

      return processedBatch;
    } catch (error) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Failed to create batch";
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  // 5. Add student to batch (Supports both object payload & positional args)
  addStudentToBatch: async (id, studentDataOrId, mainClassId) => {
    if (!id || !studentDataOrId) return null;

    set({ error: null });

    const payload =
      typeof studentDataOrId === "object" && studentDataOrId !== null
        ? studentDataOrId
        : { studentId: studentDataOrId, mainClassId };

    try {
      const response = await api.post(`/batch/add-student/${id}`, payload);
      toast.success("Student added successfully!");

      // Invalidate cached batch list & student list so next visit has fresh data
      cache.batches.timestamp = 0;
      clearBatchCache(id);

      return response.data;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to add student to batch";
      set({ error: message });
      toast.error(message);
      throw error;
    }
  },

  // 6. Update batch (Admin)
  updateBatch: async (id, updatedData, navigate) => {
    if (!id) return null;

    set({ isLoading: true, error: null });

    try {
      const payload = { ...updatedData };
      if (payload.name) {
        payload.name = formatBatchNameForTrade(payload.name, id);
      }

      const response = await api.put(`/batch/edit/${id}`, payload);
      toast.success("Batch updated successfully!");

      clearAllBatchCache();
      await get().fetchBatchById(id, true);

      if (typeof navigate === "function") navigate(-1);

      return response.data;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to update batch";
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  // 7. Delete batch (Admin)
  deleteBatch: async (id, navigate) => {
    if (!id) return false;

    set({ isLoading: true, error: null });

    try {
      await api.delete(`/batch/delete/${id}`);
      toast.success("Batch deleted successfully!");

      clearBatchCache(id);

      set((state) => {
        const updatedBatches = state.batches.filter(
          (batch) => String(batch._id || batch.id) !== String(id)
        );
        const isCurrentDeleted =
          state.currentBatch &&
          String(state.currentBatch._id || state.currentBatch.id) === String(id);

        cache.batches = {
          data: updatedBatches,
          timestamp: Date.now(),
        };

        return {
          batches: updatedBatches,
          currentBatch: isCurrentDeleted ? null : state.currentBatch,
          isLoading: false,
          error: null,
        };
      });

      if (typeof navigate === "function") navigate(-1);

      return true;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to delete batch";
      set({ error: message, isLoading: false });
      toast.error(message);
      throw error;
    }
  },

  // 8. Remove student from batch (Admin/Teacher)
  removeStudentFromBatch: async (id, studentId, mainClassId) => {
    if (!id || !studentId) {
      toast.error("Batch ID and student ID are required");
      return false;
    }

    set({ error: null });

    try {
      await api.delete(`/batch/remove-student/${id}`, {
        data: {
          studentId,
          mainClassId,
        },
      });

      const matchStudentId = (student) => {
        const currentStudentId =
          student?._id ?? student?.id ?? student?.studentId ?? student?.userId;
        return String(currentStudentId) !== String(studentId);
      };

      set((state) => ({
        batchStudents: state.batchStudents.filter(matchStudentId),
      }));

      const key = String(id);
      const cachedStudents = cache.batchStudents.get(key);

      if (cachedStudents) {
        const updatedStudents = cachedStudents.data.filter(matchStudentId);
        cache.batchStudents.set(key, {
          data: updatedStudents,
          timestamp: Date.now(),
        });
      }

      // Clear batch caches so subsequent fetches stay consistent
      cache.batchDetails.delete(key);
      cache.batches.timestamp = 0;

      toast.success("Student removed successfully!");
      return true;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to remove student";
      set({ error: message });
      toast.error(message);
      return false;
    }
  },

  // Clear current batch
  clearCurrentBatch: () => {
    set({
      currentBatch: null,
      batchStudents: [],
      error: null,
    });
  },

  // Clear errors
  clearError: () => {
    set({ error: null });
  },

  // Clear cache manually
  clearCache: () => {
    clearAllBatchCache();
    set({
      batches: [],
      currentBatch: null,
      batchStudents: [],
    });
  },
}));

export default useBatchStore;



