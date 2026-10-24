// import React, {
//   useState,
//   useEffect,
//   useRef,
//   useMemo,
//   useCallback,
// } from "react";
// import { useLocation, useNavigate } from "react-router-dom";
// import {
//   ArrowLeft,
//   Calendar,
//   IndianRupee,
//   Users,
//   Clock,
//   Mail,
//   Phone,
//   CheckCircle2,
//   Circle,
//   GraduationCap,
//   Loader2,
//   Search,
//   MoreVertical,
//   Trash2,
//   AlertTriangle,
//   X,
//   Edit,
//   Save,
//   ChevronDown,
//   ChevronLeft,
//   ChevronRight,
//   Briefcase,
//   UserPlus,
//   BookOpen,
//   AlertCircle,
//   RefreshCw,
//   Award,
//   Check,
// } from "lucide-react";
// import useClassStore from "../../stores/useClassStore";
// import useUserStore from "../../stores/useUserStore";
// import { motion, AnimatePresence } from "framer-motion";
// import toast from "react-hot-toast";
// import { generateSlug } from "../../util/generateSlug";
// import useTradeStore from "../../stores/useTradeStore";
// import { TRADES, getTradeLabel } from "../../constants/trades";
// import { Helmet } from "react-helmet-async";
// import { getStudentId } from "../../util/getStudentId";

// // --- Module-Level Cache & Request Deduplication ---
// const COURSE_CACHE_TTL = 60 * 1000; // 1 minute TTL
// const REFERENCE_CACHE_TTL = 60 * 1000;

// const courseDetailsCache = new Map();
// const pendingCourseRequests = new Map();
// let lastTeachersFetchTime = 0;
// let lastStudentsFetchTime = 0;

// const isCacheValid = (timestamp) =>
//   Boolean(timestamp && Date.now() - timestamp < COURSE_CACHE_TTL);

// const formatDate = (dateString) => {
//   if (!dateString) return "N/A";
//   return new Date(dateString).toLocaleDateString("en-GB", {
//     day: "numeric",
//     month: "short",
//     year: "numeric",
//   });
// };

// // --- Memoized Skeleton Loader ---
// const CourseDetailsSkeleton = React.memo(({ courseName }) => (
//   <div className="min-h-screen bg-background p-6 md:p-8">
//     <div className="max-w-7xl mx-auto space-y-8">
//       <div className="flex items-center justify-between gap-4 flex-wrap">
//         <div className="flex items-center gap-4">
//           <div className="w-11 h-11 rounded-xl bg-muted animate-pulse" />
//           <div className="space-y-2">
//             <div className="h-4 w-48 bg-muted animate-pulse rounded" />
//             <div className="h-3 w-32 bg-muted animate-pulse rounded" />
//           </div>
//         </div>
//         <div className="flex gap-3">
//           <div className="w-24 h-10 rounded-xl bg-muted animate-pulse" />
//           <div className="w-32 h-10 rounded-xl bg-muted animate-pulse" />
//           <div className="w-32 h-10 rounded-xl bg-muted animate-pulse" />
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="bg-card p-6 rounded-3xl border border-border lg:col-span-2 space-y-6">
//           <div className="h-8 w-2/3 bg-muted animate-pulse rounded-xl" />
//           <div className="h-6 w-36 bg-muted animate-pulse rounded-lg" />
//           <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//             {[1, 2, 3, 4].map((i) => (
//               <div
//                 key={i}
//                 className="h-20 bg-muted animate-pulse rounded-2xl"
//               />
//             ))}
//           </div>
//           <div className="h-24 bg-muted animate-pulse rounded-2xl" />
//         </div>
//         <div className="bg-card p-6 rounded-3xl border border-border space-y-4">
//           <div className="h-6 w-40 bg-muted animate-pulse rounded-lg" />
//           <div className="h-24 bg-muted animate-pulse rounded-2xl" />
//           <div className="h-32 bg-muted animate-pulse rounded-2xl" />
//         </div>
//       </div>

//       <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
//         <div className="flex justify-between items-center">
//           <div className="h-7 w-56 bg-muted animate-pulse rounded-lg" />
//           <div className="h-10 w-64 bg-muted animate-pulse rounded-xl" />
//         </div>
//         {[1, 2, 3, 4, 5].map((i) => (
//           <div key={i} className="h-14 bg-muted/60 animate-pulse rounded-xl" />
//         ))}
//         <p className="text-center text-xs text-muted-foreground pt-2">
//           Loading {courseName}...
//         </p>
//       </div>
//     </div>
//   </div>
// ));
// CourseDetailsSkeleton.displayName = "CourseDetailsSkeleton";

// // --- Memoized Status Toggle Button ---
// const ToggleButton = React.memo(
//   ({ recordId, fieldName, status, isUpdating, onToggle }) => (
//     <button
//       type="button"
//       onClick={() => onToggle(recordId, fieldName, status)}
//       disabled={isUpdating}
//       className={`p-2 rounded-xl transition-all disabled:opacity-50 group flex items-center justify-center mx-auto ${
//         status
//           ? "bg-success/10 hover:bg-success/20 text-success"
//           : "hover:bg-muted text-muted-foreground/40 hover:text-muted-foreground"
//       }`}
//       title={`Toggle ${fieldName}`}
//     >
//       {isUpdating ? (
//         <Loader2 className="w-5 h-5 animate-spin text-primary" />
//       ) : status ? (
//         <CheckCircle2 className="w-5 h-5 transition-transform group-hover:scale-105" />
//       ) : (
//         <Circle className="w-5 h-5 transition-transform group-hover:scale-105" />
//       )}
//     </button>
//   )
// );
// ToggleButton.displayName = "ToggleButton";

// // --- Memoized Student Progress Table Row ---
// const StudentProgressRow = React.memo(
//   ({
//     record,
//     loadingKeys,
//     activeDropdown,
//     onToggleStatus,
//     onToggleDropdown,
//     onPromptRemove,
//   }) => {
//     const recordId = record?._id;
//     const isDropdownOpen = activeDropdown === recordId;
//     const studentName = record?.student?.name || "Unknown Student";
//     const studentInitials = (
//       studentName.charAt(0) ||
//       record?.student?.email?.charAt(0) ||
//       "S"
//     ).toUpperCase();

//     return (
//       <tr className="hover:bg-muted/30 transition-colors group">
//         <td className="px-6 py-4">
//           <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
//             {getStudentId(record)}
//           </span>
//         </td>

//         <td className="px-6 py-4">
//           <div className="flex items-center gap-3">
//             <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/15 overflow-hidden">
//               {record?.student?.profilePic ||
//               record?.student?.profilePicture ? (
//                 <img
//                   src={
//                     record.student.profilePic || record.student.profilePicture
//                   }
//                   alt={studentName}
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 studentInitials
//               )}
//             </div>
//             <div className="min-w-0">
//               <p className="font-bold text-foreground truncate">
//                 {studentName}
//               </p>
//               <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground text-xs mt-0.5">
//                 <span className="inline-flex items-center gap-1">
//                   <Mail className="w-3 h-3 opacity-70" />
//                   {record?.student?.email || "No Email"}
//                 </span>
//                 {record?.student?.phone && (
//                   <span className="inline-flex items-center gap-1">
//                     <Phone className="w-3 h-3 opacity-70" />
//                     {record.student.phone}
//                   </span>
//                 )}
//               </div>
//             </div>
//           </div>
//         </td>

//         <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
//           {formatDate(record?.joinDate)}
//         </td>

//         <td className="px-6 py-4 align-middle text-center">
//           <ToggleButton
//             recordId={recordId}
//             fieldName="batchcompletion"
//             status={Boolean(record?.batchcompletion)}
//             isUpdating={Boolean(loadingKeys[`${recordId}-batchcompletion`])}
//             onToggle={onToggleStatus}
//           />
//         </td>

//         <td className="px-6 py-4 align-middle text-center">
//           <ToggleButton
//             recordId={recordId}
//             fieldName="examcompletion"
//             status={Boolean(record?.examcompletion)}
//             isUpdating={Boolean(loadingKeys[`${recordId}-examcompletion`])}
//             onToggle={onToggleStatus}
//           />
//         </td>

//         <td className="px-6 py-4 align-middle text-center">
//           <ToggleButton
//             recordId={recordId}
//             fieldName="certificateIssued"
//             status={Boolean(record?.certificateIssued)}
//             isUpdating={Boolean(loadingKeys[`${recordId}-certificateIssued`])}
//             onToggle={onToggleStatus}
//           />
//         </td>

//         <td className="px-6 py-4 align-middle text-center relative">
//           {isDropdownOpen && (
//             <div
//               className="fixed inset-0 z-10"
//               onClick={() => onToggleDropdown(null)}
//             />
//           )}

//           <button
//             type="button"
//             onClick={() => onToggleDropdown(isDropdownOpen ? null : recordId)}
//             className={`p-2 rounded-xl transition-colors relative z-20 ${
//               isDropdownOpen
//                 ? "bg-primary/10 text-primary"
//                 : "text-muted-foreground hover:bg-muted hover:text-foreground"
//             }`}
//           >
//             <MoreVertical className="w-4 h-4" />
//           </button>

//           <AnimatePresence>
//             {isDropdownOpen && (
//               <motion.div
//                 initial={{ opacity: 0, scale: 0.95, y: -8 }}
//                 animate={{ opacity: 1, scale: 1, y: 0 }}
//                 exit={{ opacity: 0, scale: 0.95, y: -8 }}
//                 transition={{ duration: 0.15 }}
//                 className="absolute right-10 top-11 w-44 bg-card border border-border rounded-2xl shadow-xl z-30 overflow-hidden p-1"
//               >
//                 <button
//                   type="button"
//                   onClick={() => {
//                     onPromptRemove(record);
//                     onToggleDropdown(null);
//                   }}
//                   className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
//                 >
//                   <Trash2 className="w-4 h-4" />
//                   Remove Student
//                 </button>
//               </motion.div>
//             )}
//           </AnimatePresence>
//         </td>
//       </tr>
//     );
//   }
// );
// StudentProgressRow.displayName = "StudentProgressRow";

// // --- Main CourseDetails Component ---
// const CourseDetails = () => {
//   const location = useLocation();
//   const navigate = useNavigate();

//   // Extract data from routing state
//   const courseId = location.state?.courseId;
//   const displayCourseName = location.state?.courseName || "Course Details";

//   // Class Store
//   const getClassById = useClassStore((state) => state.getClassById);
//   const getStudentProgress = useClassStore((state) => state.getStudentProgress);
//   const addStudentInClass = useClassStore((state) => state.addStudentInClass);
//   const removeStudentInClass = useClassStore(
//     (state) => state.removeStudentInClass
//   );
//   const updateClass = useClassStore((state) => state.updateClass);
//   const deleteClass = useClassStore((state) => state.deleteClass);

//   // Trade Store
//   const courseTradeMap = useTradeStore((state) => state.courseTradeMap);
//   const assignTradeToCourse = useTradeStore(
//     (state) => state.assignTradeToCourse
//   );
//   const getTradeFromCourseName = useTradeStore(
//     (state) => state.getTradeFromCourseName
//   );

//   // User Store (Teachers & Students)
//   const getTeachers = useUserStore((state) => state.getTeachers);
//   const rawTeachers = useUserStore((state) => state.teachers);
//   const getStudents = useUserStore((state) => state.getStudents);
//   const rawStudents = useUserStore((state) => state.students);
//   const isStudentsLoading = useUserStore((state) => state.isLoading);

//   const teachers = useMemo(
//     () => (Array.isArray(rawTeachers) ? rawTeachers : rawTeachers?.data || []),
//     [rawTeachers]
//   );

//   const safeStudentsArray = useMemo(
//     () => (Array.isArray(rawStudents) ? rawStudents : rawStudents?.data || []),
//     [rawStudents]
//   );

//   // Hydrate initial state from cache if valid
//   const [courseData, setCourseData] = useState(() => {
//     if (!courseId) return null;
//     const cached = courseDetailsCache.get(String(courseId));
//     return cached && isCacheValid(cached.timestamp) ? cached.data : null;
//   });

//   const [isInitialLoading, setIsInitialLoading] = useState(() => {
//     if (!courseId) return true;
//     const cached = courseDetailsCache.get(String(courseId));
//     return !(cached && isCacheValid(cached.timestamp));
//   });

//   const [isRefreshing, setIsRefreshing] = useState(false);
//   const [localError, setLocalError] = useState(null);
//   const [loadingKeys, setLoadingKeys] = useState({});

//   // Search & Pagination states for Student Progress Table
//   const [studentSearchTerm, setStudentSearchTerm] = useState("");
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(8);

//   const [activeDropdown, setActiveDropdown] = useState(null);
//   const [studentToRemove, setStudentToRemove] = useState(null);
//   const [isRemoving, setIsRemoving] = useState(false);

//   // Edit Course Modal States
//   const [isEditModalOpen, setIsEditModalOpen] = useState(false);
//   const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);
//   const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
//   const teacherDropdownRef = useRef(null);

//   const [editFormData, setEditFormData] = useState({
//     name: "",
//     startDate: "",
//     duration: "",
//     endDate: "",
//     fees: "",
//     teachers: [],
//     isActive: true,
//     tradeId: "",
//   });

//   // Delete Course Modal States
//   const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
//   const [isDeletingCourse, setIsDeletingCourse] = useState(false);

//   // Inline Add New Student Modal States (Integrated from AddNewStudent.jsx)
//   const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
//   const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
//   const [enrollFeedback, setEnrollFeedback] = useState({
//     type: null,
//     message: "",
//   });
//   const [isStudentSelectOpen, setIsStudentSelectOpen] = useState(false);
//   const [enrollSearchTerm, setEnrollSearchTerm] = useState("");
//   const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState(null);
//   const [enrollFormData, setEnrollFormData] = useState({
//     mainClassId: courseId || "",
//     studentEmail: "",
//     admissionDate: new Date().toISOString().split("T")[0],
//   });
//   const studentSelectDropdownRef = useRef(null);

//   // Helper to update both local state and cache
//   const updateCourseStateAndCache = useCallback(
//     (updater) => {
//       setCourseData((prev) => {
//         const nextData =
//           typeof updater === "function" ? updater(prev) : updater;
//         if (courseId && nextData) {
//           courseDetailsCache.set(String(courseId), {
//             data: nextData,
//             timestamp: Date.now(),
//           });
//         }
//         return nextData;
//       });
//     },
//     [courseId]
//   );

//   // Fetch Course Details with Cache & Request Deduplication
//   const loadCourseDetails = useCallback(
//     async (force = false) => {
//       if (!courseId) {
//         navigate("/courses");
//         return null;
//       }

//       const key = String(courseId);
//       const cached = courseDetailsCache.get(key);

//       if (!force && cached && isCacheValid(cached.timestamp)) {
//         setCourseData(cached.data);
//         setIsInitialLoading(false);
//         setLocalError(null);
//         return cached.data;
//       }

//       if (!courseData) {
//         setIsInitialLoading(true);
//       }

//       try {
//         let request = pendingCourseRequests.get(key);
//         if (!request || force) {
//           request = getClassById(courseId);
//           pendingCourseRequests.set(key, request);
//         }

