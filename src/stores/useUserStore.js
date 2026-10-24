// import { create } from "zustand";
// import { persist, createJSONStorage } from "zustand/middleware";
// import { api } from "../api/api";

// const useUserStore = create(
//   persist(
//     (set, get) => ({
//       isLoading: false,
//       error: null,
//       success: false,
//       students: [],
//       teachers: [],
//       studentProgress: {}, // Store progress data { studentId_mainClassId: { batchcompletion, examcompletion, certificateIssued } }

//       getStudents: async () => {
//         set({ isLoading: true, error: null });
//         try {
//           const response = await api.get("/user/students");
//           set({
//             students: response.data?.data || response.data || [],
//             isLoading: false,
//           });
//           return response.data;
//         } catch (err) {}
//       },

//       getTeachers: async () => {
//         set({ isLoading: true, error: null });
//         try {
//           const response = await api.get("/user/teachers");
//           set({
//             teachers: response.data?.data || response.data || [],
//             isLoading: false,
//           });
//           return response.data;
//         } catch (err) {}
//       },

//       getUserById: async (id) => {
//         set({ isLoading: true, error: null });
//         try {
//           const response = await api.get(`/user/details/${id}`);
//           set({ isLoading: false });
//           return response.data?.data || response.data?.user || response.data;
//         } catch (err) {
//           const errorMessage =
//             err.response?.data?.message || "Error fetching user details";
//           set({ isLoading: false, error: errorMessage });
//           setTimeout(() => set({ error: null }), 4000);
//           throw err;
//         }
//       },

//       // Fetch progress data for a specific student from a mainClass
//       getStudentProgress: async (studentId, mainClassId) => {
//         try {
//           const response = await api.get(
//             `/attendance/summary/mainclass/${mainClassId}/student/${studentId}`,
//           );
//           const data = response.data?.data || {};

//           const key = `${studentId}_${mainClassId}`;
//           set((state) => ({
//             studentProgress: {
//               ...state.studentProgress,
//               [key]: {
//                 batchcompletion: data.batchcompletion || false,
//                 examcompletion: data.examcompletion || false,
//                 certificateIssued: data.certificateIssued || false,
//               },
//             },
//           }));

//           return data;
//         } catch (err) {
//           // Silently handle 404s (endpoint not ready yet) - don't log to console
//           if (err.response?.status === 404) {
//             return null;
//           }
//           console.error("Error fetching student progress:", err);
//           return null;
//         }
//       },

//       // Update progress for a student in a mainClass
//       updateStudentProgress: async (studentId, mainClassId, progressData) => {
//         try {
//           // Update UI optimistically
//           const key = `${studentId}_${mainClassId}`;
//           set((state) => ({
//             studentProgress: {
//               ...state.studentProgress,
//               [key]: {
//                 batchcompletion:
//                   progressData.batchcompletion !== undefined
//                     ? progressData.batchcompletion
//                     : state.studentProgress[key]?.batchcompletion || false,
//                 examcompletion:
//                   progressData.examcompletion !== undefined
//                     ? progressData.examcompletion
//                     : state.studentProgress[key]?.examcompletion || false,
//                 certificateIssued:
//                   progressData.certificateIssued !== undefined
//                     ? progressData.certificateIssued
//                     : state.studentProgress[key]?.certificateIssued || false,
//               },
//             },
//           }));

//           // Try to sync with backend
//           try {
//             const response = await api.patch(
//               `/attendance/update-progress/${studentId}/${mainClassId}`,
//               progressData,
//             );
//             return response.data;
//           } catch (apiErr) {
//             // If backend endpoint fails, UI still updates locally (graceful fallback)
//             console.warn(
//               "Backend sync failed, but UI updated locally:",
//               apiErr,
//             );
//             return null;
//           }
//         } catch (err) {
//           console.error("Error updating student progress:", err);
//           set({
//             error: err.response?.data?.message || "Error updating progress",
//           });
//           return null;
//         }
//       },

