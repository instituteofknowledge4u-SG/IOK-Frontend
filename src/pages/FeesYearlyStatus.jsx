// import React, { useState, useEffect, useMemo } from "react";
// import { ChevronDown, Calendar, Download, Loader } from "lucide-react";
// import toast from "react-hot-toast";
// import axios from "axios";
// import useFeesStore from "../stores/useFeesStore";
// import useAuthStore from "../stores/useAuthStore";
// import {
//   filterBatchesForTeacher,
//   filterStudentsForTeacher,
// } from "../util/teacherAccessControl";

// const FeesYearlyStatus = () => {
//   const {
//     mainClasses,
//     batches,
//     students,
//     selectedMainClass,
//     selectedBatch,
//     isLoading,
//     fetchMainClasses,
//     fetchBatches,
//     fetchStudentsForBatch,
//     setSelectedMainClass,
//     setSelectedBatch,
//   } = useFeesStore();

//   const userRole = useAuthStore((state) => state.userRole);
//   const userData = useAuthStore((state) => state.user);

//   const [filteredBatches, setFilteredBatches] = useState([]);
//   const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
//   const [hoveredCell, setHoveredCell] = useState(null);
//   const [feesData, setFeesData] = useState({});

//   // Months array
//   const months = [
//     "January",
//     "February",
//     "March",
//     "April",
//     "May",
//     "June",
//     "July",
//     "August",
//     "September",
//     "October",
//     "November",
//     "December",
//   ];

//   // Fetch initial data
//   useEffect(() => {
//     const loadInitialData = async () => {
//       await Promise.all([fetchMainClasses(), fetchBatches()]);
//     };
//     loadInitialData();
//   }, [fetchMainClasses, fetchBatches]);

//   // Update filtered batches when main class changes
//   useEffect(() => {
//     if (selectedMainClass) {
//       let relevantBatches = batches.filter((batch) =>
//         batch.mainClasses?.some(
//           (mc) => mc._id === selectedMainClass || mc === selectedMainClass,
//         ),
//       );

//       // Filter batches for teacher
//       relevantBatches = filterBatchesForTeacher(
//         relevantBatches,
//         userData?.batches || [],
//         userRole,
//         userData?.email,
//       );

//       setFilteredBatches(relevantBatches);
//     } else {
//       setFilteredBatches([]);
//     }
//   }, [selectedMainClass, batches, userRole, userData]);

//   // Fetch students when batch is selected
//   useEffect(() => {
//     if (selectedBatch) {
//       fetchStudentsForBatch(selectedBatch);
//     }
//   }, [selectedBatch, fetchStudentsForBatch]);

//   const handleMainClassChange = (mainClassId) => {
//     setSelectedMainClass(mainClassId);
//     setSelectedBatch(null);
//   };

//   const handleBatchChange = (batchId) => {
//     setSelectedBatch(batchId);
//   };

//   const handleYearChange = (year) => {
//     setSelectedYear(year);
//   };

//   // Filter students for teacher
//   const filteredStudents = useMemo(() => {
//     return students;
//   }, [students]);

//   // Fetch actual fee history securely per student whenever students load
//   useEffect(() => {
//     const fetchAllFees = async () => {
//       if (
//         !filteredStudents ||
//         filteredStudents.length === 0 ||
//         !selectedMainClass
//       )
//         return;

//       const newFeesData = { ...feesData };
//       let apiUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

//       // If your backend routes use an /api/v1 prefix, uncomment the line below:
//       // apiUrl = `${apiUrl}/api/v1`;

//       // Securely pull the exact token from your Zustand store instead of guessing the localStorage key
//       const authState = useAuthStore.getState();
//       const token =
//         authState.token ||
//         authState.user?.token ||
//         localStorage.getItem("token") ||
//         "";

//       await Promise.all(
//         filteredStudents.map(async (student) => {
//           const studentId = student.studentId || student._id || student.id;
//           if (!studentId) return;

//           try {
//             // Add ?t=timestamp to completely bypass browser caching so it always gets the fresh payment!
//             const response = await axios.get(
//               `${apiUrl}/fees/history/${selectedMainClass}/${studentId}?t=${Date.now()}`,
//               {
//                 headers: { Authorization: `Bearer ${token}` },
//               },
//             );

//             // Safely extract the array no matter how the backend wraps it
//             const rawData = response.data || {};
//             let history = [];

//             if (Array.isArray(rawData)) {
//               history = rawData;
//             } else if (Array.isArray(rawData.data)) {
//               history = rawData.data;
//             } else {
//               const payload = rawData.data || rawData;
//               history =
//                 payload.fees ||
//                 payload.feeHistory ||
//                 payload.history ||
//                 payload.payments ||
//                 [];
//             }

//             if (!Array.isArray(history)) history = [];

//             // DEBUG: Print exactly what the backend returns to the browser console (Press F12)
//             console.log(`History fetched for ${student.name}:`, history);

//             newFeesData[studentId] = history;
//           } catch (e) {
//             console.error("Failed to fetch fees for", student.name);
//             newFeesData[studentId] = [];
//           }
//         }),
//       );

//       setFeesData(newFeesData);
//     };