//         const data = await request;
//         if (data) {
//           courseDetailsCache.set(key, {
//             data,
//             timestamp: Date.now(),
//           });
//           setCourseData(data);
//           setLocalError(null);
//         }
//         return data;
//       } catch (err) {
//         if (!courseData) {
//           setLocalError("Failed to load course details. Please try again.");
//         } else {
//           toast.error("Failed to refresh course details.");
//         }
//         return null;
//       } finally {
//         pendingCourseRequests.delete(key);
//         setIsInitialLoading(false);
//       }
//     },
//     [courseId, getClassById, navigate, courseData]
//   );

//   useEffect(() => {
//     loadCourseDetails(false);

//     // Fetch teachers with TTL guard
//     const now = Date.now();
//     if (
//       getTeachers &&
//       (teachers.length === 0 || now - lastTeachersFetchTime > REFERENCE_CACHE_TTL)
//     ) {
//       Promise.resolve(getTeachers()).then(() => {
//         lastTeachersFetchTime = Date.now();
//       });
//     }
//   }, [courseId, loadCourseDetails, getTeachers, teachers.length]);

//   // Close Teacher & Student Dropdowns on outside click
//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         teacherDropdownRef.current &&
//         !teacherDropdownRef.current.contains(event.target)
//       ) {
//         setIsTeacherDropdownOpen(false);
//       }
//       if (
//         studentSelectDropdownRef.current &&
//         !studentSelectDropdownRef.current.contains(event.target)
//       ) {
//         setIsStudentSelectOpen(false);
//       }
//     };
//     document.addEventListener("mousedown", handleClickOutside);
//     return () => document.removeEventListener("mousedown", handleClickOutside);
//   }, []);

//   const handleManualRefresh = useCallback(async () => {
//     if (isRefreshing) return;
//     setIsRefreshing(true);
//     await loadCourseDetails(true);
//     setIsRefreshing(false);
//     toast.success("Course details refreshed");
//   }, [isRefreshing, loadCourseDetails]);

//   const handleBack = useCallback(() => {
//     navigate(-1);
//   }, [navigate]);

//   // --- Edit Course Handlers ---
//   const handleOpenEditModal = useCallback(() => {
//     if (!courseData?.mainClass) return;
//     const { mainClass } = courseData;
//     const initialTeachers =
//       mainClass?.teachers?.map((t) =>
//         typeof t === "object" && t !== null ? t._id : t
//       ) || [];

//     setEditFormData({
//       name: mainClass?.name || "",
//       startDate: mainClass?.startDate
//         ? new Date(mainClass.startDate).toISOString().split("T")[0]
//         : "",
//       duration: mainClass?.duration || "",
//       endDate: mainClass?.endDate
//         ? new Date(mainClass.endDate).toISOString().split("T")[0]
//         : "",
//       fees: mainClass?.fees || "",
//       teachers: initialTeachers,
//       isActive: mainClass?.isActive !== undefined ? mainClass.isActive : true,
//       tradeId:
//         courseTradeMap[mainClass?._id] ||
//         mainClass?.tradeId ||
//         getTradeFromCourseName(mainClass?.name) ||
//         "",
//     });
//     setIsEditModalOpen(true);
//   }, [courseData, courseTradeMap, getTradeFromCourseName]);

//   const handleEditFormChange = useCallback((e) => {
//     const { name, value, type, checked } = e.target;
//     const newValue = type === "checkbox" ? checked : value;

//     setEditFormData((prev) => {
//       const updatedData = { ...prev, [name]: newValue };

//       if (name === "startDate" || name === "duration") {
//         if (updatedData.startDate && updatedData.duration) {
//           const startDateObj = new Date(updatedData.startDate);
//           const durationMonths = parseInt(updatedData.duration, 10);

//           if (
//             !isNaN(durationMonths) &&
//             startDateObj.toString() !== "Invalid Date"
//           ) {
//             startDateObj.setMonth(startDateObj.getMonth() + durationMonths);
//             updatedData.endDate = startDateObj.toISOString().split("T")[0];
//           }
//         }
//       }
//       return updatedData;
//     });
//   }, []);

//   const handleEditSubmit = useCallback(
//     async (e) => {
//       e.preventDefault();
//       if (!courseData?.mainClass) return;
//       setIsUpdatingCourse(true);
//       try {
//         const selectedTrade = TRADES.find((t) => t.id === editFormData.tradeId);
//         let finalName = editFormData.name;
//         if (
//           selectedTrade &&
//           !finalName.toLowerCase().includes(selectedTrade.name.toLowerCase())
//         ) {
//           finalName = `${selectedTrade.name} - ${finalName}`;
//         }

//         const payload = { ...editFormData, name: finalName };
//         await updateClass(courseData.mainClass._id, payload);

//         if (editFormData.tradeId !== undefined) {
//           assignTradeToCourse(courseData.mainClass._id, editFormData.tradeId);
//         }

//         // Enrich teacher objects for display consistency
//         const enrichedTeachers = (editFormData.teachers || []).map((tid) => {
//           const found = teachers.find((t) => String(t._id) === String(tid));
//           return found || { _id: tid, name: "Instructor" };
//         });

//         updateCourseStateAndCache((prevData) => ({
//           ...prevData,
//           mainClass: {
//             ...prevData.mainClass,
//             ...payload,
//             teachers: enrichedTeachers,
//           },
//         }));

//         toast.success("Course details updated successfully!");
//         setIsEditModalOpen(false);
//       } catch (error) {
//         console.error("Failed to update course", error);
//         toast.error(
//           error.response?.data?.message || "Failed to update course details."
//         );
//       } finally {
//         setIsUpdatingCourse(false);
//       }
//     },
//     [
//       courseData,
//       editFormData,
//       updateClass,
//       assignTradeToCourse,
//       teachers,
//       updateCourseStateAndCache,
//     ]
//   );

//   // --- Delete Course Handler ---
//   const handleDeleteCourse = useCallback(async () => {
//     if (!courseData?.mainClass) return;
//     setIsDeletingCourse(true);
//     try {
//       await deleteClass(courseData.mainClass._id);
//       courseDetailsCache.delete(String(courseData.mainClass._id));
//       toast.success("Course deleted successfully!");
//       navigate("/courses", { replace: true });
//     } catch (error) {
//       console.error("Failed to delete course", error);
//       toast.error(error.response?.data?.message || "Failed to delete course.");
//       setIsDeletingCourse(false);
//     }
//   }, [courseData, deleteClass, navigate]);

//   // --- Student Progress Toggle Handler ---
//   const handleStatusToggle = useCallback(
//     async (recordId, fieldName, currentValue) => {
//       const updateKey = `${recordId}-${fieldName}`;
//       setLoadingKeys((prev) => ({ ...prev, [updateKey]: true }));

//       try {
//         await getStudentProgress(recordId, { [fieldName]: !currentValue });
//         updateCourseStateAndCache((prevData) => {
//           const updatedProgress = prevData.studentsProgress.map((record) =>
//             record._id === recordId
//               ? { ...record, [fieldName]: !currentValue }
//               : record
//           );
//           return { ...prevData, studentsProgress: updatedProgress };
//         });
//         toast.success("Status updated successfully!");
//       } catch (error) {
//         console.error("Failed to update status", error);
//         toast.error(error.message || "An error occurred");
//       } finally {
//         setLoadingKeys((prev) => {
//           const newKeys = { ...prev };
//           delete newKeys[updateKey];
//           return newKeys;
//         });
//       }
//     },
//     [getStudentProgress, updateCourseStateAndCache]
//   );

//   // --- Remove Student Handler ---
//   const handleConfirmRemove = useCallback(async () => {
//     if (!studentToRemove || !courseData?.mainClass) return;
//     setIsRemoving(true);

//     try {
//       const targetStudentId =
//         studentToRemove?.student?._id || studentToRemove?.student;

//       await removeStudentInClass({
//         mainClassId: courseData.mainClass._id,
//         studentId: targetStudentId,
//       });

//       updateCourseStateAndCache((prevData) => {
//         const updatedProgress = (prevData.studentsProgress || []).filter(
//           (record) =>
//             String(record?.student?._id || record?.student) !==
//             String(targetStudentId)
//         );

//         const updatedMainClassStudents = (
//           prevData.mainClass?.students || []
//         ).filter((s) => String(s?._id || s) !== String(targetStudentId));

//         return {
//           ...prevData,
//           studentsProgress: updatedProgress,
//           mainClass: {
//             ...prevData.mainClass,
//             students: updatedMainClassStudents,
//           },
//         };
//       });

//       toast.success("Student removed successfully!");
//       setStudentToRemove(null);
//     } catch (err) {
//       console.error("Failed to remove student", err);
//       toast.error(err.response?.data?.message || "Failed to remove student.");
//     } finally {
//       setIsRemoving(false);
//     }
//   }, [studentToRemove, courseData, removeStudentInClass, updateCourseStateAndCache]);

//   // --- Inline Add Student Modal Handlers (Integrated from AddNewStudent.jsx) ---
//   const handleOpenAddStudentModal = useCallback(() => {
//     const activeCourseId = courseData?.mainClass?._id || courseId || "";
//     setEnrollFormData({
//       mainClassId: activeCourseId,
//       studentEmail: "",
//       admissionDate: new Date().toISOString().split("T")[0],
//     });
//     setSelectedStudentToEnroll(null);
//     setEnrollSearchTerm("");
//     setEnrollFeedback({ type: null, message: "" });
//     setIsStudentSelectOpen(false);
//     setIsAddStudentModalOpen(true);

//     // Fetch students directory only if not cached recently
//     const now = Date.now();
//     if (
//       getStudents &&
//       (safeStudentsArray.length === 0 ||
//         now - lastStudentsFetchTime > REFERENCE_CACHE_TTL)
//     ) {
//       Promise.resolve(getStudents()).then(() => {
//         lastStudentsFetchTime = Date.now();
//       });
//     }
//   }, [courseData, courseId, getStudents, safeStudentsArray.length]);

//   const handleEnrollStudentSelect = useCallback((student) => {
//     setSelectedStudentToEnroll(student);
//     setEnrollFormData((prev) => ({ ...prev, studentEmail: student.email }));
//     setIsStudentSelectOpen(false);
//     setEnrollSearchTerm("");
//     setEnrollFeedback((prev) =>
//       prev.type === "error" ? { type: null, message: "" } : prev
//     );
//   }, []);

//   const handleEnrollFormChange = useCallback((e) => {
//     const { name, value } = e.target;
//     setEnrollFormData((prev) => ({ ...prev, [name]: value }));
//     setEnrollFeedback((prev) =>
//       prev.type === "error" ? { type: null, message: "" } : prev
//     );
//   }, []);

//   const handleAddStudentSubmit = useCallback(
//     async (e) => {
//       e.preventDefault();

//       const targetMainClassId =
//         enrollFormData.mainClassId || courseData?.mainClass?._id || courseId;

//       if (
//         !targetMainClassId ||
//         !enrollFormData.studentEmail ||
//         !enrollFormData.admissionDate
//       ) {
//         setEnrollFeedback({
//           type: "error",
//           message: "Please select an eligible student and admission date.",
//         });
//         return;
//       }

//       setIsSubmittingStudent(true);
//       setEnrollFeedback({ type: null, message: "" });

//       try {
//         await addStudentInClass({
//           mainClassId: targetMainClassId,
//           studentEmail: enrollFormData.studentEmail,
//           admissionDate: enrollFormData.admissionDate,
//         });

//         toast.success("Student successfully enrolled in the course!");

//         // Refresh course details in the background so the new student's generated progress record & rollno appear immediately
//         await loadCourseDetails(true);

//         setEnrollFormData((prev) => ({ ...prev, studentEmail: "" }));
//         setSelectedStudentToEnroll(null);
//         setIsAddStudentModalOpen(false);
//       } catch (err) {
//         const msg =
//           err.response?.data?.message ||
//           "Failed to add student. Please try again.";
//         setEnrollFeedback({
//           type: "error",
//           message: msg,
//         });
//         toast.error(msg);
//       } finally {
//         setIsSubmittingStudent(false);
//       }
//     },
//     [enrollFormData, courseData, courseId, addStudentInClass, loadCourseDetails]
//   );

//   // --- Memoized Computations for Students & Pagination ---
//   const mainClass = courseData?.mainClass;
//   const studentsProgress = courseData?.studentsProgress || [];

//   // Set of already enrolled student IDs and Emails (Prevents duplicate enrollment)
//   const { enrolledIdsSet, enrolledEmailsSet } = useMemo(() => {
//     const ids = new Set();
//     const emails = new Set();

//     (mainClass?.students || []).forEach((s) => {
//       const id = typeof s === "object" ? s?._id : s;
//       if (id) ids.add(String(id));
//       if (s?.email) emails.add(s.email.toLowerCase());
//     });

//     studentsProgress.forEach((record) => {
//       if (record?.student?._id) ids.add(String(record.student._id));
//       if (record?.student?.email)
//         emails.add(record.student.email.toLowerCase());
//     });

//     return { enrolledIdsSet: ids, enrolledEmailsSet: emails };
//   }, [mainClass?.students, studentsProgress]);

//   // Available (non-enrolled) students for the Add Student Modal
//   const availableStudentsForEnrollment = useMemo(() => {
//     return safeStudentsArray.filter((student) => {
//       if (!student) return false;
//       if (student._id && enrolledIdsSet.has(String(student._id))) return false;
//       if (
//         student.email &&
//         enrolledEmailsSet.has(student.email.toLowerCase())
//       ) {
//         return false;
//       }
//       return true;
//     });
//   }, [safeStudentsArray, enrolledIdsSet, enrolledEmailsSet]);

//   const filteredEnrollableStudents = useMemo(() => {
//     const q = (enrollSearchTerm || "").trim().toLowerCase();
//     if (!q) return availableStudentsForEnrollment;
//     return availableStudentsForEnrollment.filter((student) => {
//       const name = (student?.name || "").toLowerCase();
//       const email = (student?.email || "").toLowerCase();
//       return name.includes(q) || email.includes(q);
//     });
//   }, [availableStudentsForEnrollment, enrollSearchTerm]);

//   // Filtered students for the Progress Tracker table
//   const filteredStudents = useMemo(() => {
//     const searchLower = studentSearchTerm.trim().toLowerCase();
//     if (!searchLower) return studentsProgress;

//     return studentsProgress.filter((record) => {
//       const nameMatch = record?.student?.name
//         ?.toLowerCase()
//         .includes(searchLower);
//       const emailMatch = record?.student?.email
//         ?.toLowerCase()
//         .includes(searchLower);
//       const rollMatch = getStudentId(record)
//         ?.toString()
//         .toLowerCase()
//         .includes(searchLower);
//       return nameMatch || emailMatch || rollMatch;
//     });
//   }, [studentsProgress, studentSearchTerm]);

//   // Pagination calculations
//   const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [studentSearchTerm, pageSize]);

//   useEffect(() => {
//     if (currentPage > totalPages) {
//       setCurrentPage(totalPages);
//     }
//   }, [currentPage, totalPages]);

//   const paginatedStudents = useMemo(() => {
//     const start = (currentPage - 1) * pageSize;
//     return filteredStudents.slice(start, start + pageSize);
//   }, [filteredStudents, currentPage, pageSize]);