//       addUser: async (formData) => {
//         set({ isLoading: true, error: null, success: false });
//         try {
//           const response = await api.post("/user/add", formData);
//           set({ isLoading: false, success: true });
//           return response.data;
//         } catch (err) {
//           set({
//             isLoading: false,
//             error: err.response?.data?.message || "Something went wrong",
//           });
//           throw err;
//         }
//       },

//       updateUser: async (userId, formData) => {
//         set({ isLoading: true, error: null, success: false });

//         try {
//           const response = await api.patch(`/user/edit/${userId}`, formData);
//           const updatedUser = response.data?.user || response.data;
//           set((state) => ({
//             students: state.students?.map((s) =>
//               s._id === userId ? { ...s, ...updatedUser } : s,
//             ),
//             teachers: state.teachers?.map((t) =>
//               t._id === userId ? { ...t, ...updatedUser } : t,
//             ),
//             isLoading: false,
//             success: true,
//           }));
//           setTimeout(() => set({ success: false }), 3000);
//           return response.data;
//         } catch (err) {
//           const errorMessage =
//             err.response?.data?.message ||
//             "Something went wrong while updating the profile";

//           set({ isLoading: false, error: errorMessage });
//           setTimeout(() => set({ error: null }), 4000);
//           throw err;
//         }
//       },

//       deleteUser: async (userId) => {
//         set({ isLoading: true, error: null, success: false });
//         try {
//           const response = await api.delete(`/user/delete/${userId}`);

//           // Update the local state to remove the user without needing a full refresh
//           set((state) => ({
//             isLoading: false,
//             success: true,
//             students: state.students.filter((s) => s._id !== userId),
//             teachers: state.teachers.filter((t) => t._id !== userId),
//           }));
//           setTimeout(() => set({ success: false }), 3000);

//           return response.data;
//         } catch (err) {
//           const errorMessage =
//             err.response?.data?.message ||
//             "Something went wrong while deleting the user";

//           set({ isLoading: false, error: errorMessage });
//           setTimeout(() => set({ error: null }), 4000);
//           throw err;
//         }
//       },

//       resetStatus: () => set({ success: false, error: null }),
//     }),
//     {
//       name: "user-store",
//       storage: createJSONStorage(() => localStorage),
//       partialize: (state) => ({
//         studentProgress: state.studentProgress,
//       }),
//     },
//   ),
// );

// export default useUserStore;





import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { api } from "../api/api";

const USER_CACHE_TTL = 60 * 1000; // 1 minute cache TTL

const userCache = {
  students: { data: null, timestamp: 0 },
  teachers: { data: null, timestamp: 0 },
  userDetails: new Map(),
};

const pendingRequests = {
  students: null,
  teachers: null,
  userDetails: new Map(),
};

const isCacheValid = (timestamp) =>
  Boolean(timestamp && Date.now() - timestamp < USER_CACHE_TTL);