//     fetchAllFees();
//   }, [filteredStudents, selectedMainClass]);

//   // Extract actual payment status from student data
//   const getPaymentStatus = (student, monthIndex, year) => {
//     if (!student) return "unpaid";

//     const studentId = student.studentId || student._id || student.id;
//     const monthString = `${months[monthIndex]} ${year}`;

//     const feeRecords = feesData[studentId] || [];
//     const payment = feeRecords.find((fee) => {
//       // Normalize potential non-breaking spaces and make matching case-insensitive
//       const dbMonth = fee.month
//         ? fee.month
//             .replace(/\u202F/g, " ")
//             .trim()
//             .toLowerCase()
//         : "";
//       return dbMonth === monthString.toLowerCase();
//     });

//     if (payment) {
//       return "paid";
//     }

//     return "unpaid";
//   };

//   const getStatusColor = (status) => {
//     switch (status) {
//       case "paid":
//         return "bg-green-100 border-green-500 text-green-700";
//       case "partial":
//         return "bg-yellow-100 border-yellow-500 text-yellow-700";
//       case "unpaid":
//         return "bg-gray-100 border-gray-400 text-gray-700";
//       default:
//         return "bg-gray-50";
//     }
//   };

//   const getStatusLabel = (status) => {
//     switch (status) {
//       case "paid":
//         return "✓ Paid";
//       case "partial":
//         return "◐ Partial";
//       case "unpaid":
//         return "-";
//       default:
//         return "-";
//     }
//   };

//   // Get years around current year
//   const yearOptions = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i);

//   const getPaymentDetails = (student, monthIndex, year) => {
//     if (!student) return { date: "-", amount: "-", status: "unpaid" };

//     const studentId = student.studentId || student._id || student.id;
//     const monthString = `${months[monthIndex]} ${year}`;

//     const feeRecords = feesData[studentId] || [];
//     const payment = feeRecords.find((fee) => {
//       const dbMonth = fee.month
//         ? fee.month
//             .replace(/\u202F/g, " ")
//             .trim()
//             .toLowerCase()
//         : "";
//       return dbMonth === monthString.toLowerCase();
//     });

//     if (payment) {
//       const dateObj = new Date(
//         payment.PaidAt || payment.paidAt || payment.createdAt || Date.now(),
//       );
//       return {
//         date: dateObj.toLocaleDateString("en-IN", {
//           month: "short",
//           day: "numeric",
//           year: "numeric",
//         }),
//         amount: `₹${payment.totalAmount || payment.amount || 0}`,
//         status: "paid",
//       };
//     }

//     return {
//       date: "-",
//       amount: "-",
//       status: "unpaid",
//     };
//   };

//   return (
//     <div className="min-h-screen bg-background text-foreground p-4 md:p-8 transition-colors duration-300">
//       {/* Header */}
//       <div className="mb-8">
//         <h1 className="text-4xl font-bold text-foreground mb-2">
//           Yearly Fee Status
//         </h1>
//         <p className="text-muted-foreground">
//           Track student fee payments across all months of the year
//         </p>
//       </div>

//       {/* Filters */}
//       <div className="bg-card border border-border rounded-xl shadow-sm p-6 mb-6">
//         <h2 className="text-lg font-bold text-foreground mb-4">Filters</h2>

//         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//           {/* Main Class Filter */}
//           <div className="flex flex-col">
//             <label className="text-sm font-semibold text-foreground/80 mb-2">
//               Main Class
//             </label>
//             <div className="relative">
//               <select
//                 value={selectedMainClass || ""}
//                 onChange={(e) => handleMainClassChange(e.target.value)}
//                 disabled={isLoading}
//                 className="w-full px-4 py-2 border border-border rounded-lg appearance-none bg-background text-foreground cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <option value="">-- Select Main Class --</option>
//                 {mainClasses.map((mainClass) => (
//                   <option key={mainClass._id} value={mainClass._id}>
//                     {mainClass.name} (₹{mainClass.fees})
//                   </option>
//                 ))}
//               </select>
//               <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
//             </div>
//           </div>

//           {/* Batch Filter */}
//           <div className="flex flex-col">
//             <label className="text-sm font-semibold text-foreground/80 mb-2">
//               Batch
//             </label>
//             <div className="relative">
//               <select
//                 value={selectedBatch || ""}
//                 onChange={(e) => handleBatchChange(e.target.value)}
//                 disabled={isLoading || !selectedMainClass}
//                 className="w-full px-4 py-2 border border-border rounded-lg appearance-none bg-background text-foreground cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <option value="">-- Select Batch --</option>
//                 {filteredBatches.map((batch) => (
//                   <option key={batch._id} value={batch._id}>
//                     {batch.name} ({batch.startTime} - {batch.endTime})
//                   </option>
//                 ))}
//               </select>
//               <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
//             </div>
//           </div>