//   // Course Progress Summary Metrics
//   const courseMetrics = useMemo(() => {
//     let batchDone = 0;
//     let examDone = 0;
//     let certIssued = 0;
//     studentsProgress.forEach((r) => {
//       if (r?.batchcompletion) batchDone++;
//       if (r?.examcompletion) examDone++;
//       if (r?.certificateIssued) certIssued++;
//     });
//     return { batchDone, examDone, certIssued };
//   }, [studentsProgress]);

//   const resolvedTradeLabel = useMemo(
//     () =>
//       getTradeLabel(
//         courseTradeMap[mainClass?._id] ||
//           mainClass?.tradeId ||
//           getTradeFromCourseName(mainClass?.name)
//       ),
//     [courseTradeMap, mainClass?._id, mainClass?.tradeId, mainClass?.name, getTradeFromCourseName]
//   );

//   if (isInitialLoading || (!courseData && !localError)) {
//     return <CourseDetailsSkeleton courseName={displayCourseName} />;
//   }

//   if (localError) {
//     return (
//       <div className="p-8 min-h-[60vh] flex items-center justify-center">
//         <div className="bg-destructive/10 border border-destructive/20 text-destructive p-8 rounded-3xl max-w-lg w-full text-center space-y-4">
//           <AlertTriangle className="w-10 h-10 mx-auto" />
//           <p className="font-bold text-lg">{localError}</p>
//           <div className="flex justify-center gap-3">
//             <button
//               type="button"
//               onClick={handleBack}
//               className="px-5 py-2.5 bg-card text-foreground border border-border rounded-xl hover:bg-muted transition font-semibold text-sm"
//             >
//               Go Back
//             </button>
//             <button
//               type="button"
//               onClick={() => loadCourseDetails(true)}
//               className="px-5 py-2.5 bg-destructive text-destructive-foreground rounded-xl hover:opacity-90 transition font-semibold text-sm"
//             >
//               Try Again
//             </button>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   const startIndex = (currentPage - 1) * pageSize + 1;
//   const endIndex = Math.min(currentPage * pageSize, filteredStudents.length);

//   return (
//     <>
//       <Helmet>
//         <title>{`IOK - Course | ${mainClass?.name || displayCourseName}`}</title>
//       </Helmet>

//       <motion.div
//         initial={{ opacity: 0, y: 12 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.25 }}
//         className="min-h-screen bg-background p-4 sm:p-6 md:p-8 transition-colors duration-300"
//       >
//         <div className="max-w-7xl mx-auto space-y-8">
//           {/* Top Bar */}
//           <div className="flex items-center justify-between gap-4 flex-wrap">
//             <div className="flex items-center gap-3.5">
//               <button
//                 type="button"
//                 onClick={handleBack}
//                 className="p-2.5 bg-card border border-border rounded-xl hover:bg-muted hover:text-primary transition-colors shadow-sm"
//                 title="Go Back"
//               >
//                 <ArrowLeft className="w-5 h-5 text-foreground" />
//               </button>
//               <div>
//                 <div className="flex items-center gap-2">
//                   <span
//                     className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
//                       mainClass?.isActive
//                         ? "bg-success/10 text-success border border-success/20"
//                         : "bg-destructive/10 text-destructive border border-destructive/20"
//                     }`}
//                   >
//                     <span
//                       className={`w-1.5 h-1.5 rounded-full ${
//                         mainClass?.isActive ? "bg-success" : "bg-destructive"
//                       }`}
//                     />
//                     {mainClass?.isActive ? "Active Course" : "Inactive Course"}
//                   </span>
//                   <span className="text-xs text-muted-foreground">
//                     • Created {formatDate(mainClass?.createdAt)}
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex items-center gap-2.5 flex-wrap">
//               <button
//                 type="button"
//                 onClick={handleManualRefresh}
//                 disabled={isRefreshing}
//                 className="p-2.5 bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors shadow-sm disabled:opacity-50"
//                 title="Refresh Course Data"
//               >
//                 <RefreshCw
//                   className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
//                 />
//               </button>

//               <button
//                 type="button"
//                 onClick={() => setIsDeleteModalOpen(true)}
//                 className="flex items-center gap-2 px-4 py-2.5 bg-card border border-destructive/30 text-destructive rounded-xl hover:bg-destructive/10 transition-colors shadow-sm text-sm font-semibold"
//               >
//                 <Trash2 className="w-4 h-4" />
//                 Delete
//               </button>

//               <button
//                 type="button"
//                 onClick={handleOpenEditModal}
//                 className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition-colors shadow-sm text-sm font-semibold"
//               >
//                 <Edit className="w-4 h-4" />
//                 Edit Course
//               </button>

//               <button
//                 type="button"
//                 onClick={handleOpenAddStudentModal}
//                 className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-95 transition-all shadow-sm shadow-primary/20 text-sm font-bold"
//               >
//                 <UserPlus className="w-4 h-4" />
//                 Add Student
//               </button>
//             </div>
//           </div>

//           {/* Course Overview Grid */}
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             {/* Course Details Card */}
//             <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm lg:col-span-2 space-y-6">
//               <div>
//                 <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary border border-primary/20 mb-3">
//                   <Briefcase className="w-3.5 h-3.5" />
//                   {resolvedTradeLabel}
//                 </div>
//                 <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground capitalize tracking-tight">
//                   {mainClass?.name || displayCourseName}
//                 </h1>
//               </div>

//               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
//                 <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
//                   <span className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
//                     <Calendar className="w-3.5 h-3.5 text-primary" /> Start Date
//                   </span>
//                   <p className="font-bold text-foreground text-sm sm:text-base">
//                     {formatDate(mainClass?.startDate)}
//                   </p>
//                 </div>

//                 <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
//                   <span className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
//                     <Calendar className="w-3.5 h-3.5 text-primary" /> End Date
//                   </span>
//                   <p className="font-bold text-foreground text-sm sm:text-base">
//                     {formatDate(mainClass?.endDate)}
//                   </p>
//                 </div>

//                 <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
//                   <span className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
//                     <Clock className="w-3.5 h-3.5 text-primary" /> Duration
//                   </span>
//                   <p className="font-bold text-foreground text-sm sm:text-base">
//                     {mainClass?.duration || 0} Months
//                   </p>
//                 </div>

//                 <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
//                   <span className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
//                     <IndianRupee className="w-3.5 h-3.5 text-primary" /> Course Fee
//                   </span>
//                   <p className="font-bold text-primary text-sm sm:text-base">
//                     ₹{mainClass?.fees || 0}
//                   </p>
//                 </div>
//               </div>

//               <div className="pt-5 border-t border-border">
//                 <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
//                   Assigned Instructors
//                 </h3>
//                 {mainClass?.teachers && mainClass.teachers.length > 0 ? (
//                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
//                     {mainClass.teachers.map((teacher, idx) => (
//                       <div
//                         key={teacher._id || idx}
//                         className="flex items-center gap-3.5 bg-muted/30 p-3.5 rounded-2xl border border-border"
//                       >
//                         <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 border border-primary/15">
//                           {(teacher.name?.charAt(0) || "T").toUpperCase()}
//                         </div>
//                         <div className="min-w-0">
//                           <p className="font-bold text-sm text-foreground truncate">
//                             {teacher.name || "Unknown Instructor"}
//                           </p>
//                           <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
//                             <Mail className="w-3 h-3 shrink-0" />
//                             {teacher.email || "No Email Provided"}
//                           </p>
//                         </div>
//                       </div>
//                     ))}
//                   </div>
//                 ) : (
//                   <div className="bg-muted/20 p-4 rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
//                     No instructors assigned to this course yet.
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Batches & Capacity Card */}
//             <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm flex flex-col justify-between space-y-6">
//               <div className="space-y-6">
//                 <h2 className="text-lg font-bold text-foreground border-b border-border pb-3">
//                   Batches & Enrollment
//                 </h2>

//                 <div className="flex items-center justify-between bg-primary/10 border border-primary/20 text-primary p-4 rounded-2xl">
//                   <div className="flex items-center gap-3.5">
//                     <div className="w-11 h-11 rounded-xl bg-card flex items-center justify-center shadow-sm border border-primary/10">
//                       <Users className="w-6 h-6 text-primary" />
//                     </div>
//                     <div>
//                       <p className="text-2xl font-extrabold leading-none">
//                         {studentsProgress.length ||
//                           mainClass?.students?.length ||
//                           0}
//                       </p>
//                       <p className="text-xs font-semibold opacity-80 mt-1">
//                         Students Enrolled
//                       </p>
//                     </div>
//                   </div>

//                   <button
//                     type="button"
//                     onClick={handleOpenAddStudentModal}
//                     className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm"
//                   >
//                     <UserPlus className="w-3.5 h-3.5" />
//                     Enroll
//                   </button>
//                 </div>

//                 <div>
//                   <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
//                     Linked Batches ({mainClass?.batches?.length || 0})
//                   </h3>
//                   <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
//                     {mainClass?.batches?.map((batch) => (
//                       <div
//                         key={batch?._id}
//                         onClick={() =>
//                           navigate(`/batches/${generateSlug(batch?.name)}`, {
//                             state: {
//                               batchId: batch._id,
//                               batchName: batch.name,
//                             },
//                           })
//                         }
//                         className="px-3.5 py-2.5 text-sm bg-muted/30 border border-border rounded-xl text-foreground font-semibold flex items-center justify-between cursor-pointer hover:border-primary/50 hover:bg-muted/60 transition-all"
//                       >
//                         <div className="flex items-center gap-2.5 truncate">
//                           <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
//                           <span className="truncate">{batch?.name}</span>
//                         </div>
//                         <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
//                       </div>
//                     ))}
//                     {(!mainClass?.batches ||
//                       mainClass.batches.length === 0) && (
//                       <p className="text-xs text-muted-foreground italic p-3 rounded-xl bg-muted/20 border border-dashed border-border text-center">
//                         No batches assigned yet.
//                       </p>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               {/* Mini Completion Summary */}
//               <div className="pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
//                 <div className="p-2.5 rounded-xl bg-muted/30">
//                   <p className="text-base font-extrabold text-foreground">
//                     {courseMetrics.batchDone}
//                   </p>
//                   <p className="text-[11px] text-muted-foreground font-medium">
//                     Batch Done
//                   </p>
//                 </div>
//                 <div className="p-2.5 rounded-xl bg-muted/30">
//                   <p className="text-base font-extrabold text-foreground">
//                     {courseMetrics.examDone}
//                   </p>
//                   <p className="text-[11px] text-muted-foreground font-medium">
//                     Exam Cleared
//                   </p>
//                 </div>
//                 <div className="p-2.5 rounded-xl bg-muted/30">
//                   <p className="text-base font-extrabold text-success">
//                     {courseMetrics.certIssued}
//                   </p>
//                   <p className="text-[11px] text-muted-foreground font-medium">
//                     Certified
//                   </p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Student Progress Tracker Table */}
//           <div className="bg-card rounded-3xl border border-border shadow-sm overflow-visible">
//             <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//               <div>
//                 <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5">
//                   <GraduationCap className="w-6 h-6 text-primary" />
//                   Student Progress Tracker
//                   <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
//                     {filteredStudents.length}
//                   </span>
//                 </h2>
//                 <p className="text-xs text-muted-foreground mt-0.5">
//                   Click any status icon to toggle batch completion, exam
//                   clearance, or certificate issuance.
//                 </p>
//               </div>

//               <div className="flex items-center gap-3 w-full sm:w-auto">
//                 {studentsProgress.length > 0 && (
//                   <div className="relative flex-1 sm:w-72">
//                     <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
//                     <input
//                       type="text"
//                       placeholder="Search by name, email, or ID..."
//                       value={studentSearchTerm}
//                       onChange={(e) => setStudentSearchTerm(e.target.value)}
//                       className="block w-full pl-10 pr-9 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
//                     />
//                     {studentSearchTerm && (
//                       <button
//                         type="button"
//                         onClick={() => setStudentSearchTerm("")}
//                         className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
//                       >
//                         <X className="w-4 h-4" />
//                       </button>
//                     )}
//                   </div>
//                 )}
//               </div>
//             </div>

//             <div className="overflow-x-auto min-h-[300px]">
//               <table className="w-full text-left text-sm whitespace-nowrap">
//                 <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
//                   <tr>
//                     <th className="px-6 py-4 font-bold w-24">Student ID</th>
//                     <th className="px-6 py-4 font-bold">Student Info</th>
//                     <th className="px-6 py-4 font-bold">Join Date</th>
//                     <th className="px-6 py-4 font-bold text-center">
//                       Batch Status
//                     </th>
//                     <th className="px-6 py-4 font-bold text-center">
//                       Exam Cleared
//                     </th>
//                     <th className="px-6 py-4 font-bold text-center">
//                       Certificate
//                     </th>
//                     <th className="px-6 py-4 font-bold text-center w-20">
//                       Actions
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody className="divide-y divide-border/50">
//                   {studentsProgress.length === 0 ? (
//                     <tr>
//                       <td
//                         colSpan="7"
//                         className="px-6 py-16 text-center text-muted-foreground"
//                       >
//                         <div className="flex flex-col items-center justify-center gap-3">
//                           <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
//                             <Users className="w-7 h-7 opacity-50" />
//                           </div>
//                           <div>
//                             <p className="font-bold text-foreground text-base">
//                               No students enrolled yet
//                             </p>
//                             <p className="text-xs text-muted-foreground mt-1">
//                               Enroll your first student into this course to
//                               track their progress.
//                             </p>
//                           </div>
//                           <button
//                             type="button"
//                             onClick={handleOpenAddStudentModal}
//                             className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
//                           >
//                             <UserPlus className="w-4 h-4" />
//                             Enroll Student
//                           </button>
//                         </div>
//                       </td>
//                     </tr>
//                   ) : paginatedStudents.length === 0 ? (
//                     <tr>
//                       <td
//                         colSpan="7"
//                         className="px-6 py-12 text-center text-muted-foreground"
//                       >
//                         <p className="font-semibold text-foreground">
//                           No students match "{studentSearchTerm}"
//                         </p>
//                         <button
//                           type="button"
//                           onClick={() => setStudentSearchTerm("")}
//                           className="mt-2 text-xs text-primary font-semibold hover:underline"
//                         >
//                           Clear search filter
//                         </button>
//                       </td>
//                     </tr>
//                   ) : (
//                     paginatedStudents.map((record) => (
//                       <StudentProgressRow
//                         key={record?._id}
//                         record={record}
//                         loadingKeys={loadingKeys}
//                         activeDropdown={activeDropdown}
//                         onToggleStatus={handleStatusToggle}
//                         onToggleDropdown={setActiveDropdown}
//                         onPromptRemove={setStudentToRemove}
//                       />
//                     ))
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             {/* Pagination Footer */}
//             {filteredStudents.length > 0 && (
//               <div className="px-6 py-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-3xl">
//                 <div className="flex items-center gap-3 text-xs text-muted-foreground">
//                   <span>
//                     Showing{" "}
//                     <strong className="text-foreground">
//                       {startIndex}–{endIndex}
//                     </strong>{" "}
//                     of{" "}
//                     <strong className="text-foreground">
//                       {filteredStudents.length}
//                     </strong>{" "}
//                     students
//                   </span>
//                   <select
//                     value={pageSize}
//                     onChange={(e) => setPageSize(Number(e.target.value))}
//                     className="px-2.5 py-1 rounded-lg border border-border bg-background text-foreground font-semibold text-xs outline-none focus:border-primary cursor-pointer"
//                   >
//                     <option value={8}>8 / page</option>
//                     <option value={15}>15 / page</option>
//                     <option value={30}>30 / page</option>
//                   </select>
//                 </div>

