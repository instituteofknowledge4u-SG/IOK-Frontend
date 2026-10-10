// import { create } from "zustand";
// import toast from "react-hot-toast";
// import { api } from "../api/api";
// import useTradeStore from "./useTradeStore";

// // Helper to process incoming batches (Hydrates Trade Store & Cleans Name)
// const processBatchForTrade = (batch) => {
//   if (!batch || !batch.name) return batch;
//   const match = batch.name.match(/ \[Trade: (.*?)\]$/);
//   if (match) {
//     const tradeName = match[1];
//     const trades = useTradeStore.getState().trades;
//     const tradeObj = trades.find((t) => t.name === tradeName);
//     if (tradeObj && batch._id) {
//       useTradeStore.getState().assignTradeToBatch(batch._id, tradeObj.id);
//     }
//     return { ...batch, name: batch.name.replace(match[0], "") };
//   }
//   return batch;
// };

// // Helper to format outgoing batches (Appends Trade Name for cross-device persistence)
// const formatBatchNameForTrade = (name, batchId, tradeIdOverride) => {
//   let tradeId = tradeIdOverride;
//   if (!tradeId && batchId) {
//     tradeId = useTradeStore.getState().batchTradeMap[batchId];
//   }
//   if (tradeId) {
//     const tradeLabel = useTradeStore.getState().getTradeLabel(tradeId);
//     if (tradeLabel && name && !name.includes(`[Trade:`)) {
//       return `${name} [Trade: ${tradeLabel}]`;
//     }
//   }
//   return name;
// };

// const useBatchStore = create((set, get) => ({
//   batches: [],
//   currentBatch: null,
//   batchStudents: [],
//   isLoading: false,
//   error: null,

//   // 1. Fetch all batches (Backend should ideally filter this if a Student requests it)
//   fetchBatches: async () => {
//     set({ isLoading: true, error: null });
//     try {
//       const response = await api.get("/batch");
//       const processedBatches = response.data.map(processBatchForTrade);
//       set({ batches: processedBatches, isLoading: false });
//     } catch (error) {
//       const message =
//         error.response?.data?.message || "Failed to fetch batches";
//       set({ error: message, isLoading: false });
//       toast.error(message);
//     }
//   },

//   // 2. Fetch single batch details
//   fetchBatchById: async (id) => {
//     set({ isLoading: true, error: null });
//     try {
//       const response = await api.get(`/batch/show/${id}`);
//       const processedBatch = processBatchForTrade(response.data);
//       set({ currentBatch: processedBatch, isLoading: false });
//     } catch (error) {
//       const message =
//         error.response?.data?.message || "Failed to fetch batch details";
//       set({ error: message, isLoading: false });
//       toast.error(message);
//     }
//   },

//   // 3. Fetch students in a batch
//   fetchBatchStudents: async (id) => {
//     set({ isLoading: true, error: null });
//     try {
//       const response = await api.get(`/batch/students/${id}`);
//       set({ batchStudents: response.data, isLoading: false });
//     } catch (error) {
//       const message =
//         error.response?.data?.message || "Failed to fetch batch students";
//       set({ error: message, isLoading: false });
//       toast.error(message);
//     }
//   },

//   // 4. Create a batch (Admin)
//   createBatch: async (batchData, navigate, tradeId) => {
//     set({ isLoading: true, error: null });
//     try {
//       if (batchData.name) {
//         batchData.name = formatBatchNameForTrade(batchData.name, null, tradeId);
//       }

//       const response = await api.post("/batch/create", batchData);
//       const processedBatch = processBatchForTrade(response.data);

//       // Enrich the batch with teacher information from the request
//       if (batchData.teachers && batchData.teachers.length > 0) {
//         processedBatch.teachers = batchData.teachers.map((teacherId, idx) => ({
//           _id: teacherId,
//           name: batchData.teacherName || "Teacher",
//           email: batchData.teacherEmail || `teacher-${idx}@institute.local`,
//         }));
//       }

//       set((state) => ({
//         batches: [...state.batches, processedBatch],
//         isLoading: false,
//       }));

//       toast.success("Batch created successfully!");

//       // Refresh the batch list after a short delay to ensure backend has processed it
//       setTimeout(() => {
//         get().fetchBatches();
//       }, 500);

//       if (navigate) navigate(-1);

//       return processedBatch;
//     } catch (error) {
//       const message = error.response?.data?.error || "Failed to create batch";
//       set({ error: message, isLoading: false });
//       toast.error(message);
//     }
//   },

//   // 5. Add student to batch (Admin/Teacher)
//   addStudentToBatch: async (id, studentData) => {
//     set({ isLoading: true, error: null });
//     try {
//       await api.post(`/batch/add-student/${id}`, studentData);
//       toast.success("Student added successfully!");
//       // Optionally refresh batch details
//       get().fetchBatchById(id);
//     } catch (error) {
//       const message = error.response?.data?.message || "Failed to add student";
//       set({ error: message, isLoading: false });
//       toast.error(message);
//     }
//   },