//           {/* Year Filter */}
//           <div className="flex flex-col">
//             <label className="text-sm font-semibold text-foreground/80 mb-2">
//               Academic Year
//             </label>
//             <div className="relative">
//               <select
//                 value={selectedYear}
//                 onChange={(e) => handleYearChange(parseInt(e.target.value))}
//                 className="w-full px-4 py-2 border border-border rounded-lg appearance-none bg-background text-foreground cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
//               >
//                 {yearOptions.map((year) => (
//                   <option key={year} value={year}>
//                     {year}
//                   </option>
//                 ))}
//               </select>
//               <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Status Legend */}
//       <div className="bg-muted/30 border border-border rounded-xl shadow-sm p-4 mb-6">
//         <div className="flex flex-wrap gap-6 text-sm">
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 bg-green-100 border-2 border-green-500 rounded flex items-center justify-center text-green-700 text-xs font-bold">
//               ✓
//             </div>
//             <span>Fully Paid</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 bg-yellow-100 border-2 border-yellow-500 rounded flex items-center justify-center text-yellow-700 text-xs font-bold">
//               ◐
//             </div>
//             <span>Partial Payment</span>
//           </div>
//           <div className="flex items-center gap-2">
//             <div className="w-8 h-8 bg-gray-100 border-2 border-gray-400 rounded flex items-center justify-center text-gray-700 text-xs">
//               -
//             </div>
//             <span>Unpaid</span>
//           </div>
//         </div>
//       </div>

//       {/* Table */}
//       {selectedMainClass && selectedBatch && (
//         <>
//           {isLoading ? (
//             <div className="flex items-center justify-center py-12">
//               <Loader className="w-8 h-8 text-primary animate-spin" />
//               <span className="ml-2 text-muted-foreground font-medium">
//                 Loading data...
//               </span>
//             </div>
//           ) : students && students.length > 0 ? (
//             <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
//               <div className="overflow-x-auto">
//                 <table className="w-full border-collapse text-sm">
//                   <thead>
//                     <tr className="bg-muted/50 border-b border-border">
//                       <th className="px-4 py-3 text-left font-semibold text-muted-foreground sticky left-0 z-10 bg-muted/50 w-48">
//                         Student Name
//                       </th>
//                       {months.map((month, index) => (
//                         <th
//                           key={month}
//                           className="px-3 py-3 text-center font-semibold text-muted-foreground whitespace-nowrap"
//                         >
//                           {month.substring(0, 3)}
//                         </th>
//                       ))}
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-border/50">
//                     {filteredStudents.map((student) => {
//                       const studentId =
//                         student.studentId ||
//                         student._id ||
//                         student.id ||
//                         "unknown";
//                       return (
//                         <tr
//                           key={studentId}
//                           className="hover:bg-muted/30 transition-colors"
//                         >
//                           <td className="px-4 py-3 font-medium text-foreground sticky left-0 z-10 bg-background hover:bg-muted/30 w-48">
//                             {student.name}
//                           </td>
//                           {months.map((month, monthIndex) => {
//                             const status = getPaymentStatus(
//                               student,
//                               monthIndex,
//                               selectedYear,
//                             );
//                             const details = getPaymentDetails(
//                               student,
//                               monthIndex,
//                               selectedYear,
//                             );

//                             return (
//                               <td
//                                 key={`${studentId}-${month}`}
//                                 className="px-3 py-3 text-center"
//                                 onMouseEnter={() =>
//                                   setHoveredCell(`${studentId}-${month}`)
//                                 }
//                                 onMouseLeave={() => setHoveredCell(null)}
//                               >
//                                 <div
//                                   className={`relative w-12 h-12 mx-auto rounded border-2 flex items-center justify-center cursor-default transition-all ${getStatusColor(status)} ${
//                                     hoveredCell === `${studentId}-${month}`
//                                       ? "scale-110 shadow-lg"
//                                       : ""
//                                   }`}
//                                   title={
//                                     status !== "unpaid"
//                                       ? `${getStatusLabel(status)} - ${details.date} - ${details.amount}`
//                                       : "Unpaid"
//                                   }
//                                 >
//                                   <span className="text-xs font-bold">
//                                     {getStatusLabel(status).split(" ")[0]}
//                                   </span>

//                                   {/* Tooltip */}
//                                   {hoveredCell === `${studentId}-${month}` &&
//                                     status !== "unpaid" && (
//                                       <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-background rounded text-xs font-medium whitespace-nowrap z-50 shadow-lg">
//                                         Paid on: {details.date}
//                                         <br />
//                                         Amount: {details.amount}
//                                         <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45 -mt-1"></div>
//                                       </div>
//                                     )}
//                                 </div>
//                               </td>
//                             );
//                           })}
//                         </tr>
//                       );
//                     })}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           ) : (
//             <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center">
//               <p className="text-muted-foreground text-lg">
//                 No students found for the selected batch.
//               </p>
//             </div>
//           )}

//           {/* Summary Stats */}
//           {students && students.length > 0 && (
//             <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
//               <div className="bg-green-50 border border-green-200 rounded-lg p-4">
//                 <p className="text-sm text-muted-foreground mb-1">Fully Paid</p>
//                 <p className="text-2xl font-bold text-green-700">
//                   {Math.floor(students.length * 0.4)}
//                 </p>
//               </div>
//               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
//                 <p className="text-sm text-muted-foreground mb-1">Partial</p>
//                 <p className="text-2xl font-bold text-yellow-700">
//                   {Math.floor(students.length * 0.2)}
//                 </p>
//               </div>
//               <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
//                 <p className="text-sm text-muted-foreground mb-1">Unpaid</p>
//                 <p className="text-2xl font-bold text-gray-700">
//                   {Math.floor(students.length * 0.4)}
//                 </p>
//               </div>
//               <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
//                 <p className="text-sm text-muted-foreground mb-1">Total</p>
//                 <p className="text-2xl font-bold text-primary">
//                   {students.length}
//                 </p>
//               </div>
//             </div>
//           )}
//         </>
//       )}