//                 {totalPages > 1 && (
//                   <div className="flex items-center gap-2">
//                     <button
//                       type="button"
//                       onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
//                       disabled={currentPage === 1}
//                       className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
//                     >
//                       <ChevronLeft className="w-4 h-4" /> Prev
//                     </button>

//                     <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-muted text-foreground">
//                       Page {currentPage} of {totalPages}
//                     </span>

//                     <button
//                       type="button"
//                       onClick={() =>
//                         setCurrentPage((p) => Math.min(totalPages, p + 1))
//                       }
//                       disabled={currentPage === totalPages}
//                       className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
//                     >
//                       Next <ChevronRight className="w-4 h-4" />
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </motion.div>

//       {/* --- Integrated Add Student Modal (Replaces Separate Route) --- */}
//       <AnimatePresence>
//         {isAddStudentModalOpen && (
//           <div
//             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
//             onClick={() =>
//               !isSubmittingStudent && setIsAddStudentModalOpen(false)
//             }
//           >
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: 15 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: 15 }}
//               onClick={(e) => e.stopPropagation()}
//               className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg overflow-visible relative"
//             >
//               {/* Modal Header */}
//               <div className="p-6 border-b border-border flex items-center justify-between">
//                 <div className="flex items-center gap-3">
//                   <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
//                     <UserPlus className="w-5 h-5" />
//                   </div>
//                   <div>
//                     <h3 className="text-lg font-bold text-foreground">
//                       Enroll Student in Course
//                     </h3>
//                     <p className="text-xs text-muted-foreground">
//                       Assign an existing student to{" "}
//                       <strong className="text-foreground">
//                         {mainClass?.name}
//                       </strong>
//                     </p>
//                   </div>
//                 </div>
//                 <button
//                   type="button"
//                   disabled={isSubmittingStudent}
//                   onClick={() => setIsAddStudentModalOpen(false)}
//                   className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>

//               {/* Modal Body */}
//               <form onSubmit={handleAddStudentSubmit} className="p-6 space-y-5">
//                 {enrollFeedback.message && (
//                   <div
//                     className={`p-3.5 rounded-2xl flex items-start gap-3 border text-xs font-medium ${
//                       enrollFeedback.type === "error"
//                         ? "bg-destructive/10 border-destructive/20 text-destructive"
//                         : "bg-success/10 border-success/20 text-success"
//                     }`}
//                   >
//                     {enrollFeedback.type === "error" ? (
//                       <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
//                     ) : (
//                       <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
//                     )}
//                     <span>{enrollFeedback.message}</span>
//                   </div>
//                 )}

//                 {/* Locked Course Indicator */}
//                 <div className="space-y-1.5">
//                   <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
//                     Target Course
//                   </label>
//                   <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-muted/40 text-foreground">
//                     <BookOpen className="w-4 h-4 text-primary shrink-0" />
//                     <span className="text-sm font-semibold truncate">
//                       {mainClass?.name || displayCourseName}
//                     </span>
//                     <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md shrink-0">
//                       ₹{mainClass?.fees || 0}
//                     </span>
//                   </div>
//                 </div>

//                 {/* Searchable Student Selector */}
//                 <div className="space-y-1.5" ref={studentSelectDropdownRef}>
//                   <div className="flex items-center justify-between">
//                     <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
//                       Select Student <span className="text-destructive">*</span>
//                     </label>
//                     <span className="text-[11px] font-medium text-muted-foreground">
//                       {availableStudentsForEnrollment.length} eligible
//                     </span>
//                   </div>

//                   <div className="relative">
//                     <div
//                       onClick={() =>
//                         !isStudentsLoading &&
//                         setIsStudentSelectOpen((prev) => !prev)
//                       }
//                       className={`flex items-center justify-between w-full px-3.5 py-2.5 bg-background border rounded-xl transition-all shadow-sm ${
//                         isStudentSelectOpen
//                           ? "border-primary ring-2 ring-primary/20"
//                           : "border-border hover:border-primary/50"
//                       } ${
//                         isStudentsLoading
//                           ? "opacity-70 cursor-wait"
//                           : "cursor-pointer"
//                       }`}
//                     >
//                       {selectedStudentToEnroll ? (
//                         <div className="flex items-center gap-3 min-w-0">
//                           <img
//                             src={
//                               selectedStudentToEnroll.profilePic ||
//                               selectedStudentToEnroll.profilePicture ||
//                               `https://ui-avatars.com/api/?name=${encodeURIComponent(
//                                 selectedStudentToEnroll.name || "S"
//                               )}&background=e0e7ff&color=4f46e5`
//                             }
//                             alt={selectedStudentToEnroll.name}
//                             className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
//                           />
//                           <div className="flex flex-col text-left min-w-0">
//                             <span className="text-sm font-bold text-foreground truncate">
//                               {selectedStudentToEnroll.name}
//                             </span>
//                             <span className="text-xs text-muted-foreground truncate">
//                               {selectedStudentToEnroll.email}
//                             </span>
//                           </div>
//                         </div>
//                       ) : (
//                         <div className="flex items-center gap-2.5 text-muted-foreground py-1 text-sm">
//                           {isStudentsLoading ? (
//                             <Loader2 className="w-4 h-4 animate-spin text-primary" />
//                           ) : (
//                             <Users className="w-4 h-4" />
//                           )}
//                           <span>
//                             {isStudentsLoading
//                               ? "Loading students directory..."
//                               : "Search and select a student..."}
//                           </span>
//                         </div>
//                       )}
//                       <ChevronDown
//                         className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${
//                           isStudentSelectOpen ? "rotate-180" : ""
//                         }`}
//                       />
//                     </div>

//                     {/* Dropdown Menu */}
//                     <AnimatePresence>
//                       {isStudentSelectOpen && (
//                         <motion.div
//                           initial={{ opacity: 0, y: -6 }}
//                           animate={{ opacity: 1, y: 0 }}
//                           exit={{ opacity: 0, y: -6 }}
//                           transition={{ duration: 0.15 }}
//                           className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
//                         >
//                           <div className="p-2.5 border-b border-border bg-muted/30">
//                             <div className="relative">
//                               <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
//                               <input
//                                 type="text"
//                                 placeholder="Filter by student name or email..."
//                                 value={enrollSearchTerm}
//                                 onChange={(e) =>
//                                   setEnrollSearchTerm(e.target.value)
//                                 }
//                                 className="w-full pl-9 pr-8 py-2 text-xs bg-background text-foreground border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
//                                 autoFocus
//                               />
//                               {enrollSearchTerm && (
//                                 <button
//                                   type="button"
//                                   onClick={() => setEnrollSearchTerm("")}
//                                   className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
//                                 >
//                                   <X className="w-3.5 h-3.5" />
//                                 </button>
//                               )}
//                             </div>
//                           </div>

//                           <div className="max-h-56 overflow-y-auto divide-y divide-border/40">
//                             {filteredEnrollableStudents.length > 0 ? (
//                               filteredEnrollableStudents.map((student) => {
//                                 const isSelected =
//                                   selectedStudentToEnroll?._id === student._id;
//                                 return (
//                                   <div
//                                     key={student._id}
//                                     onClick={() =>
//                                       handleEnrollStudentSelect(student)
//                                     }
//                                     className={`flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/60 cursor-pointer transition-colors ${
//                                       isSelected ? "bg-primary/10" : ""
//                                     }`}
//                                   >
//                                     <div className="flex items-center gap-3 min-w-0">
//                                       <img
//                                         src={
//                                           student.profilePic ||
//                                           student.profilePicture ||
//                                           `https://ui-avatars.com/api/?name=${encodeURIComponent(
//                                             student.name || "S"
//                                           )}&background=e0e7ff&color=4f46e5`
//                                         }
//                                         alt={student.name}
//                                         className="w-8 h-8 rounded-full object-cover border border-border shrink-0"
//                                       />
//                                       <div className="flex flex-col min-w-0">
//                                         <span className="text-sm font-semibold text-foreground truncate">
//                                           {student.name}
//                                         </span>
//                                         <span className="text-xs text-muted-foreground truncate">
//                                           {student.email}
//                                         </span>
//                                       </div>
//                                     </div>
//                                     {isSelected && (
//                                       <Check className="w-4 h-4 text-primary shrink-0" />
//                                     )}
//                                   </div>
//                                 );
//                               })
//                             ) : (
//                               <div className="p-5 text-center text-xs text-muted-foreground">
//                                 {availableStudentsForEnrollment.length === 0
//                                   ? "All registered students are already enrolled in this course."
//                                   : `No eligible students match "${enrollSearchTerm}".`}
//                               </div>
//                             )}
//                           </div>
//                         </motion.div>
//                       )}
//                     </AnimatePresence>
//                   </div>
//                 </div>

//                 {/* Admission Date */}
//                 <div className="space-y-1.5">
//                   <label
//                     htmlFor="admissionDate"
//                     className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
//                   >
//                     Admission Date <span className="text-destructive">*</span>
//                   </label>
//                   <div className="relative">
//                     <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
//                     <input
//                       type="date"
//                       id="admissionDate"
//                       name="admissionDate"
//                       required
//                       value={enrollFormData.admissionDate}
//                       onChange={handleEnrollFormChange}
//                       className="block w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
//                     />
//                   </div>
//                 </div>

//                 {/* Modal Footer */}
//                 <div className="pt-4 border-t border-border flex justify-end gap-3">
//                   <button
//                     type="button"
//                     disabled={isSubmittingStudent}
//                     onClick={() => setIsAddStudentModalOpen(false)}
//                     className="px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     disabled={
//                       isSubmittingStudent ||
//                       isStudentsLoading ||
//                       !enrollFormData.studentEmail
//                     }
//                     className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm shadow-primary/20 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//                   >
//                     {isSubmittingStudent ? (
//                       <>
//                         <Loader2 className="w-4 h-4 animate-spin" />
//                         Enrolling...
//                       </>
//                     ) : (
//                       <>
//                         <UserPlus className="w-4 h-4" />
//                         Enroll Student
//                       </>
//                     )}
//                   </button>
//                 </div>
//               </form>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* --- Delete Course Modal --- */}
//       <AnimatePresence>
//         {isDeleteModalOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: 20 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: 20 }}
//               className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative"
//             >
//               <button
//                 type="button"
//                 onClick={() => !isDeletingCourse && setIsDeleteModalOpen(false)}
//                 className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
//               >
//                 <X className="w-5 h-5" />
//               </button>

//               <div className="p-6">
//                 <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
//                   <AlertTriangle className="w-6 h-6 text-destructive" />
//                 </div>
//                 <h3 className="text-xl font-bold text-foreground mb-2">
//                   Delete Course?
//                 </h3>
//                 <p className="text-sm text-muted-foreground mb-2">
//                   Are you sure you want to delete{" "}
//                   <strong className="text-foreground">{mainClass?.name}</strong>
//                   ?
//                 </p>
//                 <p className="text-xs text-destructive font-medium leading-relaxed">
//                   This action cannot be undone. All batches and student progress
//                   records linked to this course will be permanently removed.
//                 </p>
//               </div>

//               <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
//                 <button
//                   type="button"
//                   onClick={() => setIsDeleteModalOpen(false)}
//                   disabled={isDeletingCourse}
//                   className="px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleDeleteCourse}
//                   disabled={isDeletingCourse}
//                   className="px-4 py-2 text-sm font-semibold text-destructive-foreground bg-destructive hover:opacity-90 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-destructive/20 disabled:opacity-70"
//                 >
//                   {isDeletingCourse ? (
//                     <>
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                       Deleting...
//                     </>
//                   ) : (
//                     <>
//                       <Trash2 className="w-4 h-4" />
//                       Delete Course
//                     </>
//                   )}
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* --- Remove Student Modal --- */}
//       <AnimatePresence>
//         {studentToRemove && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: 20 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: 20 }}
//               className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative"
//             >
//               <button
//                 type="button"
//                 onClick={() => !isRemoving && setStudentToRemove(null)}
//                 className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
//               >
//                 <X className="w-5 h-5" />
//               </button>

//               <div className="p-6">
//                 <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
//                   <AlertTriangle className="w-6 h-6 text-destructive" />
//                 </div>
//                 <h3 className="text-xl font-bold text-foreground mb-2">
//                   Remove Student?
//                 </h3>
//                 <p className="text-sm text-muted-foreground mb-2">
//                   Are you sure you want to remove{" "}
//                   <strong className="text-foreground">
//                     {studentToRemove?.student?.name || "this student"}
//                   </strong>{" "}
//                   from this course?
//                 </p>
//                 <p className="text-xs text-destructive font-medium">
//                   This action cannot be undone. Progress tracking will be lost.
//                 </p>
//               </div>

//               <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
//                 <button
//                   type="button"
//                   onClick={() => setStudentToRemove(null)}
//                   disabled={isRemoving}
//                   className="px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleConfirmRemove}
//                   disabled={isRemoving}
//                   className="px-4 py-2 text-sm font-semibold text-destructive-foreground bg-destructive hover:opacity-90 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-destructive/20 disabled:opacity-70"
//                 >
//                   {isRemoving ? (
//                     <>
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                       Removing...
//                     </>
//                   ) : (
//                     <>
//                       <Trash2 className="w-4 h-4" />
//                       Remove
//                     </>
//                   )}
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>

//       {/* --- Edit Course Modal --- */}
//       <AnimatePresence>
//         {isEditModalOpen && (
//           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
//             <motion.div
//               initial={{ opacity: 0, scale: 0.95, y: 20 }}
//               animate={{ opacity: 1, scale: 1, y: 0 }}
//               exit={{ opacity: 0, scale: 0.95, y: 20 }}
//               className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
//             >
//               <div className="p-6 border-b border-border flex items-center justify-between">
//                 <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
//                   <Edit className="w-5 h-5 text-primary" />
//                   Edit Course Details
//                 </h3>
//                 <button
//                   type="button"
//                   onClick={() => !isUpdatingCourse && setIsEditModalOpen(false)}
//                   className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
//                 >
//                   <X className="w-5 h-5" />
//                 </button>
//               </div>

//               <div className="p-6 overflow-y-auto flex-1">
//                 <form
//                   id="editCourseForm"
//                   onSubmit={handleEditSubmit}
//                   className="space-y-4"
//                 >
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div className="space-y-1.5 md:col-span-2">
//                       <label className="text-sm font-semibold text-foreground">
//                         Course Name
//                       </label>
//                       <input
//                         type="text"
//                         name="name"
//                         required
//                         value={editFormData.name}
//                         onChange={handleEditFormChange}
//                         className="w-full px-3.5 py-2.5 border border-border bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
//                       />
//                     </div>

//                     <div className="space-y-1.5">
//                       <label className="text-sm font-semibold text-foreground">
//                         Start Date
//                       </label>
//                       <input
//                         type="date"
//                         name="startDate"
//                         required
//                         value={editFormData.startDate}
//                         onChange={handleEditFormChange}
//                         className="w-full px-3.5 py-2.5 border border-border bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
//                       />
//                     </div>