//   // 6. Update batch (Admin)
//   updateBatch: async (id, updatedData, navigate) => {
//     set({ isLoading: true, error: null });
//     try {
//       if (updatedData.name) {
//         updatedData.name = formatBatchNameForTrade(updatedData.name, id);
//       }

//       const response = await api.put(`/batch/edit/${id}`, updatedData);
//       toast.success("Batch updated successfully!");
//       get().fetchBatchById(id); // Refresh current batch
//       // if (navigate) navigate(`/batches`);
//       if (navigate) navigate(-1);
//     } catch (error) {
//       const message = error.response?.data?.message || "Failed to update batch";
//       set({ error: message, isLoading: false });
//       toast.error(message);
//     }
//   },

//   // 7. Delete batch (Admin)
//   deleteBatch: async (id, navigate) => {
//     set({ isLoading: true, error: null });
//     try {
//       await api.delete(`/batch/delete/${id}`);
//       set((state) => ({
//         batches: state.batches.filter((batch) => batch._id !== id),
//         isLoading: false,
//       }));
//       toast.success("Batch deleted successfully!");
//       if (navigate) navigate(-1);
//     } catch (error) {
//       const message = error.response?.data?.message || "Failed to delete batch";
//       set({ error: message, isLoading: false });
//       toast.error(message);
//     }
//   },

//   // 8. Remove student from batch (Admin/Teacher)
//   removeStudentFromBatch: async (id, studentId, mainClassId) => {
//     set({ isLoading: true, error: null });
//     try {
//       await api.delete(`/batch/remove-student/${id}`, {
//         data: {
//           studentId: studentId,
//           mainClassId: mainClassId,
//         },
//       });
//       toast.success("Student removed successfully!");
//       // Refresh batch details to show the updated student list
//       get().fetchBatchById(id);
//     } catch (error) {
//       const message =
//         error.response?.data?.message || "Failed to remove student";
//       set({ error: message, isLoading: false });
//       toast.error(message);
//     }
//   },
// }));

// export default useBatchStore;

import { create } from "zustand";
import toast from "react-hot-toast";
import { api } from "../api/api";

// --------------------------------------------------
// Helpers
// --------------------------------------------------

const processBatchForTrade = (batch) => {
  if (!batch) return batch;

  // Keep your existing trade-store hydration logic here
  // if your project already has one.
  return batch;
};

const formatBatchNameForTrade = (name, batchId, tradeIdOverride) => {
  if (!name) return name;

  const tradeId = tradeIdOverride;

  if (!tradeId) return name;

  // Avoid adding the suffix multiple times
  if (name.includes("[Trade:")) {
    return name;
  }

  return `${name} [Trade: ${tradeId}]`;
};

// --------------------------------------------------
// Request cache
// --------------------------------------------------

const CACHE_TTL = 30 * 1000;

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
  return Date.now() - timestamp < CACHE_TTL;
};