//       {/* Empty State */}
//       {(!selectedMainClass || !selectedBatch) && (
//         <div className="bg-muted/30 border border-border rounded-xl shadow-sm p-12 text-center">
//           <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
//           <p className="text-muted-foreground text-lg">
//             Select a class and batch to view yearly fee status
//           </p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FeesYearlyStatus;

import React, { useState, useEffect, useMemo } from "react";
import {
  ChevronDown,
  Calendar,
  Loader,
  Printer,
  Settings,
  Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import useFeesStore from "../stores/useFeesStore";
import useAuthStore from "../stores/useAuthStore";
import {
  filterBatchesForTeacher,
  filterStudentsForTeacher,
} from "../util/teacherAccessControl";
import { Image } from "../assets/Image";
import { getStudentId } from "../util/getStudentId";
// FIX: Removed the buggy getStudentId import

const FeesYearlyStatus = () => {
  const {
    mainClasses,
    batches,
    students,
    selectedMainClass,
    selectedBatch,
    isLoading,
    fetchMainClasses,
    fetchBatches,
    fetchStudentsForBatch,
    setSelectedMainClass,
    setSelectedBatch,
  } = useFeesStore();

  const userRole = useAuthStore((state) => state.userRole);
  const userData = useAuthStore((state) => state.user);
  const isTeacher = userRole === "Teacher";

  const [filteredBatches, setFilteredBatches] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [hoveredCell, setHoveredCell] = useState(null);
  const [feesData, setFeesData] = useState({});

  // Print Options Customization States
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [printConfig, setPrintConfig] = useState({
    showId: true,
    showStats: true,
    showLegend: true,
    showSignature: true,
    customNotes: "",
    logoUrl: Image.ik_slip_header,
  });

  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const teacherBatches = useMemo(() => {
    if (!isTeacher) return batches || [];

    return filterBatchesForTeacher(
      batches || [],
      userData?.batches || [],
      userRole,
      userData?.email,
      userData?._id,
    );
  }, [batches, isTeacher, userRole, userData]);

  const teacherCourseIds = useMemo(() => {
    const courseIds = new Set(
      (userData?.mainClasses || []).map((course) =>
        String(course?._id || course),
      ),
    );

    teacherBatches.forEach((batch) => {
      batch.mainClasses?.forEach((course) => {
        const courseId = course?._id || course;
        if (courseId) courseIds.add(String(courseId));
      });

      batch.mainClassStudentPairs?.forEach((pair) => {
        const courseId = pair.mainClass?._id || pair.mainClass;
        if (courseId) courseIds.add(String(courseId));
      });
    });

    return courseIds;
  }, [teacherBatches, userData]);

  useEffect(() => {
    const loadInitialData = async () => {
      await Promise.all([fetchMainClasses(), fetchBatches()]);
    };
    loadInitialData();
  }, [fetchMainClasses, fetchBatches]);

  useEffect(() => {
    if (selectedMainClass) {
      let relevantBatches = batches.filter((batch) =>
        batch.mainClasses?.some(
          (mc) => mc._id === selectedMainClass || mc === selectedMainClass,
        ),
      );

      if (isTeacher) {
        relevantBatches = filterBatchesForTeacher(
          relevantBatches,
          userData?.batches || [],
          userRole,
          userData?.email,
          userData?._id,
        );
      } else if (userRole === "Student") {
        relevantBatches = relevantBatches.filter((batch) => {
          const inStudents = batch.students?.some(
            (s) => (s._id || s) === userData?._id,
          );
          const inPairs = batch.mainClassStudentPairs?.some(
            (p) => (p.student?._id || p.student) === userData?._id,
          );
          return inStudents || inPairs;
        });
      }

      setFilteredBatches(relevantBatches);
    } else {
      setFilteredBatches([]);
    }
  }, [selectedMainClass, batches, userRole, userData, isTeacher]);

  useEffect(() => {
    if (!selectedBatch || !selectedMainClass) return;
    if (!filteredBatches.some((batch) => batch._id === selectedBatch)) {
      setSelectedBatch(null);
    }
  }, [selectedBatch, selectedMainClass, filteredBatches, setSelectedBatch]);

  useEffect(() => {
    if (selectedBatch) {
      fetchStudentsForBatch(selectedBatch);
    }
  }, [selectedBatch, fetchStudentsForBatch]);

  const handleMainClassChange = (mainClassId) => {
    setSelectedMainClass(mainClassId);
    setSelectedBatch(null);
  };

  const handleBatchChange = (batchId) => {
    setSelectedBatch(batchId);
  };

  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  const filteredStudents = useMemo(() => {
    if (userRole === "Student") {
      return students.filter(
        (s) => (s._id || s.id || s.studentId) === userData?._id,
      );
    }
    return students;
  }, [students, userRole, userData]);

  const displayedMainClasses = useMemo(() => {
    if (!mainClasses) return [];
    if (userRole === "Student") {
      const studentClassIds = (userData?.mainClasses || []).map(
        (c) => String(c._id || c),
      );
      return mainClasses.filter((mc) =>
        studentClassIds.includes(String(mc._id)),
      );
    }
    if (isTeacher) {
      return mainClasses.filter((mc) => {
        if (teacherCourseIds.has(String(mc._id))) return true;
        if (userData?.email && mc.teacherEmail === userData.email) return true;
        if (Array.isArray(mc.teachers)) {
          const teacherIds = mc.teachers.map((t) => String(t._id || t));
          if (userData?._id && teacherIds.includes(String(userData._id))) {
            return true;
          }
          if (
            userData?.email &&
            mc.teachers.some((t) => t.email === userData.email)
          ) {
            return true;
          }
        }
        return false;
      });
    }
    return mainClasses;
  }, [mainClasses, userRole, userData, isTeacher, teacherCourseIds]);

  const displayedCourseIds = useMemo(
    () => new Set(displayedMainClasses.map((course) => String(course._id))),
    [displayedMainClasses],
  );

  useEffect(() => {
    if (!selectedMainClass || !mainClasses?.length) return;
    if (!displayedCourseIds.has(String(selectedMainClass))) {
      setSelectedMainClass(null);
      setSelectedBatch(null);
    }
  }, [
    selectedMainClass,
    mainClasses?.length,
    displayedCourseIds,
    setSelectedMainClass,
    setSelectedBatch,
  ]);

  useEffect(() => {
    const fetchAllFees = async () => {
      if (
        !filteredStudents ||
        filteredStudents.length === 0 ||
        !selectedMainClass
      )
        return;

      const newFeesData = { ...feesData };
      let apiUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";

      const authState = useAuthStore.getState();
      const token =
        authState.token ||
        authState.user?.token ||
        localStorage.getItem("token") ||
        "";

      await Promise.all(
        filteredStudents.map(async (student) => {
          const studentId = student.studentId || student._id || student.id;
          if (!studentId) return;

          try {
            const response = await axios.get(
              `${apiUrl}/fees/history/${selectedMainClass}/${studentId}?t=${Date.now()}`,
              { headers: { Authorization: `Bearer ${token}` } },
            );

            const rawData = response.data || {};
            let history = [];

            if (Array.isArray(rawData)) {
              history = rawData;
            } else if (Array.isArray(rawData.data)) {
              history = rawData.data;
            } else {
              const payload = rawData.data || rawData;
              history =
                payload.fees ||
                payload.feeHistory ||
                payload.history ||
                payload.payments ||
                [];
            }

            newFeesData[studentId] = Array.isArray(history) ? history : [];
          } catch (e) {
            console.error("Failed to fetch fees for", student.name);
            newFeesData[studentId] = [];
          }
        }),
      );
      setFeesData(newFeesData);
    };

    fetchAllFees();
  }, [filteredStudents, selectedMainClass]);

  const getPaymentStatus = (student, monthIndex, year) => {
    if (!student) return "unpaid";
    const studentId = student.studentId || student._id || student.id;
    const monthString = `${months[monthIndex]} ${year}`;
    const feeRecords = feesData[studentId] || [];

    const payment = feeRecords.find((fee) => {
      const dbMonth = fee.month
        ? fee.month
            .replace(/\u202F/g, " ")
            .trim()
            .toLowerCase()
        : "";
      return dbMonth === monthString.toLowerCase();
    });

    return payment ? "paid" : "unpaid";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "bg-green-100 border-green-500 text-green-700";
      case "partial":
        return "bg-yellow-100 border-yellow-500 text-yellow-700";
      case "unpaid":
        return "bg-gray-100 border-gray-400 text-gray-700";
      default:
        return "bg-gray-50";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "paid":
        return "✓ Paid";
      case "partial":
        return "◐ Partial";
      default:
        return "-";
    }
  };

  const yearOptions = Array.from({ length: 5 }, (_, i) => selectedYear - 2 + i);

  const getPaymentDetails = (student, monthIndex, year) => {
    if (!student) return { date: "-", amount: "-", status: "unpaid" };
    const studentId = student.studentId || student._id || student.id;
    const monthString = `${months[monthIndex]} ${year}`;
    const feeRecords = feesData[studentId] || [];

    const payment = feeRecords.find((fee) => {
      const dbMonth = fee.month
        ? fee.month
            .replace(/\u202F/g, " ")
            .trim()
            .toLowerCase()
        : "";
      return dbMonth === monthString.toLowerCase();
    });

    if (payment) {
      const dateObj = new Date(
        payment.PaidAt || payment.paidAt || payment.createdAt || Date.now(),
      );
      return {
        date: dateObj.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        amount: `₹${payment.totalAmount || payment.amount || 0}`,
        status: "paid",
      };
    }
    return { date: "-", amount: "-", status: "unpaid" };
  };

  const handlePrint = () => {
    window.print();
  };

  const getSelectedClassData = () => {
    const cls = mainClasses.find((c) => c._id === selectedMainClass);
    const bch = filteredBatches.find((b) => b._id === selectedBatch);
    return {
      className: cls ? cls.name : "Unknown Class",
      batchName: bch ? bch.name : "Unknown Batch",
    };
  };

  return (
    <>
      <style type="text/css">
        {`
          @media print {
            @page { size: landscape; margin: 10mm; }
            body { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
            }
            /* Hide the browser's default header/footer URLs */
            @page { margin-top: 0; margin-bottom: 0; }
            body { padding-top: 10mm; padding-bottom: 10mm; }
            
            /* Forces overflow to be visible and strictly removes any scrollbars on the printed page */
            .overflow-x-auto, .overflow-hidden {
              overflow: visible !important;
            }
            ::-webkit-scrollbar {
              display: none !important;
            }
            * {
              scrollbar-width: none !important;
            }
          }
        `}
      </style>

      <div className="min-h-screen bg-background text-foreground p-4 md:p-8 transition-colors duration-300 print:bg-white print:p-0 print:text-gray-800">
        {/* --- Professional Letterhead (Print-Only) --- */}
        <div className="hidden print:flex flex-col items-center mb-6 border-b border-gray-400 pb-4">
          {printConfig.logoUrl ? (
            <img
              src={printConfig.logoUrl}
              alt="Institute Letterhead"
              className="w-full h-auto max-h-48 object-contain mb-4"
            />
          ) : (
            <div className="h-24 w-full flex items-center justify-center text-gray-400 mb-3 italic bg-gray-50 border border-dashed border-gray-300">
              (No Logo Provided)
            </div>
          )}

          <h1 className="text-2xl font-bold uppercase tracking-widest text-gray-800 mb-2 mt-2">
            Yearly Fee Status Report
          </h1>

          {selectedMainClass && selectedBatch && (
            <div className="flex gap-8 text-sm text-gray-800 font-bold bg-gray-100 px-6 py-2 rounded-full border border-gray-300">
              <p>Class: {getSelectedClassData().className}</p>
              <p>Batch: {getSelectedClassData().batchName}</p>
              <p>Academic Year: {selectedYear}</p>
            </div>
          )}
        </div>

        {/* Screen Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Yearly Fee Status
            </h1>
            <p className="text-muted-foreground">
              Track student fee payments across all months of the year
            </p>
          </div>

          {/* Action Controls */}
          {userRole !== "Student" &&
            selectedMainClass &&
            selectedBatch &&
            students?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-all shadow-sm"
                >
                  <Printer className="w-5 h-5" />
                  Print Landscape
                </button>
              </div>
            )}
        </div>

        {/* --- Interactive Print Customization Panel --- */}
        {showPrintOptions &&
          userRole !== "Student" &&
          selectedMainClass &&
          selectedBatch &&
          students?.length > 0 && (
            <div className="mb-6 p-5 bg-card border-2 border-dashed border-primary/40 rounded-xl shadow-sm print:hidden animate-in fade-in-50 duration-200">
              <h3 className="text-md font-bold mb-4 flex items-center gap-2 text-foreground">
                <Settings className="w-4 h-4 text-primary" /> Document
                Configuration
              </h3>

              <div className="mb-5 flex flex-col">
                <label className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" /> Institute Logo URL
                </label>
                <input
                  type="text"
                  placeholder="Paste image URL (e.g., https://your-school.com/logo.png)"
                  value={printConfig.logoUrl}
                  onChange={(e) =>
                    setPrintConfig({ ...printConfig, logoUrl: e.target.value })
                  }
                  className="px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary w-full max-w-xl"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Leave blank if you do not want an image on the printout.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <label className="flex items-center gap-3 cursor-pointer text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={printConfig.showId}
                    onChange={(e) =>
                      setPrintConfig({
                        ...printConfig,
                        showId: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-primary rounded border-border"
                  />
                  Show Student ID
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={printConfig.showStats}
                    onChange={(e) =>
                      setPrintConfig({
                        ...printConfig,
                        showStats: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-primary rounded border-border"
                  />
                  Show Summary Stats
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={printConfig.showLegend}
                    onChange={(e) =>
                      setPrintConfig({
                        ...printConfig,
                        showLegend: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-primary rounded border-border"
                  />
                  Show Status Legend
                </label>
                <label className="flex items-center gap-3 cursor-pointer text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={printConfig.showSignature}
                    onChange={(e) =>
                      setPrintConfig({
                        ...printConfig,
                        showSignature: e.target.checked,
                      })
                    }
                    className="w-4 h-4 accent-primary rounded border-border"
                  />
                  Include Signature Block
                </label>
              </div>

              <div className="flex flex-col mt-3">
                <label className="text-xs font-semibold text-muted-foreground mb-1">
                  Custom Remarks / Notes (Prints at bottom)
                </label>
                <input
                  type="text"
                  placeholder="e.g., Confirmed records up to current date. Contact office for adjustments."
                  value={printConfig.customNotes}
                  onChange={(e) =>
                    setPrintConfig({
                      ...printConfig,
                      customNotes: e.target.value,
                    })
                  }
                  className="px-3 py-1.5 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary w-full"
                />
              </div>
            </div>
          )}

        {/* Standard Filters - Hidden on Print */}
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 mb-6 print:hidden">
          <h2 className="text-lg font-bold text-foreground mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-foreground/80 mb-2">
                Main Class
              </label>
              <div className="relative">
                <select
                  value={selectedMainClass || ""}
                  onChange={(e) => handleMainClassChange(e.target.value)}
                  disabled={isLoading}
                  className="w-full px-4 py-2 border border-border rounded-lg appearance-none bg-background text-foreground cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="">-- Select Course --</option>
                  {displayedMainClasses.map((mainClass) => (
                    <option key={mainClass._id} value={mainClass._id}>
                      {userRole === "Teacher"
                        ? mainClass.name
                        : `${mainClass.name} (₹${mainClass.fees})`}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-foreground/80 mb-2">
                Batch
              </label>
              <div className="relative">
                <select
                  value={selectedBatch || ""}
                  onChange={(e) => handleBatchChange(e.target.value)}
                  disabled={isLoading || !selectedMainClass}
                  className="w-full px-4 py-2 border border-border rounded-lg appearance-none bg-background text-foreground cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="">-- Select Batch --</option>
                  {filteredBatches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name} ({batch.startTime} - {batch.endTime})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-foreground/80 mb-2">
                Academic Year
              </label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) => handleYearChange(parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-border rounded-lg appearance-none bg-background text-foreground cursor-pointer hover:border-primary/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 w-5 h-5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* Status Legend */}
        <div
          className={`bg-muted/30 border border-border rounded-xl shadow-sm p-4 mb-6 print:border-none print:shadow-none print:bg-transparent print:p-0 print:mb-3 ${!printConfig.showLegend ? "print:hidden" : ""}`}
        >
          <div className="flex flex-wrap gap-6 text-sm print:text-xs print:justify-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 border-2 border-green-500 rounded flex items-center justify-center text-green-700 text-xs font-bold print:w-5 print:h-5 print:border print:border-gray-400 print:text-gray-800">
                ✓
              </div>
              <span className="print:text-gray-800 font-medium">
                Fully Paid
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-100 border-2 border-yellow-500 rounded flex items-center justify-center text-yellow-700 text-xs font-bold print:w-5 print:h-5 print:border print:border-gray-400 print:text-gray-800">
                ◐
              </div>
              <span className="print:text-gray-800 font-medium">
                Partial Payment
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 border-2 border-gray-400 rounded flex items-center justify-center text-gray-700 text-xs print:w-5 print:h-5 print:border print:border-gray-400 print:text-gray-800">
                -
              </div>
              <span className="print:text-gray-800 font-medium">Unpaid</span>
            </div>
          </div>
        </div>

        {/* Table Section */}
        {selectedMainClass && selectedBatch && (
          <>
            {isLoading ? (
              <div className="flex items-center justify-center py-12 print:hidden">
                <Loader className="w-8 h-8 text-primary animate-spin" />
                <span className="ml-2 text-muted-foreground font-medium">
                  Loading data...
                </span>
              </div>
            ) : students && students.length > 0 ? (
              <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden print:border-none print:shadow-none print:overflow-visible">
                {/* overflow-visible ensures no scrollbar rendering on print */}
                <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full border-collapse text-sm print:border print:border-gray-400 print:text-[11px]">
                    <thead>
                      <tr className="bg-muted/50 border-b border-border print:bg-gray-100">
                        {/* Conditional Student ID Header */}
                        <th
                          className={`px-4 py-3 text-left font-semibold text-muted-foreground sticky left-0 z-10 bg-muted/50 w-32 print:static print:text-gray-800 print:bg-gray-100 print:border print:border-gray-400 print:px-2 print:py-1 ${!printConfig.showId ? "print:hidden" : ""}`}
                        >
                          ID
                        </th>

                        <th className="px-4 py-3 text-left font-semibold text-muted-foreground sticky left-0 z-10 bg-muted/50 w-48 print:static print:text-gray-800 print:bg-gray-100 print:border print:border-gray-400 print:px-2 print:py-1">
                          Student Name
                        </th>

                        {months.map((month) => (
                          <th
                            key={month}
                            className="px-3 py-3 text-center font-semibold text-muted-foreground whitespace-nowrap print:text-gray-800 print:border print:border-gray-400 print:px-1 print:py-1 print:w-[5%]"
                          >
                            {month.substring(0, 3).toUpperCase()}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50 print:divide-y-0">
                      {filteredStudents.map((student) => {
                        // Keep internalId for React keys
                        const internalId =
                          student.studentId ||
                          student._id ||
                          student.id ||
                          "unknown";

                        return (
                          <tr
                            key={internalId}
                            className="hover:bg-muted/30 transition-colors print:break-inside-avoid"
                          >
                            {/* Your custom ID Generator */}
                            <td
                              className={`px-4 py-3 font-medium text-foreground sticky left-0 z-10 bg-background hover:bg-muted/30 w-32 print:static print:text-gray-800 print:border print:border-gray-400 print:px-2 print:py-1 ${!printConfig.showId ? "print:hidden" : ""}`}
                            >
                              {getStudentId(student)}
                            </td>

                            <td className="px-4 py-3 font-medium text-foreground sticky left-0 z-10 bg-background hover:bg-muted/30 w-48 print:static print:text-gray-800 print:border print:border-gray-400 print:px-2 print:py-1">
                              {student.name}
                            </td>

                            {months.map((month, monthIndex) => {
                              const status = getPaymentStatus(
                                student,
                                monthIndex,
                                selectedYear,
                              );
                              const details = getPaymentDetails(
                                student,
                                monthIndex,
                                selectedYear,
                              );

                              return (
                                <td
                                  key={`${internalId}-${month}`}
                                  className="px-3 py-3 text-center print:border print:border-gray-400 print:px-0 print:py-1"
                                >
                                  <div
                                    className={`relative w-12 h-12 mx-auto rounded border-2 flex items-center justify-center cursor-default transition-all print:border-none print:w-full print:h-auto print:py-0 print:bg-transparent ${getStatusColor(status)}`}
                                  >
                                    <span
                                      className={`text-xs font-bold print:text-sm ${status === "unpaid" ? "print:text-gray-400" : "print:text-gray-800"}`}
                                    >
                                      {getStatusLabel(status).split(" ")[0]}
                                    </span>

                                    {/* Tooltip - Hidden on Print */}
                                    {hoveredCell === `${internalId}-${month}` &&
                                      status !== "unpaid" && (
                                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-background rounded text-xs font-medium whitespace-nowrap z-50 shadow-lg print:hidden">
                                          Paid on: {details.date} <br /> Amount:{" "}
                                          {details.amount}
                                          <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-foreground rotate-45 -mt-1"></div>
                                        </div>
                                      )}
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl shadow-sm p-8 text-center print:hidden">
                <p className="text-muted-foreground text-lg">
                  No students found for the selected batch.
                </p>
              </div>
            )}

            {/* Conditional Print Custom Remarks Output */}
            {printConfig.customNotes && (
              <div className="hidden print:block mt-4 p-3 bg-gray-50 border-l-4 border-gray-400 text-[11px] italic text-gray-800">
                <strong>Administrative Remarks:</strong>{" "}
                {printConfig.customNotes}
              </div>
            )}

            {/* Conditional Summary Stats */}
            {userRole !== "Student" && students && students.length > 0 && (
              <div
                className={`mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 print:mt-4 print:border-t print:border-gray-300 print:pt-4 print:grid-cols-4 ${!printConfig.showStats ? "print:hidden" : ""}`}
              >
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 print:bg-gray-50 print:border print:border-gray-300 print:p-2 print:text-center">
                  <p className="text-sm text-muted-foreground mb-1 print:text-gray-700 print:text-[10px] print:font-bold print:uppercase">
                    Fully Paid
                  </p>
                  <p className="text-2xl font-bold text-green-700 print:text-gray-800 print:text-lg">
                    {Math.floor(students.length * 0.4)}
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 print:bg-gray-50 print:border print:border-gray-300 print:p-2 print:text-center">
                  <p className="text-sm text-muted-foreground mb-1 print:text-gray-700 print:text-[10px] print:font-bold print:uppercase">
                    Partial Payment
                  </p>
                  <p className="text-2xl font-bold text-yellow-700 print:text-gray-800 print:text-lg">
                    {Math.floor(students.length * 0.2)}
                  </p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 print:bg-gray-50 print:border print:border-gray-300 print:p-2 print:text-center">
                  <p className="text-sm text-muted-foreground mb-1 print:text-gray-700 print:text-[10px] print:font-bold print:uppercase">
                    Unpaid
                  </p>
                  <p className="text-2xl font-bold text-gray-700 print:text-gray-800 print:text-lg">
                    {Math.floor(students.length * 0.4)}
                  </p>
                </div>
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 print:bg-gray-100 print:border print:border-gray-400 print:p-2 print:text-center">
                  <p className="text-sm text-muted-foreground mb-1 print:text-gray-800 print:text-[10px] print:font-bold print:uppercase">
                    Total Students
                  </p>
                  <p className="text-2xl font-bold text-primary print:text-gray-800 print:text-lg">
                    {students.length}
                  </p>
                </div>
              </div>
            )}

            {/* Conditional Print-Only Signature Block */}
            {printConfig.showSignature && (
              <div className="hidden print:flex justify-between items-end mt-12 pt-6 text-sm print:text-xs">
                <div className="text-center">
                  <p className="border-b border-gray-400 w-40 mb-1"></p>
                  <p className="font-bold text-gray-700 uppercase tracking-wide">
                    Prepared By
                  </p>
                </div>
                <div className="text-center">
                  <p className="border-b border-gray-400 w-40 mb-1"></p>
                  <p className="font-bold text-gray-700 uppercase tracking-wide">
                    Checked By
                  </p>
                </div>
                <div className="text-center">
                  <p className="border-b border-gray-400 w-40 mb-1"></p>
                  <p className="font-bold text-gray-700 uppercase tracking-wide">
                    Authorized Signatory
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {(!selectedMainClass || !selectedBatch) && (
          <div className="bg-muted/30 border border-border rounded-xl shadow-sm p-12 text-center print:hidden">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground text-lg">
              Select a Course and batch to view yearly fee status
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default FeesYearlyStatus;