//                     <div className="space-y-1.5">
//                       <label className="text-sm font-semibold text-foreground">
//                         Duration (Months)
//                       </label>
//                       <input
//                         type="number"
//                         name="duration"
//                         required
//                         min="1"
//                         value={editFormData.duration}
//                         onChange={handleEditFormChange}
//                         className="w-full px-3.5 py-2.5 border border-border bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
//                       />
//                     </div>

//                     <div className="space-y-1.5">
//                       <label className="text-sm font-semibold text-foreground flex justify-between items-center">
//                         <span>End Date</span>
//                         <span className="text-xs font-normal text-primary">
//                           Auto-calculated
//                         </span>
//                       </label>
//                       <input
//                         type="date"
//                         name="endDate"
//                         required
//                         readOnly
//                         value={editFormData.endDate}
//                         className="w-full px-3.5 py-2.5 border border-border bg-muted/50 text-muted-foreground rounded-xl cursor-not-allowed focus:outline-none"
//                       />
//                     </div>

//                     <div className="space-y-1.5">
//                       <label className="text-sm font-semibold text-foreground">
//                         Fees (₹)
//                       </label>
//                       <input
//                         type="number"
//                         name="fees"
//                         required
//                         min="0"
//                         value={editFormData.fees}
//                         onChange={handleEditFormChange}
//                         className="w-full px-3.5 py-2.5 border border-border bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
//                       />
//                     </div>

//                     {/* Custom Instructor Dropdown */}
//                     <div
//                       className="space-y-1.5 md:col-span-2 relative"
//                       ref={teacherDropdownRef}
//                     >
//                       <label className="text-sm font-semibold text-foreground">
//                         Assign Instructor(s)
//                       </label>
//                       <div
//                         className="w-full px-3.5 py-2.5 border border-border bg-background text-foreground rounded-xl flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors min-h-[44px]"
//                         onClick={() =>
//                           setIsTeacherDropdownOpen(!isTeacherDropdownOpen)
//                         }
//                       >
//                         {editFormData.teachers?.length > 0 ? (
//                           <div className="flex flex-wrap gap-2">
//                             {editFormData.teachers.map((teacherId) => {
//                               const selectedTeacher = teachers?.find(
//                                 (t) => String(t._id) === String(teacherId)
//                               );
//                               if (!selectedTeacher) return null;
//                               return (
//                                 <div
//                                   key={teacherId}
//                                   className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs font-semibold"
//                                 >
//                                   {selectedTeacher.name}
//                                   <span
//                                     className="cursor-pointer hover:text-destructive transition-colors ml-1"
//                                     onClick={(e) => {
//                                       e.stopPropagation();
//                                       setEditFormData((prev) => ({
//                                         ...prev,
//                                         teachers: prev.teachers.filter(
//                                           (id) =>
//                                             String(id) !== String(teacherId)
//                                         ),
//                                       }));
//                                     }}
//                                   >
//                                     <X className="w-3 h-3" />
//                                   </span>
//                                 </div>
//                               );
//                             })}
//                           </div>
//                         ) : (
//                           <span className="text-muted-foreground text-sm">
//                             Select instructor(s)...
//                           </span>
//                         )}
//                         <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
//                       </div>

//                       <AnimatePresence>
//                         {isTeacherDropdownOpen && (
//                           <motion.div
//                             initial={{ opacity: 0, y: -10 }}
//                             animate={{ opacity: 1, y: 0 }}
//                             exit={{ opacity: 0, y: -10 }}
//                             transition={{ duration: 0.15 }}
//                             className="absolute z-50 top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl max-h-56 overflow-y-auto"
//                           >
//                             {teachers?.length > 0 ? (
//                               teachers.map((teacher) => {
//                                 const isSelected = editFormData.teachers?.some(
//                                   (id) => String(id) === String(teacher._id)
//                                 );
//                                 return (
//                                   <div
//                                     key={teacher._id}
//                                     onClick={(e) => {
//                                       e.stopPropagation();
//                                       setEditFormData((prev) => {
//                                         const newTeachers = isSelected
//                                           ? prev.teachers.filter(
//                                               (id) =>
//                                                 String(id) !==
//                                                 String(teacher._id)
//                                             )
//                                           : [
//                                               ...(prev.teachers || []),
//                                               teacher._id,
//                                             ];
//                                         return {
//                                           ...prev,
//                                           teachers: newTeachers,
//                                         };
//                                       });
//                                     }}
//                                     className={`px-4 py-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3 transition-colors border-b last:border-0 border-border/50 ${
//                                       isSelected ? "bg-primary/5" : ""
//                                     }`}
//                                   >
//                                     <div className="w-8 h-8 rounded-full bg-primary/20 flex shrink-0 items-center justify-center text-sm font-bold text-primary overflow-hidden">
//                                       {teacher?.profilePic ? (
//                                         <img
//                                           src={teacher.profilePic}
//                                           alt={teacher.name}
//                                           className="w-full h-full object-cover"
//                                         />
//                                       ) : (
//                                         teacher.name?.charAt(0).toUpperCase()
//                                       )}
//                                     </div>
//                                     <div className="flex flex-col flex-1 min-w-0">
//                                       <span className="text-sm font-semibold text-foreground truncate">
//                                         {teacher.name}
//                                       </span>
//                                       <span className="text-xs text-muted-foreground truncate">
//                                         {teacher.email}
//                                       </span>
//                                     </div>
//                                     {isSelected && (
//                                       <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
//                                     )}
//                                   </div>
//                                 );
//                               })
//                             ) : (
//                               <div className="px-4 py-6 text-sm text-muted-foreground text-center flex flex-col items-center gap-2">
//                                 <Users className="w-6 h-6 text-muted-foreground/50" />
//                                 No instructors available.
//                               </div>
//                             )}
//                           </motion.div>
//                         )}
//                       </AnimatePresence>
//                     </div>

//                     <div className="md:col-span-2 mt-1">
//                       <label className="flex items-center gap-2.5 cursor-pointer">
//                         <input
//                           type="checkbox"
//                           name="isActive"
//                           checked={editFormData.isActive}
//                           onChange={handleEditFormChange}
//                           className="w-4 h-4 text-primary rounded border-border focus:ring-primary bg-background"
//                         />
//                         <span className="text-sm font-semibold text-foreground">
//                           Course is Active
//                         </span>
//                       </label>
//                     </div>
//                   </div>

//                   <div className="space-y-1.5 md:col-span-2">
//                     <label className="text-sm font-semibold text-foreground">
//                       Trade
//                     </label>
//                     <select
//                       name="tradeId"
//                       value={editFormData.tradeId}
//                       onChange={handleEditFormChange}
//                       className="w-full px-3.5 py-2.5 border border-border bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
//                     >
//                       <option value="">Unassigned</option>
//                       {TRADES.map((trade) => (
//                         <option key={trade.id} value={trade.id}>
//                           {trade.name}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </form>
//               </div>

//               <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3 rounded-b-3xl">
//                 <button
//                   type="button"
//                   onClick={() => setIsEditModalOpen(false)}
//                   disabled={isUpdatingCourse}
//                   className="px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   form="editCourseForm"
//                   disabled={isUpdatingCourse}
//                   className="px-5 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-primary/20 disabled:opacity-70"
//                 >
//                   {isUpdatingCourse ? (
//                     <>
//                       <Loader2 className="w-4 h-4 animate-spin" />
//                       Saving...
//                     </>
//                   ) : (
//                     <>
//                       <Save className="w-4 h-4" />
//                       Save Changes
//                     </>
//                   )}
//                 </button>
//               </div>
//             </motion.div>
//           </div>
//         )}
//       </AnimatePresence>
//     </>
//   );
// };

// export default React.memo(CourseDetails);




import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  IndianRupee,
  Users,
  Clock,
  Mail,
  Phone,
  CheckCircle2,
  Circle,
  GraduationCap,
  Loader2,
  Search,
  MoreVertical,
  Trash2,
  AlertTriangle,
  X,
  Edit,
  Save,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  UserPlus,
  BookOpen,
  AlertCircle,
  RefreshCw,
  Check,
  ArrowUpRight,
} from "lucide-react";
import useClassStore from "../../stores/useClassStore";
import useUserStore from "../../stores/useUserStore";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { generateSlug } from "../../util/generateSlug";
import useTradeStore from "../../stores/useTradeStore";
import { TRADES, getTradeLabel } from "../../constants/trades";
import { Helmet } from "react-helmet-async";
import { getStudentId } from "../../util/getStudentId";

// --- Module-Level Cache & Request Deduplication ---
const COURSE_CACHE_TTL = 60 * 1000; // 1 minute TTL
const courseDetailsCache = new Map();
const pendingCourseRequests = new Map();

const isCacheValid = (timestamp) =>
  Boolean(timestamp && Date.now() - timestamp < COURSE_CACHE_TTL);

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

// Helper to resolve user avatar from multiple possible field names
const resolveAvatarUrl = (...sources) => {
  for (const src of sources) {
    if (!src) continue;
    const candidate =
      src.profilePic ||
      src.profilePicture ||
      src.avatar ||
      src.photo ||
      src.image;
    if (typeof candidate === "string" && candidate.trim() !== "") {
      return candidate.trim();
    }
  }
  return null;
};

// --- Memoized Reusable User Avatar with Graceful Fallback ---
const UserAvatar = React.memo(
  ({ src, name, email, className = "w-10 h-10 rounded-xl text-xs" }) => {
    const [imgError, setImgError] = useState(false);

    useEffect(() => {
      setImgError(false);
    }, [src]);

    const initials = (
      name?.charAt(0) ||
      email?.charAt(0) ||
      "U"
    ).toUpperCase();

    return (
      <div
        className={`${className} bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 border border-primary/20 overflow-hidden shadow-inner`}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={name || "User"}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  }
);
UserAvatar.displayName = "UserAvatar";

// --- Memoized Skeleton Loader ---
const CourseDetailsSkeleton = React.memo(({ courseName }) => (
  <div className="min-h-screen bg-background p-6 md:p-8">
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-muted animate-pulse" />
          <div className="space-y-2">
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="w-24 h-10 rounded-xl bg-muted animate-pulse" />
          <div className="w-32 h-10 rounded-xl bg-muted animate-pulse" />
          <div className="w-32 h-10 rounded-xl bg-muted animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-3xl border border-border lg:col-span-2 space-y-6">
          <div className="h-8 w-2/3 bg-muted animate-pulse rounded-xl" />
          <div className="h-6 w-36 bg-muted animate-pulse rounded-lg" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 bg-muted animate-pulse rounded-2xl"
              />
            ))}
          </div>
          <div className="h-24 bg-muted animate-pulse rounded-2xl" />
        </div>
        <div className="bg-card p-6 rounded-3xl border border-border space-y-4">
          <div className="h-6 w-40 bg-muted animate-pulse rounded-lg" />
          <div className="h-24 bg-muted animate-pulse rounded-2xl" />
          <div className="h-32 bg-muted animate-pulse rounded-2xl" />
        </div>
      </div>

      <div className="bg-card rounded-3xl border border-border p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-7 w-56 bg-muted animate-pulse rounded-lg" />
          <div className="h-10 w-64 bg-muted animate-pulse rounded-xl" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-14 bg-muted/60 animate-pulse rounded-xl" />
        ))}
        <p className="text-center text-xs text-muted-foreground pt-2">
          Loading {courseName}...
        </p>
      </div>
    </div>
  </div>
));
CourseDetailsSkeleton.displayName = "CourseDetailsSkeleton";

// --- Memoized Status Toggle Button ---
const ToggleButton = React.memo(
  ({ recordId, fieldName, status, isUpdating, onToggle }) => (
    <button
      type="button"
      onClick={() => onToggle(recordId, fieldName, status)}
      disabled={isUpdating}
      className={`p-2 rounded-xl transition-all disabled:opacity-50 group flex items-center justify-center mx-auto ${
        status
          ? "bg-success/10 hover:bg-success/20 text-success"
          : "hover:bg-muted text-muted-foreground/40 hover:text-muted-foreground"
      }`}
      title={`Toggle ${fieldName}`}
    >
      {isUpdating ? (
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      ) : status ? (
        <CheckCircle2 className="w-5 h-5 transition-transform group-hover:scale-105" />
      ) : (
        <Circle className="w-5 h-5 transition-transform group-hover:scale-105" />
      )}
    </button>
  )
);
ToggleButton.displayName = "ToggleButton";

