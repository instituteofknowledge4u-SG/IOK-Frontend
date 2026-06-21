import { create } from "zustand";
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

const useAttendanceStore = create((set, get) => ({
  isLoading: false,
  error: null,
  success: false,
  batches: [],
  selectedBatch: null,
  students: [],
  attendance: {},
  attendanceDate: new Date().toISOString().split("T")[0],

  // Fetch all batches (for admin)
  getAllBatches: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get("/batch");
      let batchesData = response.data?.data || response.data || [];
      batchesData = batchesData.map(processBatchName);

      set({
        isLoading: false,
        batches: batchesData,
      });
      return batchesData;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch batches";
      set({
        isLoading: false,
        error: errorMessage,
      });
      console.error("Get All Batches Error:", err);
      throw err;
    }
  },

  // Fetch teacher batches
  getTeacherBatches: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/user/details/${userId}`);
      const userData = response.data.data;

      // Get batches with full data
      let batchesData = [];
      if (userData.batches && Array.isArray(userData.batches)) {
        batchesData = userData.batches.map(processBatchName);
      } else if (userData.batches && typeof userData.batches === "object") {
        batchesData = [processBatchName(userData.batches)];
      }

      set({
        isLoading: false,
        batches: batchesData,
      });
      return batchesData;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to fetch teacher batches";
      set({
        isLoading: false,
        error: errorMessage,
      });
      console.error("Get Batches Error:", err);
      throw err;
    }
  },

  // Select batch and get students
  selectBatch: async (batch) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch full batch data with populated students
      const response = await api.get(`/batch/show/${batch._id}`);
      const fullBatchData = processBatchName(
        response.data || response.data.data,
      );

      // Get students from mainClassStudentPairs
      let students = [];

      if (
        fullBatchData.mainClassStudentPairs &&
        Array.isArray(fullBatchData.mainClassStudentPairs)
      ) {
        // Extract unique students from pairs
        const studentMap = {};
        fullBatchData.mainClassStudentPairs.forEach((pair) => {
          if (pair.student && pair.student._id) {
            if (!studentMap[pair.student._id]) {
              studentMap[pair.student._id] = pair.student;
            }
          }
        });
        students = Object.values(studentMap);
      }

      // Fallback: use students array if mainClassStudentPairs is empty
      if (
        students.length === 0 &&
        fullBatchData.students &&
        Array.isArray(fullBatchData.students)
      ) {
        students = fullBatchData.students;
      }

      // Initialize attendance object
      const attendance = {};
      students.forEach((student) => {
        attendance[student._id] = false; // Default to absent (manual)
      });

      set({
        isLoading: false,
        selectedBatch: fullBatchData,
        students: students,
        attendance: attendance,
      });

      // Fetch and apply historical attendance for the currently selected date
      await get().loadAttendanceState(
        fullBatchData._id,
        get().attendanceDate,
        students,
      );

      return students;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to select batch";
      set({
        isLoading: false,
        error: errorMessage,
      });
      console.error("Select Batch Error:", err);
      throw err;
    }
  },

  // Load historical attendance state from the backend
  loadAttendanceState: async (batchId, date, studentsList) => {
    let newAttendance = {};

    // 1. Force default everything to absent (false)
    studentsList.forEach((student) => {
      newAttendance[student._id] = false;
    });

    try {
      // 2. Fetch the attendance record for the date
      // Try standard route, fallback to by-date route if needed
      let response;
      try {
        // Try the by-date route first (more specific)
        response = await api.get(`/attendence/by-date/${batchId}?date=${date}`);
      } catch (e) {
        // Fallback to standard route
        response = await api.get(`/attendence/${batchId}?date=${date}`);
      }

      const data = response.data?.data || response.data;

      // If data is nested (e.g. data.attendance)
      const actualData = data?.attendance ? data.attendance : data;

      // Extract the correct record
      let record = null;

      if (Array.isArray(actualData)) {
        const isIndividualRecords =
          actualData.length > 0 &&
          (actualData[0].student || actualData[0].studentId) &&
          actualData[0].status;

        if (isIndividualRecords) {
          // Scenario A: Array of individual Attendence documents
          actualData.forEach((rec) => {
            const studentId =
              typeof rec.student === "object"
                ? rec.student._id
                : rec.student || rec.studentId;
            if (
              studentId &&
              rec.status &&
              rec.status.toLowerCase() === "present"
            ) {
              newAttendance[studentId.toString()] = true;
            }
          });
          set({ attendance: newAttendance });
          return;
        } else {
          // Scenario B: Array of daily summary Class documents
          record = actualData.find((d) => {
            if (!d.date) return false;
            if (d.date.startsWith(date)) return true;
            try {
              if (new Date(d.date).toISOString().split("T")[0] === date)
                return true;
            } catch (e) {}
            // Loose fallback match
            const dateParts = date.split("-");
            return dateParts.every((part) => d.date.includes(part));
          });

          // Fallback to the first item if the backend already filtered by date
          if (!record && actualData.length > 0) {
            record = actualData[0];
          }
        }
      } else if (actualData && typeof actualData === "object") {
        // Scenario C: Single Class document returned directly
        record = actualData;
      }

      // If we found a valid daily record, accurately map the present students
      if (record) {
        const presentArray =
          record.presentStudentIds ||
          record.Present_students ||
          record.presentStudents ||
          record.present ||
          record.students ||
          record.attendance ||
          [];

        if (Array.isArray(presentArray)) {
          const presentIds = presentArray.map((id) => {
            if (typeof id === "object") {
              return (
                id.student ||
                id.studentId ||
                id._id ||
                id.id ||
                id
              ).toString();
            }
            return id.toString();
          });

          studentsList.forEach((student) => {
            if (presentIds.includes(student._id.toString())) {
              newAttendance[student._id] = true;
            }
          });
        }
      }
    } catch (err) {
      // Expected behavior for days where attendance has never been submitted
      console.warn(
        "Could not fetch historical attendance, defaulting to absent.",
        err,
      );
    }

    set({ attendance: newAttendance });
  },

  // Toggle attendance for a student
  toggleAttendance: (studentId) => {
    set((state) => ({
      attendance: {
        ...state.attendance,
        [studentId]: !state.attendance[studentId],
      },
    }));
  },

  // Mark all present
  markAllPresent: () => {
    const { students } = get();
    const newAttendance = {};
    students.forEach((student) => {
      newAttendance[student._id] = true;
    });
    set({ attendance: newAttendance });
  },

  // Mark all absent
  markAllAbsent: () => {
    const { students } = get();
    const newAttendance = {};
    students.forEach((student) => {
      newAttendance[student._id] = false;
    });
    set({ attendance: newAttendance });
  },

  // Submit attendance to backend
  submitAttendance: async () => {
    const { selectedBatch, attendance, attendanceDate, students } = get();

    if (!selectedBatch) {
      throw new Error("No batch selected");
    }

    set({ isLoading: true, error: null });
    try {
      const presentStudentIds = students
        .filter((student) => attendance[student._id])
        .map((student) => student._id);

      const response = await api.post(`/attendence/mark/${selectedBatch._id}`, {
        presentStudentIds,
        date: attendanceDate,
      });

      set({
        isLoading: false,
        success: true,
        attendance: {},
      });

      setTimeout(() => set({ success: false }), 3000);
      return response.data;
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Failed to submit attendance";
      set({
        isLoading: false,
        error: errorMessage,
      });
      console.error("Submit Attendance Error:", err);
      throw err;
    }
  },

  // Update attendance date
  setAttendanceDate: async (date) => {
    set({ attendanceDate: date, isLoading: true });
    const { selectedBatch, students, loadAttendanceState } = get();

    // Reload the specific attendance data for this newly selected date
    if (selectedBatch && students.length > 0) {
      await loadAttendanceState(selectedBatch._id, date, students);
    }
    set({ isLoading: false });
  },

  // Reset store
  resetStore: () => {
    set({
      isLoading: false,
      error: null,
      success: false,
      selectedBatch: null,
      students: [],
      attendance: {},
      attendanceDate: new Date().toISOString().split("T")[0],
    });
  },

  // Reset error
  clearError: () => set({ error: null }),
}));

export default useAttendanceStore;