const clearBatchCache = (id) => {
  if (id) {
    cache.batchDetails.delete(String(id));
    cache.batchStudents.delete(String(id));

    pendingRequests.batchDetails.delete(String(id));
    pendingRequests.batchStudents.delete(String(id));
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

// --------------------------------------------------
// Store
// --------------------------------------------------

const useBatchStore = create((set, get) => ({
  // -----------------------------------------------
  // State
  // -----------------------------------------------

  batches: [],
  currentBatch: null,
  batchStudents: [],

  isLoading: false,
  error: null,

  // -----------------------------------------------
  // Fetch all batches
  // -----------------------------------------------

  fetchBatches: async (force = false) => {
    const now = Date.now();

    // Use cached data
    if (!force && cache.batches.data && isCacheValid(cache.batches.timestamp)) {
      set({
        batches: cache.batches.data,
        isLoading: false,
        error: null,
      });

      return cache.batches.data;
    }

    // Reuse existing request
    if (pendingRequests.batches) {
      return pendingRequests.batches;
    }

    set({
      isLoading: true,
      error: null,
    });

    pendingRequests.batches = (async () => {
      try {
        const response = await api.get("/batch");

        const processedBatches = (response.data || []).map(
          processBatchForTrade,
        );

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

        set({
          error: message,
          isLoading: false,
        });

        toast.error(message);

        throw error;
      } finally {
        pendingRequests.batches = null;
      }
    })();

    return pendingRequests.batches;
  },

  // -----------------------------------------------
  // Fetch single batch
  // -----------------------------------------------

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

    // Reuse existing request
    const existingRequest = pendingRequests.batchDetails.get(key);

    if (existingRequest) {
      return existingRequest;
    }

    set({
      isLoading: true,
      error: null,
    });

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

        set({
          error: message,
          isLoading: false,
        });

        toast.error(message);

        throw error;
      } finally {
        pendingRequests.batchDetails.delete(key);
      }
    })();

    pendingRequests.batchDetails.set(key, request);

    return request;
  },

  // -----------------------------------------------
  // Fetch students of a batch
  // -----------------------------------------------

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

    // Reuse existing request
    const existingRequest = pendingRequests.batchStudents.get(key);

    if (existingRequest) {
      return existingRequest;
    }

    set({
      isLoading: true,
      error: null,
    });

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

        set({
          error: message,
          isLoading: false,
        });

        toast.error(message);

        throw error;
      } finally {
        pendingRequests.batchStudents.delete(key);
      }
    })();

    pendingRequests.batchStudents.set(key, request);

    return request;
  },

  // -----------------------------------------------
  // Create batch
  // -----------------------------------------------

  createBatch: async (data) => {
    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await api.post("/batch", data);

      toast.success("Batch created successfully!");

      // Invalidate cache
      clearAllBatchCache();

      // Refresh list once
      await get().fetchBatches(true);

      return response.data;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to create batch";

      set({
        error: message,
        isLoading: false,
      });

      toast.error(message);

      throw error;
    }
  },

  // -----------------------------------------------
  // Add student to batch
  // -----------------------------------------------

  addStudentToBatch: async (id, studentId, mainClassId) => {
    if (!id || !studentId) return null;

    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await api.post(`/batch/add-student/${id}`, {
        studentId,
        mainClassId,
      });

      toast.success("Student added successfully!");

      // Invalidate affected batch caches
      clearBatchCache(id);

      set({
        isLoading: false,
      });

      return response.data;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to add student to batch";

      set({
        error: message,
        isLoading: false,
      });

      toast.error(message);

      throw error;
    }
  },

  // -----------------------------------------------
  // Update batch
  // -----------------------------------------------

  updateBatch: async (id, data) => {
    if (!id) return null;

    set({
      isLoading: true,
      error: null,
    });

    try {
      const response = await api.put(`/batch/${id}`, data);

      toast.success("Batch updated successfully!");

      // Invalidate cache
      clearAllBatchCache();

      set({
        isLoading: false,
      });

      return response.data;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to update batch";

      set({
        error: message,
        isLoading: false,
      });

      toast.error(message);

      throw error;
    }
  },

  // -----------------------------------------------
  // Delete batch
  // -----------------------------------------------

  deleteBatch: async (id) => {
    if (!id) return false;

    set({
      isLoading: true,
      error: null,
    });

    try {
      await api.delete(`/batch/${id}`);

      toast.success("Batch deleted successfully!");

      clearBatchCache(id);

      // Remove from local state immediately
      set((state) => ({
        batches: state.batches.filter(
          (batch) => String(batch.id) !== String(id),
        ),

        currentBatch:
          state.currentBatch && String(state.currentBatch.id) === String(id)
            ? null
            : state.currentBatch,

        isLoading: false,
      }));

      // Invalidate complete batch cache
      cache.batches = {
        data: get().batches,
        timestamp: Date.now(),
      };

      return true;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to delete batch";

      set({
        error: message,
        isLoading: false,
      });

      toast.error(message);

      throw error;
    }
  },

  // -----------------------------------------------
  // REMOVE STUDENT FROM BATCH
  // -----------------------------------------------

  removeStudentFromBatch: async (id, studentId, mainClassId) => {
    if (!id || !studentId) {
      toast.error("Batch ID and student ID are required");
      return false;
    }

    set({
      isLoading: true,
      error: null,
    });

    try {
      await api.delete(`/batch/remove-student/${id}`, {
        data: {
          studentId,
          mainClassId,
        },
      });

      // -------------------------------------------
      // Optimistic update
      // -------------------------------------------

      set((state) => ({
        batchStudents: state.batchStudents.filter((student) => {
          const currentStudentId =
            student?.id ?? student?.studentId ?? student?.userId;

          return String(currentStudentId) !== String(studentId);
        }),
      }));

      // -------------------------------------------
      // Update cached students
      // -------------------------------------------

      const key = String(id);
      const cachedStudents = cache.batchStudents.get(key);

      if (cachedStudents) {
        const updatedStudents = cachedStudents.data.filter((student) => {
          const currentStudentId =
            student?.id ?? student?.studentId ?? student?.userId;

          return String(currentStudentId) !== String(studentId);
        });

        cache.batchStudents.set(key, {
          data: updatedStudents,
          timestamp: Date.now(),
        });

        set({
          batchStudents: updatedStudents,
        });
      }

      // Batch details may have changed too
      cache.batchDetails.delete(key);

      toast.success("Student removed successfully!");

      set({
        isLoading: false,
      });

      return true;
    } catch (error) {
      const message =
        error?.response?.data?.message || "Failed to remove student";

      set({
        error: message,
        isLoading: false,
      });

      toast.error(message);

      return false;
    }
  },

  // -----------------------------------------------
  // Clear current batch
  // -----------------------------------------------

  clearCurrentBatch: () => {
    set({
      currentBatch: null,
      batchStudents: [],
      error: null,
    });
  },

  // -----------------------------------------------
  // Clear errors
  // -----------------------------------------------

  clearError: () => {
    set({
      error: null,
    });
  },

  // -----------------------------------------------
  // Clear cache manually
  // -----------------------------------------------

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