// --- Memoized Student Progress Table Row (Uses Cached Student Image & Profile Link) ---
const StudentProgressRow = React.memo(
  ({
    record,
    cachedStudent,
    loadingKeys,
    activeDropdown,
    onToggleStatus,
    onToggleDropdown,
    onPromptRemove,
    onViewProfile,
  }) => {
    const recordId = record?._id;
    const isDropdownOpen = activeDropdown === recordId;

    // Merge record.student with cached student data from useUserStore
    const mergedStudent = useMemo(
      () => ({
        ...(record?.student || {}),
        ...(cachedStudent || {}),
      }),
      [record?.student, cachedStudent]
    );

    const studentName = mergedStudent?.name || "Unknown Student";
    const studentEmail = mergedStudent?.email || "No Email";
    const studentPhone = mergedStudent?.phone;
    const avatarUrl = resolveAvatarUrl(cachedStudent, record?.student);

    return (
      <tr className="hover:bg-muted/30 transition-colors group">
        <td className="px-6 py-4">
          <span className="font-mono text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
            {getStudentId(record)}
          </span>
        </td>

        <td className="px-6 py-4">
          <div
            onClick={() =>
              mergedStudent?._id && onViewProfile(mergedStudent)
            }
            className={`flex items-center gap-3.5 ${
              mergedStudent?._id ? "cursor-pointer group/student" : ""
            }`}
            title={
              mergedStudent?._id ? `View ${studentName}'s Profile` : studentName
            }
          >
            <UserAvatar
              src={avatarUrl}
              name={studentName}
              email={studentEmail}
              className="w-10 h-10 rounded-xl text-xs transition-transform group-hover/student:scale-105 group-hover/student:ring-2 ring-primary/30"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-foreground truncate group-hover/student:text-primary transition-colors">
                  {studentName}
                </p>
                {mergedStudent?._id && (
                  <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover/student:opacity-100 transition-opacity shrink-0" />
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-muted-foreground text-xs mt-0.5">
                <span className="inline-flex items-center gap-1">
                  <Mail className="w-3 h-3 opacity-70" />
                  {studentEmail}
                </span>
                {studentPhone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3 h-3 opacity-70" />
                    {studentPhone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </td>

        <td className="px-6 py-4 text-muted-foreground text-xs font-medium">
          {formatDate(record?.joinDate)}
        </td>

        <td className="px-6 py-4 align-middle text-center">
          <ToggleButton
            recordId={recordId}
            fieldName="batchcompletion"
            status={Boolean(record?.batchcompletion)}
            isUpdating={Boolean(loadingKeys[`${recordId}-batchcompletion`])}
            onToggle={onToggleStatus}
          />
        </td>

        <td className="px-6 py-4 align-middle text-center">
          <ToggleButton
            recordId={recordId}
            fieldName="examcompletion"
            status={Boolean(record?.examcompletion)}
            isUpdating={Boolean(loadingKeys[`${recordId}-examcompletion`])}
            onToggle={onToggleStatus}
          />
        </td>

        <td className="px-6 py-4 align-middle text-center">
          <ToggleButton
            recordId={recordId}
            fieldName="certificateIssued"
            status={Boolean(record?.certificateIssued)}
            isUpdating={Boolean(loadingKeys[`${recordId}-certificateIssued`])}
            onToggle={onToggleStatus}
          />
        </td>

        <td className="px-6 py-4 align-middle text-center relative">
          {isDropdownOpen && (
            <div
              className="fixed inset-0 z-10"
              onClick={() => onToggleDropdown(null)}
            />
          )}

          <button
            type="button"
            onClick={() => onToggleDropdown(isDropdownOpen ? null : recordId)}
            className={`p-2 rounded-xl transition-colors relative z-20 ${
              isDropdownOpen
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute right-10 top-11 w-44 bg-card border border-border rounded-2xl shadow-xl z-30 overflow-hidden p-1"
              >
                <button
                  type="button"
                  onClick={() => {
                    onPromptRemove(record);
                    onToggleDropdown(null);
                  }}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Student
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </td>
      </tr>
    );
  }
);
StudentProgressRow.displayName = "StudentProgressRow";

// --- Memoized Clickable Instructor Card ---
const InstructorCard = React.memo(({ teacher, onViewProfile }) => {
  const avatarUrl = resolveAvatarUrl(teacher);
  const isClickable = Boolean(teacher?._id);

  return (
    <div
      onClick={() => isClickable && onViewProfile(teacher)}
      title={
        isClickable
          ? `View ${teacher.name || "Instructor"}'s Profile`
          : "Instructor Details"
      }
      className={`flex items-center justify-between gap-3.5 bg-muted/30 p-3.5 rounded-2xl border border-border transition-all ${
        isClickable
          ? "cursor-pointer hover:border-primary/50 hover:bg-muted/60 hover:shadow-sm group"
          : ""
      }`}
    >
      <div className="flex items-center gap-3.5 min-w-0">
        <UserAvatar
          src={avatarUrl}
          name={teacher?.name}
          email={teacher?.email}
          className="w-11 h-11 rounded-xl text-sm transition-transform group-hover:scale-105 group-hover:ring-2 ring-primary/30"
        />
        <div className="min-w-0">
          <p className="font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {teacher?.name || "Unknown Instructor"}
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
            <Mail className="w-3 h-3 shrink-0 opacity-75" />
            {teacher?.email || "No Email Provided"}
          </p>
        </div>
      </div>

      {isClickable && (
        <div className="w-8 h-8 rounded-xl bg-background/80 border border-border/60 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:border-primary/30 transition-colors shrink-0">
          <ArrowUpRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
});
InstructorCard.displayName = "InstructorCard";

// --- Main CourseDetails Component ---
const CourseDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract data from routing state
  const courseId = location.state?.courseId;
  const displayCourseName = location.state?.courseName || "Course Details";

  // Class Store
  const getClassById = useClassStore((state) => state.getClassById);
  const getStudentProgress = useClassStore((state) => state.getStudentProgress);
  const addStudentInClass = useClassStore((state) => state.addStudentInClass);
  const removeStudentInClass = useClassStore(
    (state) => state.removeStudentInClass
  );
  const updateClass = useClassStore((state) => state.updateClass);
  const deleteClass = useClassStore((state) => state.deleteClass);

  // Trade Store
  const courseTradeMap = useTradeStore((state) => state.courseTradeMap);
  const assignTradeToCourse = useTradeStore(
    (state) => state.assignTradeToCourse
  );
  const getTradeFromCourseName = useTradeStore(
    (state) => state.getTradeFromCourseName
  );

  // User Store (Teachers & Students Cached Data)
  const getTeachers = useUserStore((state) => state.getTeachers);
  const rawTeachers = useUserStore((state) => state.teachers);
  const getStudents = useUserStore((state) => state.getStudents);
  const rawStudents = useUserStore((state) => state.students);
  const isStudentsLoading = useUserStore((state) => state.isLoading);

  const teachers = useMemo(
    () => (Array.isArray(rawTeachers) ? rawTeachers : rawTeachers?.data || []),
    [rawTeachers]
  );

  const safeStudentsArray = useMemo(
    () => (Array.isArray(rawStudents) ? rawStudents : rawStudents?.data || []),
    [rawStudents]
  );

  // O(1) Lookup Map for Cached Students (by _id and email)
  const studentsCacheMap = useMemo(() => {
    const byId = new Map();
    const byEmail = new Map();
    safeStudentsArray.forEach((student) => {
      if (!student) return;
      if (student._id) byId.set(String(student._id), student);
      if (student.email) byEmail.set(student.email.toLowerCase(), student);
    });
    return { byId, byEmail };
  }, [safeStudentsArray]);

  // O(1) Lookup Map for Cached Teachers (by _id and email)
  const teachersCacheMap = useMemo(() => {
    const byId = new Map();
    const byEmail = new Map();
    teachers.forEach((teacher) => {
      if (!teacher) return;
      if (teacher._id) byId.set(String(teacher._id), teacher);
      if (teacher.email) byEmail.set(teacher.email.toLowerCase(), teacher);
    });
    return { byId, byEmail };
  }, [teachers]);

  // Helper to get cached student profile for any progress record
  const getCachedStudentForRecord = useCallback(
    (record) => {
      const stu = record?.student;
      if (!stu) return null;
      const idKey = typeof stu === "object" ? stu._id || stu.id : stu;
      if (idKey && studentsCacheMap.byId.has(String(idKey))) {
        return studentsCacheMap.byId.get(String(idKey));
      }
      if (
        typeof stu === "object" &&
        stu.email &&
        studentsCacheMap.byEmail.has(stu.email.toLowerCase())
      ) {
        return studentsCacheMap.byEmail.get(stu.email.toLowerCase());
      }
      return null;
    },
    [studentsCacheMap]
  );

  // Hydrate initial course state from cache if valid
  const [courseData, setCourseData] = useState(() => {
    if (!courseId) return null;
    const cached = courseDetailsCache.get(String(courseId));
    return cached && isCacheValid(cached.timestamp) ? cached.data : null;
  });

  const [isInitialLoading, setIsInitialLoading] = useState(() => {
    if (!courseId) return true;
    const cached = courseDetailsCache.get(String(courseId));
    return !(cached && isCacheValid(cached.timestamp));
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [loadingKeys, setLoadingKeys] = useState({});

  // Search & Pagination states for Student Progress Table
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Edit Course Modal States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUpdatingCourse, setIsUpdatingCourse] = useState(false);
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const teacherDropdownRef = useRef(null);

  const [editFormData, setEditFormData] = useState({
    name: "",
    startDate: "",
    duration: "",
    endDate: "",
    fees: "",
    teachers: [],
    isActive: true,
    tradeId: "",
  });

  // Delete Course Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  // Inline Add New Student Modal States
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [isSubmittingStudent, setIsSubmittingStudent] = useState(false);
  const [enrollFeedback, setEnrollFeedback] = useState({
    type: null,
    message: "",
  });
  const [isStudentSelectOpen, setIsStudentSelectOpen] = useState(false);
  const [enrollSearchTerm, setEnrollSearchTerm] = useState("");
  const [selectedStudentToEnroll, setSelectedStudentToEnroll] = useState(null);
  const [enrollFormData, setEnrollFormData] = useState({
    mainClassId: courseId || "",
    studentEmail: "",
    admissionDate: new Date().toISOString().split("T")[0],
  });
  const studentSelectDropdownRef = useRef(null);

  // Helper to update both local state and cache
  const updateCourseStateAndCache = useCallback(
    (updater) => {
      setCourseData((prev) => {
        const nextData =
          typeof updater === "function" ? updater(prev) : updater;
        if (courseId && nextData) {
          courseDetailsCache.set(String(courseId), {
            data: nextData,
            timestamp: Date.now(),
          });
        }
        return nextData;
      });
    },
    [courseId]
  );

  // Fetch Course Details with Cache & Request Deduplication
  const loadCourseDetails = useCallback(
    async (force = false) => {
      if (!courseId) {
        navigate("/courses");
        return null;
      }

      const key = String(courseId);
      const cached = courseDetailsCache.get(key);

      if (!force && cached && isCacheValid(cached.timestamp)) {
        setCourseData(cached.data);
        setIsInitialLoading(false);
        setLocalError(null);
        return cached.data;
      }

      if (!courseData) {
        setIsInitialLoading(true);
      }

      try {
        let request = pendingCourseRequests.get(key);
        if (!request || force) {
          request = getClassById(courseId);
          pendingCourseRequests.set(key, request);
        }

        const data = await request;
        if (data) {
          courseDetailsCache.set(key, {
            data,
            timestamp: Date.now(),
          });
          setCourseData(data);
          setLocalError(null);
        }
        return data;
      } catch (err) {
        if (!courseData) {
          setLocalError("Failed to load course details. Please try again.");
        } else {
          toast.error("Failed to refresh course details.");
        }
        return null;
      } finally {
        pendingCourseRequests.delete(key);
        setIsInitialLoading(false);
      }
    },
    [courseId, getClassById, navigate, courseData]
  );

  // Load Course, Cached Students (for Avatars), and Cached Teachers on Mount
  useEffect(() => {
    loadCourseDetails(false);
    if (getTeachers) getTeachers();
    if (getStudents) getStudents();
  }, [courseId, loadCourseDetails, getTeachers, getStudents]);

  // Close Teacher & Student Dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        teacherDropdownRef.current &&
        !teacherDropdownRef.current.contains(event.target)
      ) {
        setIsTeacherDropdownOpen(false);
      }
      if (
        studentSelectDropdownRef.current &&
        !studentSelectDropdownRef.current.contains(event.target)
      ) {
        setIsStudentSelectOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Navigate to Teacher or Student Profile Page
  const handleViewUserProfile = useCallback(
    (userObj) => {
      if (!userObj || !userObj._id) return;
      navigate(`/profile/${generateSlug(userObj.name || "user")}`, {
        state: {
          userId: userObj._id,
          userData: userObj,
        },
      });
    },
    [navigate]
  );

  const handleManualRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    await Promise.all([
      loadCourseDetails(true),
      getStudents ? getStudents(true) : Promise.resolve(),
      getTeachers ? getTeachers(true) : Promise.resolve(),
    ]);
    setIsRefreshing(false);
    toast.success("Course details refreshed");
  }, [isRefreshing, loadCourseDetails, getStudents, getTeachers]);

  const handleBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  // --- Edit Course Handlers ---
  const handleOpenEditModal = useCallback(() => {
    if (!courseData?.mainClass) return;
    const { mainClass } = courseData;
    const initialTeachers =
      mainClass?.teachers?.map((t) =>
        typeof t === "object" && t !== null ? t._id : t
      ) || [];

    setEditFormData({
      name: mainClass?.name || "",
      startDate: mainClass?.startDate
        ? new Date(mainClass.startDate).toISOString().split("T")[0]
        : "",
      duration: mainClass?.duration || "",
      endDate: mainClass?.endDate
        ? new Date(mainClass.endDate).toISOString().split("T")[0]
        : "",
      fees: mainClass?.fees || "",
      teachers: initialTeachers,
      isActive: mainClass?.isActive !== undefined ? mainClass.isActive : true,
      tradeId:
        courseTradeMap[mainClass?._id] ||
        mainClass?.tradeId ||
        getTradeFromCourseName(mainClass?.name) ||
        "",
    });
    setIsEditModalOpen(true);
  }, [courseData, courseTradeMap, getTradeFromCourseName]);

  const handleEditFormChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setEditFormData((prev) => {
      const updatedData = { ...prev, [name]: newValue };

      if (name === "startDate" || name === "duration") {
        if (updatedData.startDate && updatedData.duration) {
          const startDateObj = new Date(updatedData.startDate);
          const durationMonths = parseInt(updatedData.duration, 10);

          if (
            !isNaN(durationMonths) &&
            startDateObj.toString() !== "Invalid Date"
          ) {
            startDateObj.setMonth(startDateObj.getMonth() + durationMonths);
            updatedData.endDate = startDateObj.toISOString().split("T")[0];
          }
        }
      }
      return updatedData;
    });
  }, []);

  const handleEditSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!courseData?.mainClass) return;
      setIsUpdatingCourse(true);
      try {
        const selectedTrade = TRADES.find((t) => t.id === editFormData.tradeId);
        let finalName = editFormData.name;
        if (
          selectedTrade &&
          !finalName.toLowerCase().includes(selectedTrade.name.toLowerCase())
        ) {
          finalName = `${selectedTrade.name} - ${finalName}`;
        }

        const payload = { ...editFormData, name: finalName };
        await updateClass(courseData.mainClass._id, payload);

        if (editFormData.tradeId !== undefined) {
          assignTradeToCourse(courseData.mainClass._id, editFormData.tradeId);
        }

        const enrichedTeachers = (editFormData.teachers || []).map((tid) => {
          const found = teachersCacheMap.byId.get(String(tid));
          return found || { _id: tid, name: "Instructor" };
        });

        updateCourseStateAndCache((prevData) => ({
          ...prevData,
          mainClass: {
            ...prevData.mainClass,
            ...payload,
            teachers: enrichedTeachers,
          },
        }));

        toast.success("Course details updated successfully!");
        setIsEditModalOpen(false);
      } catch (error) {
        console.error("Failed to update course", error);
        toast.error(
          error.response?.data?.message || "Failed to update course details."
        );
      } finally {
        setIsUpdatingCourse(false);
      }
    },
    [
      courseData,
      editFormData,
      updateClass,
      assignTradeToCourse,
      teachersCacheMap,
      updateCourseStateAndCache,
    ]
  );

  // --- Delete Course Handler ---
  const handleDeleteCourse = useCallback(async () => {
    if (!courseData?.mainClass) return;
    setIsDeletingCourse(true);
    try {
      await deleteClass(courseData.mainClass._id);
      courseDetailsCache.delete(String(courseData.mainClass._id));
      toast.success("Course deleted successfully!");
      navigate("/courses", { replace: true });
    } catch (error) {
      console.error("Failed to delete course", error);
      toast.error(error.response?.data?.message || "Failed to delete course.");
      setIsDeletingCourse(false);
    }
  }, [courseData, deleteClass, navigate]);

  // --- Student Progress Toggle Handler ---
  const handleStatusToggle = useCallback(
    async (recordId, fieldName, currentValue) => {
      const updateKey = `${recordId}-${fieldName}`;
      setLoadingKeys((prev) => ({ ...prev, [updateKey]: true }));

      try {
        await getStudentProgress(recordId, { [fieldName]: !currentValue });
        updateCourseStateAndCache((prevData) => {
          const updatedProgress = prevData.studentsProgress.map((record) =>
            record._id === recordId
              ? { ...record, [fieldName]: !currentValue }
              : record
          );
          return { ...prevData, studentsProgress: updatedProgress };
        });
        toast.success("Status updated successfully!");
      } catch (error) {
        console.error("Failed to update status", error);
        toast.error(error.message || "An error occurred");
      } finally {
        setLoadingKeys((prev) => {
          const newKeys = { ...prev };
          delete newKeys[updateKey];
          return newKeys;
        });
      }
    },
    [getStudentProgress, updateCourseStateAndCache]
  );

  // --- Remove Student Handler ---
  const handleConfirmRemove = useCallback(async () => {
    if (!studentToRemove || !courseData?.mainClass) return;
    setIsRemoving(true);

    try {
      const targetStudentId =
        studentToRemove?.student?._id || studentToRemove?.student;

      await removeStudentInClass({
        mainClassId: courseData.mainClass._id,
        studentId: targetStudentId,
      });

      updateCourseStateAndCache((prevData) => {
        const updatedProgress = (prevData.studentsProgress || []).filter(
          (record) =>
            String(record?.student?._id || record?.student) !==
            String(targetStudentId)
        );

        const updatedMainClassStudents = (
          prevData.mainClass?.students || []
        ).filter((s) => String(s?._id || s) !== String(targetStudentId));

        return {
          ...prevData,
          studentsProgress: updatedProgress,
          mainClass: {
            ...prevData.mainClass,
            students: updatedMainClassStudents,
          },
        };
      });

      toast.success("Student removed successfully!");
      setStudentToRemove(null);
    } catch (err) {
      console.error("Failed to remove student", err);
      toast.error(err.response?.data?.message || "Failed to remove student.");
    } finally {
      setIsRemoving(false);
    }
  }, [
    studentToRemove,
    courseData,
    removeStudentInClass,
    updateCourseStateAndCache,
  ]);

  // --- Inline Add Student Modal Handlers ---
  const handleOpenAddStudentModal = useCallback(() => {
    const activeCourseId = courseData?.mainClass?._id || courseId || "";
    setEnrollFormData({
      mainClassId: activeCourseId,
      studentEmail: "",
      admissionDate: new Date().toISOString().split("T")[0],
    });
    setSelectedStudentToEnroll(null);
    setEnrollSearchTerm("");
    setEnrollFeedback({ type: null, message: "" });
    setIsStudentSelectOpen(false);
    setIsAddStudentModalOpen(true);

    if (getStudents) {
      getStudents();
    }
  }, [courseData, courseId, getStudents]);

  const handleEnrollStudentSelect = useCallback((student) => {
    setSelectedStudentToEnroll(student);
    setEnrollFormData((prev) => ({ ...prev, studentEmail: student.email }));
    setIsStudentSelectOpen(false);
    setEnrollSearchTerm("");
    setEnrollFeedback((prev) =>
      prev.type === "error" ? { type: null, message: "" } : prev
    );
  }, []);

  const handleEnrollFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setEnrollFormData((prev) => ({ ...prev, [name]: value }));
    setEnrollFeedback((prev) =>
      prev.type === "error" ? { type: null, message: "" } : prev
    );
  }, []);

  const handleAddStudentSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const targetMainClassId =
        enrollFormData.mainClassId || courseData?.mainClass?._id || courseId;

      if (
        !targetMainClassId ||
        !enrollFormData.studentEmail ||
        !enrollFormData.admissionDate
      ) {
        setEnrollFeedback({
          type: "error",
          message: "Please select an eligible student and admission date.",
        });
        return;
      }

      setIsSubmittingStudent(true);
      setEnrollFeedback({ type: null, message: "" });

      try {
        await addStudentInClass({
          mainClassId: targetMainClassId,
          studentEmail: enrollFormData.studentEmail,
          admissionDate: enrollFormData.admissionDate,
        });

        toast.success("Student successfully enrolled in the course!");
        await loadCourseDetails(true);

        setEnrollFormData((prev) => ({ ...prev, studentEmail: "" }));
        setSelectedStudentToEnroll(null);
        setIsAddStudentModalOpen(false);
      } catch (err) {
        const msg =
          err.response?.data?.message ||
          "Failed to add student. Please try again.";
        setEnrollFeedback({
          type: "error",
          message: msg,
        });
        toast.error(msg);
      } finally {
        setIsSubmittingStudent(false);
      }
    },
    [enrollFormData, courseData, courseId, addStudentInClass, loadCourseDetails]
  );

  // --- Memoized Computations for Teachers, Students & Pagination ---
  const mainClass = courseData?.mainClass;
  const studentsProgress = courseData?.studentsProgress || [];

  // Enrich Course Teachers with Cached Teacher Profiles (Ensures _id, name, email, and profilePic are present)
  const enrichedCourseTeachers = useMemo(() => {
    const rawList = mainClass?.teachers || [];
    return rawList.map((t) => {
      if (typeof t === "string") {
        return (
          teachersCacheMap.byId.get(String(t)) || {
            _id: t,
            name: "Instructor",
          }
        );
      }
      const cached =
        (t?._id && teachersCacheMap.byId.get(String(t._id))) ||
        (t?.email && teachersCacheMap.byEmail.get(t.email.toLowerCase()));
      return {
        ...t,
        ...(cached || {}),
      };
    });
  }, [mainClass?.teachers, teachersCacheMap]);

  // Set of already enrolled student IDs and Emails
  const { enrolledIdsSet, enrolledEmailsSet } = useMemo(() => {
    const ids = new Set();
    const emails = new Set();

    (mainClass?.students || []).forEach((s) => {
      const id = typeof s === "object" ? s?._id : s;
      if (id) ids.add(String(id));
      if (s?.email) emails.add(s.email.toLowerCase());
    });

    studentsProgress.forEach((record) => {
      if (record?.student?._id) ids.add(String(record.student._id));
      if (record?.student?.email)
        emails.add(record.student.email.toLowerCase());
    });

    return { enrolledIdsSet: ids, enrolledEmailsSet: emails };
  }, [mainClass?.students, studentsProgress]);

  // Available (non-enrolled) students for the Add Student Modal
  const availableStudentsForEnrollment = useMemo(() => {
    return safeStudentsArray.filter((student) => {
      if (!student) return false;
      if (student._id && enrolledIdsSet.has(String(student._id))) return false;
      if (
        student.email &&
        enrolledEmailsSet.has(student.email.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [safeStudentsArray, enrolledIdsSet, enrolledEmailsSet]);

  const filteredEnrollableStudents = useMemo(() => {
    const q = (enrollSearchTerm || "").trim().toLowerCase();
    if (!q) return availableStudentsForEnrollment;
    return availableStudentsForEnrollment.filter((student) => {
      const name = (student?.name || "").toLowerCase();
      const email = (student?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [availableStudentsForEnrollment, enrollSearchTerm]);

  // Filtered students for the Progress Tracker table (Searches cached names/emails too)
  const filteredStudents = useMemo(() => {
    const searchLower = studentSearchTerm.trim().toLowerCase();
    if (!searchLower) return studentsProgress;

    return studentsProgress.filter((record) => {
      const cachedStu = getCachedStudentForRecord(record);
      const name = (
        record?.student?.name ||
        cachedStu?.name ||
        ""
      ).toLowerCase();
      const email = (
        record?.student?.email ||
        cachedStu?.email ||
        ""
      ).toLowerCase();
      const rollMatch = getStudentId(record)
        ?.toString()
        .toLowerCase()
        .includes(searchLower);

      return (
        name.includes(searchLower) || email.includes(searchLower) || rollMatch
      );
    });
  }, [studentsProgress, studentSearchTerm, getCachedStudentForRecord]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));

  useEffect(() => {
    setCurrentPage(1);
  }, [studentSearchTerm, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  // Course Progress Summary Metrics
  const courseMetrics = useMemo(() => {
    let batchDone = 0;
    let examDone = 0;
    let certIssued = 0;
    studentsProgress.forEach((r) => {
      if (r?.batchcompletion) batchDone++;
      if (r?.examcompletion) examDone++;
      if (r?.certificateIssued) certIssued++;
    });
    return { batchDone, examDone, certIssued };
  }, [studentsProgress]);

  const resolvedTradeLabel = useMemo(
    () =>
      getTradeLabel(
        courseTradeMap[mainClass?._id] ||
          mainClass?.tradeId ||
          getTradeFromCourseName(mainClass?.name)
      ),
    [
      courseTradeMap,
      mainClass?._id,
      mainClass?.tradeId,
      mainClass?.name,
      getTradeFromCourseName,
    ]
  );

  if (isInitialLoading || (!courseData && !localError)) {
    return <CourseDetailsSkeleton courseName={displayCourseName} />;
  }

  if (localError) {
    return (
      <div className="p-8 min-h-[60vh] flex items-center justify-center">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-8 rounded-3xl max-w-lg w-full text-center space-y-4">
          <AlertTriangle className="w-10 h-10 mx-auto" />
          <p className="font-bold text-lg">{localError}</p>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-2.5 bg-card text-foreground border border-border rounded-xl hover:bg-muted transition font-semibold text-sm"
            >
              Go Back
            </button>
            <button
              type="button"
              onClick={() => loadCourseDetails(true)}
              className="px-5 py-2.5 bg-destructive text-destructive-foreground rounded-xl hover:opacity-90 transition font-semibold text-sm"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, filteredStudents.length);

  return (
    <>
      <Helmet>
        <title>{`IOK - Course | ${mainClass?.name || displayCourseName}`}</title>
      </Helmet>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="min-h-screen bg-background p-4 sm:p-6 md:p-8 transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Top Bar */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <button
                type="button"
                onClick={handleBack}
                className="p-2.5 bg-card border border-border rounded-xl hover:bg-muted hover:text-primary transition-colors shadow-sm"
                title="Go Back"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      mainClass?.isActive
                        ? "bg-success/10 text-success border border-success/20"
                        : "bg-destructive/10 text-destructive border border-destructive/20"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        mainClass?.isActive ? "bg-success" : "bg-destructive"
                      }`}
                    />
                    {mainClass?.isActive ? "Active Course" : "Inactive Course"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    • Created {formatDate(mainClass?.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2.5 bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors shadow-sm disabled:opacity-50"
                title="Refresh Course Data"
              >
                <RefreshCw
                  className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>

              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-card border border-destructive/30 text-destructive rounded-xl hover:bg-destructive/10 transition-colors shadow-sm text-sm font-semibold"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>

              <button
                type="button"
                onClick={handleOpenEditModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground rounded-xl hover:bg-muted transition-colors shadow-sm text-sm font-semibold"
              >
                <Edit className="w-4 h-4" />
                Edit Course
              </button>

              <button
                type="button"
                onClick={handleOpenAddStudentModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-95 transition-all shadow-sm shadow-primary/20 text-sm font-bold"
              >
                <UserPlus className="w-4 h-4" />
                Add Student
              </button>
            </div>
          </div>

          {/* Course Overview Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Course Details Card */}
            <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm lg:col-span-2 space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary border border-primary/20 mb-3">
                  <Briefcase className="w-3.5 h-3.5" />
                  {resolvedTradeLabel}
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground capitalize tracking-tight">
                  {mainClass?.name || displayCourseName}
                </h1>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> Start Date
                  </span>
                  <p className="font-bold text-foreground text-sm sm:text-base">
                    {formatDate(mainClass?.startDate)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary" /> End Date
                  </span>
                  <p className="font-bold text-foreground text-sm sm:text-base">
                    {formatDate(mainClass?.endDate)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" /> Duration
                  </span>
                  <p className="font-bold text-foreground text-sm sm:text-base">
                    {mainClass?.duration || 0} Months
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 space-y-1">
                  <span className="text-muted-foreground text-xs font-medium flex items-center gap-1.5">
                    <IndianRupee className="w-3.5 h-3.5 text-primary" /> Course Fee
                  </span>
                  <p className="font-bold text-primary text-sm sm:text-base">
                    ₹{mainClass?.fees || 0}
                  </p>
                </div>
              </div>

              {/* Clickable Assigned Instructors Section */}
              <div className="pt-5 border-t border-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Assigned Instructors
                  </h3>
                  {enrichedCourseTeachers.length > 0 && (
                    <span className="text-[11px] text-muted-foreground">
                      Click an instructor to view profile
                    </span>
                  )}
                </div>

                {enrichedCourseTeachers.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {enrichedCourseTeachers.map((teacher, idx) => (
                      <InstructorCard
                        key={teacher._id || idx}
                        teacher={teacher}
                        onViewProfile={handleViewUserProfile}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="bg-muted/20 p-4 rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                    No instructors assigned to this course yet.
                  </div>
                )}
              </div>
            </div>

            {/* Batches & Capacity Card */}
            <div className="bg-card p-6 sm:p-8 rounded-3xl border border-border shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-6">
                <h2 className="text-lg font-bold text-foreground border-b border-border pb-3">
                  Batches & Enrollment
                </h2>

                <div className="flex items-center justify-between bg-primary/10 border border-primary/20 text-primary p-4 rounded-2xl">
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-card flex items-center justify-center shadow-sm border border-primary/10">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-2xl font-extrabold leading-none">
                        {studentsProgress.length ||
                          mainClass?.students?.length ||
                          0}
                      </p>
                      <p className="text-xs font-semibold opacity-80 mt-1">
                        Students Enrolled
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddStudentModal}
                    className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity flex items-center gap-1 shadow-sm"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Enroll
                  </button>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Linked Batches ({mainClass?.batches?.length || 0})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {mainClass?.batches?.map((batch) => (
                      <div
                        key={batch?._id}
                        onClick={() =>
                          navigate(`/batches/${generateSlug(batch?.name)}`, {
                            state: {
                              batchId: batch._id,
                              batchName: batch.name,
                            },
                          })
                        }
                        className="px-3.5 py-2.5 text-sm bg-muted/30 border border-border rounded-xl text-foreground font-semibold flex items-center justify-between cursor-pointer hover:border-primary/50 hover:bg-muted/60 transition-all"
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          <span className="truncate">{batch?.name}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    ))}
                    {(!mainClass?.batches ||
                      mainClass.batches.length === 0) && (
                      <p className="text-xs text-muted-foreground italic p-3 rounded-xl bg-muted/20 border border-dashed border-border text-center">
                        No batches assigned yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Mini Completion Summary */}
              <div className="pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-muted/30">
                  <p className="text-base font-extrabold text-foreground">
                    {courseMetrics.batchDone}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Batch Done
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/30">
                  <p className="text-base font-extrabold text-foreground">
                    {courseMetrics.examDone}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Exam Cleared
                  </p>
                </div>
                <div className="p-2.5 rounded-xl bg-muted/30">
                  <p className="text-base font-extrabold text-success">
                    {courseMetrics.certIssued}
                  </p>
                  <p className="text-[11px] text-muted-foreground font-medium">
                    Certified
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Student Progress Tracker Table */}
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-visible">
            <div className="p-6 border-b border-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2.5">
                  <GraduationCap className="w-6 h-6 text-primary" />
                  Student Progress Tracker
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {filteredStudents.length}
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Click a student to view their profile, or toggle their batch,
                  exam, and certificate milestones.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                {studentsProgress.length > 0 && (
                  <div className="relative flex-1 sm:w-72">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by name, email, or ID..."
                      value={studentSearchTerm}
                      onChange={(e) => setStudentSearchTerm(e.target.value)}
                      className="block w-full pl-10 pr-9 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    />
                    {studentSearchTerm && (
                      <button
                        type="button"
                        onClick={() => setStudentSearchTerm("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-bold w-24">Student ID</th>
                    <th className="px-6 py-4 font-bold">Student Info</th>
                    <th className="px-6 py-4 font-bold">Join Date</th>
                    <th className="px-6 py-4 font-bold text-center">
                      Batch Status
                    </th>
                    <th className="px-6 py-4 font-bold text-center">
                      Exam Cleared
                    </th>
                    <th className="px-6 py-4 font-bold text-center">
                      Certificate
                    </th>
                    <th className="px-6 py-4 font-bold text-center w-20">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {studentsProgress.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-16 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-3">
                          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center">
                            <Users className="w-7 h-7 opacity-50" />
                          </div>
                          <div>
                            <p className="font-bold text-foreground text-base">
                              No students enrolled yet
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Enroll your first student into this course to
                              track their progress.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={handleOpenAddStudentModal}
                            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                          >
                            <UserPlus className="w-4 h-4" />
                            Enroll Student
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : paginatedStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-12 text-center text-muted-foreground"
                      >
                        <p className="font-semibold text-foreground">
                          No students match "{studentSearchTerm}"
                        </p>
                        <button
                          type="button"
                          onClick={() => setStudentSearchTerm("")}
                          className="mt-2 text-xs text-primary font-semibold hover:underline"
                        >
                          Clear search filter
                        </button>
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((record) => (
                      <StudentProgressRow
                        key={record?._id}
                        record={record}
                        cachedStudent={getCachedStudentForRecord(record)}
                        loadingKeys={loadingKeys}
                        activeDropdown={activeDropdown}
                        onToggleStatus={handleStatusToggle}
                        onToggleDropdown={setActiveDropdown}
                        onPromptRemove={setStudentToRemove}
                        onViewProfile={handleViewUserProfile}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {filteredStudents.length > 0 && (
              <div className="px-6 py-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-b-3xl">
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    Showing{" "}
                    <strong className="text-foreground">
                      {startIndex}–{endIndex}
                    </strong>{" "}
                    of{" "}
                    <strong className="text-foreground">
                      {filteredStudents.length}
                    </strong>{" "}
                    students
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-lg border border-border bg-background text-foreground font-semibold text-xs outline-none focus:border-primary cursor-pointer"
                  >
                    <option value={8}>8 / page</option>
                    <option value={15}>15 / page</option>
                    <option value={30}>30 / page</option>
                  </select>
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" /> Prev
                    </button>

                    <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-muted text-foreground">
                      Page {currentPage} of {totalPages}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* --- Integrated Add Student Modal --- */}
      <AnimatePresence>
        {isAddStudentModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() =>
              !isSubmittingStudent && setIsAddStudentModalOpen(false)
            }
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border rounded-3xl shadow-2xl w-full max-w-lg overflow-visible relative"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Enroll Student in Course
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Assign an existing student to{" "}
                      <strong className="text-foreground">
                        {mainClass?.name}
                      </strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isSubmittingStudent}
                  onClick={() => setIsAddStudentModalOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddStudentSubmit} className="p-6 space-y-5">
                {enrollFeedback.message && (
                  <div
                    className={`p-3.5 rounded-2xl flex items-start gap-3 border text-xs font-medium ${
                      enrollFeedback.type === "error"
                        ? "bg-destructive/10 border-destructive/20 text-destructive"
                        : "bg-success/10 border-success/20 text-success"
                    }`}
                  >
                    {enrollFeedback.type === "error" ? (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    )}
                    <span>{enrollFeedback.message}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Target Course
                  </label>
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-muted/40 text-foreground">
                    <BookOpen className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-semibold truncate">
                      {mainClass?.name || displayCourseName}
                    </span>
                    <span className="ml-auto text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-md shrink-0">
                      ₹{mainClass?.fees || 0}
                    </span>
                  </div>
                </div>

                {/* Searchable Student Selector with Cached Avatars */}
                <div className="space-y-1.5" ref={studentSelectDropdownRef}>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Select Student <span className="text-destructive">*</span>
                    </label>
                    <span className="text-[11px] font-medium text-muted-foreground">
                      {availableStudentsForEnrollment.length} eligible
                    </span>
                  </div>

                  <div className="relative">
                    <div
                      onClick={() =>
                        !isStudentsLoading &&
                        setIsStudentSelectOpen((prev) => !prev)
                      }
                      className={`flex items-center justify-between w-full px-3.5 py-2.5 bg-background border rounded-xl transition-all shadow-sm ${
                        isStudentSelectOpen
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      } ${
                        isStudentsLoading
                          ? "opacity-70 cursor-wait"
                          : "cursor-pointer"
                      }`}
                    >
                      {selectedStudentToEnroll ? (
                        <div className="flex items-center gap-3 min-w-0">
                          <UserAvatar
                            src={resolveAvatarUrl(selectedStudentToEnroll)}
                            name={selectedStudentToEnroll.name}
                            email={selectedStudentToEnroll.email}
                            className="w-8 h-8 rounded-full text-xs"
                          />
                          <div className="flex flex-col text-left min-w-0">
                            <span className="text-sm font-bold text-foreground truncate">
                              {selectedStudentToEnroll.name}
                            </span>
                            <span className="text-xs text-muted-foreground truncate">
                              {selectedStudentToEnroll.email}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 text-muted-foreground py-1 text-sm">
                          {isStudentsLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                          ) : (
                            <Users className="w-4 h-4" />
                          )}
                          <span>
                            {isStudentsLoading
                              ? "Loading students directory..."
                              : "Search and select a student..."}
                          </span>
                        </div>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${
                          isStudentSelectOpen ? "rotate-180" : ""
                        }`}
                      />
                    </div>

                    <AnimatePresence>
                      {isStudentSelectOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                          <div className="p-2.5 border-b border-border bg-muted/30">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                              <input
                                type="text"
                                placeholder="Filter by student name or email..."
                                value={enrollSearchTerm}
                                onChange={(e) =>
                                  setEnrollSearchTerm(e.target.value)
                                }
                                className="w-full pl-9 pr-8 py-2 text-xs bg-background text-foreground border border-border rounded-xl outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                                autoFocus
                              />
                              {enrollSearchTerm && (
                                <button
                                  type="button"
                                  onClick={() => setEnrollSearchTerm("")}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <div className="max-h-56 overflow-y-auto divide-y divide-border/40">
                            {filteredEnrollableStudents.length > 0 ? (
                              filteredEnrollableStudents.map((student) => {
                                const isSelected =
                                  selectedStudentToEnroll?._id === student._id;
                                return (
                                  <div
                                    key={student._id}
                                    onClick={() =>
                                      handleEnrollStudentSelect(student)
                                    }
                                    className={`flex items-center justify-between gap-3 px-4 py-2.5 hover:bg-muted/60 cursor-pointer transition-colors ${
                                      isSelected ? "bg-primary/10" : ""
                                    }`}
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <UserAvatar
                                        src={resolveAvatarUrl(student)}
                                        name={student.name}
                                        email={student.email}
                                        className="w-8 h-8 rounded-full text-xs"
                                      />
                                      <div className="flex flex-col min-w-0">
                                        <span className="text-sm font-semibold text-foreground truncate">
                                          {student.name}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate">
                                          {student.email}
                                        </span>
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <Check className="w-4 h-4 text-primary shrink-0" />
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="p-5 text-center text-xs text-muted-foreground">
                                {availableStudentsForEnrollment.length === 0
                                  ? "All registered students are already enrolled in this course."
                                  : `No eligible students match "${enrollSearchTerm}".`}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Admission Date */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="admissionDate"
                    className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Admission Date <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                    <input
                      type="date"
                      id="admissionDate"
                      name="admissionDate"
                      required
                      value={enrollFormData.admissionDate}
                      onChange={handleEnrollFormChange}
                      className="block w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex justify-end gap-3">
                  <button
                    type="button"
                    disabled={isSubmittingStudent}
                    onClick={() => setIsAddStudentModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-foreground hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      isSubmittingStudent ||
                      isStudentsLoading ||
                      !enrollFormData.studentEmail
                    }
                    className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm shadow-primary/20 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmittingStudent ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Enroll Student
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Delete Course Modal --- */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative"
            >
              <button
                type="button"
                onClick={() => !isDeletingCourse && setIsDeleteModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6">
                <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Delete Course?
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Are you sure you want to delete{" "}
                  <strong className="text-foreground">{mainClass?.name}</strong>
                  ?
                </p>
                <p className="text-xs text-destructive font-medium leading-relaxed">
                  This action cannot be undone. All batches and student progress
                  records linked to this course will be permanently removed.
                </p>
              </div>

              <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeletingCourse}
                  className="px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteCourse}
                  disabled={isDeletingCourse}
                  className="px-4 py-2 text-sm font-semibold text-destructive-foreground bg-destructive hover:opacity-90 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-destructive/20 disabled:opacity-70"
                >
                  {isDeletingCourse ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete Course
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Remove Student Modal --- */}
      <AnimatePresence>
        {studentToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative"
            >
              <button
                type="button"
                onClick={() => !isRemoving && setStudentToRemove(null)}
                className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6">
                <div className="w-12 h-12 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Remove Student?
                </h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Are you sure you want to remove{" "}
                  <strong className="text-foreground">
                    {studentToRemove?.student?.name || "this student"}
                  </strong>{" "}
                  from this course?
                </p>
                <p className="text-xs text-destructive font-medium">
                  This action cannot be undone. Progress tracking will be lost.
                </p>
              </div>

              <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setStudentToRemove(null)}
                  disabled={isRemoving}
                  className="px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmRemove}
                  disabled={isRemoving}
                  className="px-4 py-2 text-sm font-semibold text-destructive-foreground bg-destructive hover:opacity-90 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-destructive/20 disabled:opacity-70"
                >
                  {isRemoving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Removing...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- Edit Course Modal --- */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-3xl shadow-xl w-full max-w-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Edit className="w-5 h-5 text-primary" />
                  Edit Course Details
                </h3>
                <button
                  type="button"
                  onClick={() => !isUpdatingCourse && setIsEditModalOpen(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-1">
                <form
                  id="editCourseForm"
                  onSubmit={handleEditSubmit}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <label className="text-sm font-semibold text-foreground">
                        Course Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={editFormData.name}
                        onChange={handleEditFormChange}
                        className="w-full px-3.5 py-2.5 border border-border bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        required
                        value={editFormData.startDate}
                        onChange={handleEditFormChange}
                        className="w-full px-3.5 py-2.5 border border-border bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">
                        Duration (Months)
                      </label>
                      <input
                        type="number"
                        name="duration"
                        required
                        min="1"
                        value={editFormData.duration}
                        onChange={handleEditFormChange}
                        className="w-full px-3.5 py-2.5 border border-border bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground flex justify-between items-center">
                        <span>End Date</span>
                        <span className="text-xs font-normal text-primary">
                          Auto-calculated
                        </span>
                      </label>
                      <input
                        type="date"
                        name="endDate"
                        required
                        readOnly
                        value={editFormData.endDate}
                        className="w-full px-3.5 py-2.5 border border-border bg-muted/50 text-muted-foreground rounded-xl cursor-not-allowed focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-foreground">
                        Fees (₹)
                      </label>
                      <input
                        type="number"
                        name="fees"
                        required
                        min="0"
                        value={editFormData.fees}
                        onChange={handleEditFormChange}
                        className="w-full px-3.5 py-2.5 border border-border bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    {/* Custom Instructor Dropdown */}
                    <div
                      className="space-y-1.5 md:col-span-2 relative"
                      ref={teacherDropdownRef}
                    >
                      <label className="text-sm font-semibold text-foreground">
                        Assign Instructor(s)
                      </label>
                      <div
                        className="w-full px-3.5 py-2.5 border border-border bg-background text-foreground rounded-xl flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors min-h-[44px]"
                        onClick={() =>
                          setIsTeacherDropdownOpen(!isTeacherDropdownOpen)
                        }
                      >
                        {editFormData.teachers?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {editFormData.teachers.map((teacherId) => {
                              const selectedTeacher =
                                teachersCacheMap.byId.get(String(teacherId));
                              if (!selectedTeacher) return null;
                              return (
                                <div
                                  key={teacherId}
                                  className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-lg text-xs font-semibold"
                                >
                                  {selectedTeacher.name}
                                  <span
                                    className="cursor-pointer hover:text-destructive transition-colors ml-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditFormData((prev) => ({
                                        ...prev,
                                        teachers: prev.teachers.filter(
                                          (id) =>
                                            String(id) !== String(teacherId)
                                        ),
                                      }));
                                    }}
                                  >
                                    <X className="w-3 h-3" />
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            Select instructor(s)...
                          </span>
                        )}
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0 ml-2" />
                      </div>

                      <AnimatePresence>
                        {isTeacherDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.15 }}
                            className="absolute z-50 top-full left-0 right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl max-h-56 overflow-y-auto"
                          >
                            {teachers?.length > 0 ? (
                              teachers.map((teacher) => {
                                const isSelected = editFormData.teachers?.some(
                                  (id) => String(id) === String(teacher._id)
                                );
                                return (
                                  <div
                                    key={teacher._id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditFormData((prev) => {
                                        const newTeachers = isSelected
                                          ? prev.teachers.filter(
                                              (id) =>
                                                String(id) !==
                                                String(teacher._id)
                                            )
                                          : [
                                              ...(prev.teachers || []),
                                              teacher._id,
                                            ];
                                        return {
                                          ...prev,
                                          teachers: newTeachers,
                                        };
                                      });
                                    }}
                                    className={`px-4 py-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3 transition-colors border-b last:border-0 border-border/50 ${
                                      isSelected ? "bg-primary/5" : ""
                                    }`}
                                  >
                                    <UserAvatar
                                      src={resolveAvatarUrl(teacher)}
                                      name={teacher.name}
                                      email={teacher.email}
                                      className="w-8 h-8 rounded-full text-xs"
                                    />
                                    <div className="flex flex-col flex-1 min-w-0">
                                      <span className="text-sm font-semibold text-foreground truncate">
                                        {teacher.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground truncate">
                                        {teacher.email}
                                      </span>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                                    )}
                                  </div>
                                );
                              })
                            ) : (
                              <div className="px-4 py-6 text-sm text-muted-foreground text-center flex flex-col items-center gap-2">
                                <Users className="w-6 h-6 text-muted-foreground/50" />
                                No instructors available.
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="md:col-span-2 mt-1">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={editFormData.isActive}
                          onChange={handleEditFormChange}
                          className="w-4 h-4 text-primary rounded border-border focus:ring-primary bg-background"
                        />
                        <span className="text-sm font-semibold text-foreground">
                          Course is Active
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-semibold text-foreground">
                      Trade
                    </label>
                    <select
                      name="tradeId"
                      value={editFormData.tradeId}
                      onChange={handleEditFormChange}
                      className="w-full px-3.5 py-2.5 border border-border bg-background text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {TRADES.map((trade) => (
                        <option key={trade.id} value={trade.id}>
                          {trade.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </form>
              </div>

              <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdatingCourse}
                  className="px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="editCourseForm"
                  disabled={isUpdatingCourse}
                  className="px-5 py-2 text-sm font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-primary/20 disabled:opacity-70"
                >
                  {isUpdatingCourse ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default React.memo(CourseDetails);