const useUserStore = create(
  persist(
    (set, get) => ({
      isLoading: false,
      error: null,
      success: false,
      students: [],
      teachers: [],
      studentProgress: {},

      getStudents: async (force = false) => {
        if (
          !force &&
          userCache.students.data &&
          isCacheValid(userCache.students.timestamp)
        ) {
          if (get().students !== userCache.students.data) {
            set({ students: userCache.students.data, isLoading: false });
          }
          return userCache.students.data;
        }

        if (pendingRequests.students) {
          return pendingRequests.students;
        }

        set({ isLoading: true, error: null });

        pendingRequests.students = (async () => {
          try {
            const response = await api.get("/user/students");
            const studentsList =
              response.data?.data || response.data || [];

            userCache.students = {
              data: studentsList,
              timestamp: Date.now(),
            };

            // Also seed individual user cache for instant profile lookups
            if (Array.isArray(studentsList)) {
              studentsList.forEach((student) => {
                if (student?._id) {
                  userCache.userDetails.set(String(student._id), {
                    data: student,
                    timestamp: Date.now(),
                  });
                }
              });
            }

            set({
              students: studentsList,
              isLoading: false,
            });
            return studentsList;
          } catch (err) {
            set({
              isLoading: false,
              error:
                err.response?.data?.message || "Failed to fetch students",
            });
            return get().students || [];
          } finally {
            pendingRequests.students = null;
          }
        })();

        return pendingRequests.students;
      },

      getTeachers: async (force = false) => {
        if (
          !force &&
          userCache.teachers.data &&
          isCacheValid(userCache.teachers.timestamp)
        ) {
          if (get().teachers !== userCache.teachers.data) {
            set({ teachers: userCache.teachers.data, isLoading: false });
          }
          return userCache.teachers.data;
        }

        if (pendingRequests.teachers) {
          return pendingRequests.teachers;
        }

        set({ isLoading: true, error: null });

        pendingRequests.teachers = (async () => {
          try {
            const response = await api.get("/user/teachers");
            const teachersList =
              response.data?.data || response.data || [];

            userCache.teachers = {
              data: teachersList,
              timestamp: Date.now(),
            };

            if (Array.isArray(teachersList)) {
              teachersList.forEach((teacher) => {
                if (teacher?._id) {
                  userCache.userDetails.set(String(teacher._id), {
                    data: teacher,
                    timestamp: Date.now(),
                  });
                }
              });
            }

            set({
              teachers: teachersList,
              isLoading: false,
            });
            return teachersList;
          } catch (err) {
            set({
              isLoading: false,
              error:
                err.response?.data?.message || "Failed to fetch teachers",
            });
            return get().teachers || [];
          } finally {
            pendingRequests.teachers = null;
          }
        })();

        return pendingRequests.teachers;
      },

      getUserById: async (id, force = false) => {
        if (!id) return null;
        const key = String(id);

        const cached = userCache.userDetails.get(key);
        if (!force && cached && isCacheValid(cached.timestamp)) {
          return cached.data;
        }

        const existingRequest = pendingRequests.userDetails.get(key);
        if (existingRequest) {
          return existingRequest;
        }

        set({ isLoading: true, error: null });

        const request = (async () => {
          try {
            const response = await api.get(`/user/details/${id}`);
            const userData =
              response.data?.data || response.data?.user || response.data;

            if (userData) {
              userCache.userDetails.set(key, {
                data: userData,
                timestamp: Date.now(),
              });
            }

            set({ isLoading: false });
            return userData;
          } catch (err) {
            const errorMessage =
              err.response?.data?.message || "Error fetching user details";
            set({ isLoading: false, error: errorMessage });
            setTimeout(() => set({ error: null }), 4000);
            throw err;
          } finally {
            pendingRequests.userDetails.delete(key);
          }
        })();

        pendingRequests.userDetails.set(key, request);
        return request;
      },

      // Fetch progress data for a specific student from a mainClass
      getStudentProgress: async (studentId, mainClassId) => {
        try {
          const response = await api.get(
            `/attendance/summary/mainclass/${mainClassId}/student/${studentId}`
          );
          const data = response.data?.data || {};

          const key = `${studentId}_${mainClassId}`;
          set((state) => ({
            studentProgress: {
              ...state.studentProgress,
              [key]: {
                batchcompletion: data.batchcompletion || false,
                examcompletion: data.examcompletion || false,
                certificateIssued: data.certificateIssued || false,
              },
            },
          }));

          return data;
        } catch (err) {
          if (err.response?.status === 404) {
            return null;
          }
          console.error("Error fetching student progress:", err);
          return null;
        }
      },

      // Update progress for a student in a mainClass
      updateStudentProgress: async (studentId, mainClassId, progressData) => {
        try {
          const key = `${studentId}_${mainClassId}`;
          set((state) => ({
            studentProgress: {
              ...state.studentProgress,
              [key]: {
                batchcompletion:
                  progressData.batchcompletion !== undefined
                    ? progressData.batchcompletion
                    : state.studentProgress[key]?.batchcompletion || false,
                examcompletion:
                  progressData.examcompletion !== undefined
                    ? progressData.examcompletion
                    : state.studentProgress[key]?.examcompletion || false,
                certificateIssued:
                  progressData.certificateIssued !== undefined
                    ? progressData.certificateIssued
                    : state.studentProgress[key]?.certificateIssued || false,
              },
            },
          }));

          try {
            const response = await api.patch(
              `/attendance/update-progress/${studentId}/${mainClassId}`,
              progressData
            );
            return response.data;
          } catch (apiErr) {
            console.warn(
              "Backend sync failed, but UI updated locally:",
              apiErr
            );
            return null;
          }
        } catch (err) {
          console.error("Error updating student progress:", err);
          set({
            error: err.response?.data?.message || "Error updating progress",
          });
          return null;
        }
      },

      addUser: async (formData) => {
        set({ isLoading: true, error: null, success: false });
        try {
          const response = await api.post("/user/add", formData);
          userCache.students.timestamp = 0;
          userCache.teachers.timestamp = 0;
          set({ isLoading: false, success: true });
          return response.data;
        } catch (err) {
          set({
            isLoading: false,
            error: err.response?.data?.message || "Something went wrong",
          });
          throw err;
        }
      },

      updateUser: async (userId, formData) => {
        set({ isLoading: true, error: null, success: false });

        try {
          const response = await api.patch(`/user/edit/${userId}`, formData);
          const updatedUser = response.data?.user || response.data;

          set((state) => {
            const nextStudents =
              state.students?.map((s) =>
                String(s._id) === String(userId) ? { ...s, ...updatedUser } : s
              ) || [];
            const nextTeachers =
              state.teachers?.map((t) =>
                String(t._id) === String(userId) ? { ...t, ...updatedUser } : t
              ) || [];

            userCache.students = {
              data: nextStudents,
              timestamp: Date.now(),
            };
            userCache.teachers = {
              data: nextTeachers,
              timestamp: Date.now(),
            };
            userCache.userDetails.set(String(userId), {
              data: updatedUser,
              timestamp: Date.now(),
            });

            return {
              students: nextStudents,
              teachers: nextTeachers,
              isLoading: false,
              success: true,
            };
          });

          setTimeout(() => set({ success: false }), 3000);
          return response.data;
        } catch (err) {
          const errorMessage =
            err.response?.data?.message ||
            "Something went wrong while updating the profile";

          set({ isLoading: false, error: errorMessage });
          setTimeout(() => set({ error: null }), 4000);
          throw err;
        }
      },

      deleteUser: async (userId) => {
        set({ isLoading: true, error: null, success: false });
        try {
          const response = await api.delete(`/user/delete/${userId}`);

          set((state) => {
            const nextStudents = state.students.filter(
              (s) => String(s._id) !== String(userId)
            );
            const nextTeachers = state.teachers.filter(
              (t) => String(t._id) !== String(userId)
            );

            userCache.students = {
              data: nextStudents,
              timestamp: Date.now(),
            };
            userCache.teachers = {
              data: nextTeachers,
              timestamp: Date.now(),
            };
            userCache.userDetails.delete(String(userId));

            return {
              isLoading: false,
              success: true,
              students: nextStudents,
              teachers: nextTeachers,
            };
          });
          setTimeout(() => set({ success: false }), 3000);

          return response.data;
        } catch (err) {
          const errorMessage =
            err.response?.data?.message ||
            "Something went wrong while deleting the user";

          set({ isLoading: false, error: errorMessage });
          setTimeout(() => set({ error: null }), 4000);
          throw err;
        }
      },

      resetStatus: () => set({ success: false, error: null }),
    }),
    {
      name: "user-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        studentProgress: state.studentProgress,
      }),
    }
  )
);

export default useUserStore;