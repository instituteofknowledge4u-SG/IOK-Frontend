// import React, { useState, useEffect } from "react";
// import { useNavigate, Link } from "react-router-dom";
// import {
//   ArrowLeft,
//   BookOpen,
//   Calendar,
//   Clock,
//   IndianRupee,
//   Save,
//   Loader2,
//   UserCheck,
//   ChevronDown,
// } from "lucide-react";
// import useClassStore from "../../stores/useClassStore";
// import useUserStore from "../../stores/useUserStore";
// import toast from "react-hot-toast";
// import BackButton from "../../components/UI/Button";

// const CreateCourse = () => {
//   const navigate = useNavigate();
//   const { createClass, isLoading, error } = useClassStore();
//   const { getTeachers, teachers } = useUserStore();
//   const userLoading = useUserStore((state) => state.isLoading);

//   const [formData, setFormData] = useState({
//     name: "",
//     startDate: "",
//     duration: 3,
//     fees: "",
//     teacherEmail: "",
//   });

//   const [calculatedEndDate, setCalculatedEndDate] = useState(null);
//   const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);

//   useEffect(() => {
//     getTeachers();
//   }, [getTeachers]);

//   useEffect(() => {
//     if (formData.startDate && formData.duration) {
//       const start = new Date(formData.startDate);
//       start.setMonth(start.getMonth() + parseInt(formData.duration));
//       setCalculatedEndDate(start);
//     } else {
//       setCalculatedEndDate(null);
//     }
//   }, [formData.startDate, formData.duration]);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const payload = {
//         ...formData,
//         duration: Number(formData.duration),
//         fees: Number(formData.fees),
//         endDate: calculatedEndDate
//           ? calculatedEndDate.toISOString().split("T")[0]
//           : null,
//       };

//       await createClass(payload);
//       toast.success("Course Created Successfully");
//       navigate("/courses");
//     } catch (err) {
//       console.error("Failed to create class", err);
//       toast.error(err);
//     }
//   };

//   const formatDateForDisplay = (dateObj) => {
//     if (!dateObj) return "Select start date and duration";
//     return dateObj.toLocaleDateString("en-IN", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });
//   };

//   return (
//     <>
//       {userLoading && (
//         <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm transition-all duration-300">
//           <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
//           <p className="text-slate-600 font-medium animate-pulse">
//             Loading teachers...
//           </p>
//         </div>
//       )}

//       <div className="min-h-screen bg-slate-50 p-6 md:p-8 flex justify-center items-start">
//         <div className="max-w-3xl w-full space-y-6">
//           <BackButton details={`Add a new course offering to the institute.`} />
//           {error && (
//             <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-center gap-2">
//               <span>⚠️</span> {error}
//             </div>
//           )}

//           <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative">
//             <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
//               <div className="space-y-4">
//                 <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">
//                   Basic Information
//                 </h2>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div className="space-y-1.5 md:col-span-2">
//                     <label className="text-sm font-medium text-slate-700">
//                       Course Name
//                     </label>
//                     <div className="relative">
//                       <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
//                         <BookOpen className="h-5 w-5 text-slate-400" />
//                       </div>
//                       <input
//                         type="text"
//                         name="name"
//                         required
//                         placeholder="e.g., Data Structures & Algorithms"
//                         value={formData.name}
//                         onChange={handleChange}
//                         className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
//                       />
//                     </div>
//                   </div>

//                   {/* Custom Teacher Dropdown */}
//                   <div className="space-y-1.5 md:col-span-2 relative">
//                     <label className="text-sm font-medium text-slate-700">
//                       Assign Teacher
//                     </label>
//                     <div
//                       onClick={() =>
//                         setIsTeacherDropdownOpen(!isTeacherDropdownOpen)
//                       }
//                       className="relative flex items-center w-full pl-3.5 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all cursor-pointer min-h-[46px]"
//                     >
//                       <UserCheck className="h-5 w-5 text-slate-400 absolute left-3.5" />
//                       <div className="ml-8 flex-1 truncate">
//                         {formData.teacherEmail ? (
//                           (() => {
//                             const teacherList =
//                               teachers?.data || teachers || [];
//                             const selected = teacherList.find(
//                               (t) => t.email === formData.teacherEmail,
//                             );
//                             return selected ? (
//                               <div className="flex items-center gap-2">
//                                 <img
//                                   src={selected.profilePic}
//                                   alt={selected.name}
//                                   className="w-6 h-6 rounded-full object-cover border border-slate-200"
//                                 />
//                                 <span className="font-medium text-slate-700">
//                                   {selected.name}
//                                 </span>
//                               </div>
//                             ) : (
//                               <span className="text-slate-400">
//                                 Select an instructor...
//                               </span>
//                             );
//                           })()
//                         ) : (
//                           <span className="text-slate-400">
//                             Select an instructor...
//                           </span>
//                         )}
//                       </div>
//                       <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
//                         <ChevronDown
//                           className={`h-5 w-5 text-slate-400 transition-transform ${isTeacherDropdownOpen ? "rotate-180" : ""}`}
//                         />
//                       </div>
//                     </div>

//                     {isTeacherDropdownOpen && (
//                       <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto py-1 animate-in fade-in slide-in-from-top-2">
//                         {(() => {
//                           const teacherList = teachers?.data || teachers || [];
//                           if (teacherList.length === 0)
//                             return (
//                               <div className="px-4 py-3 text-sm text-slate-500 text-center">
//                                 No teachers found
//                               </div>
//                             );
//                           return teacherList.map((teacher) => (
//                             <div
//                               key={teacher._id}
//                               onClick={() => {
//                                 handleChange({
//                                   target: {
//                                     name: "teacherEmail",
//                                     value: teacher.email,
//                                   },
//                                 });
//                                 setIsTeacherDropdownOpen(false);
//                               }}
//                               className="flex items-center gap-3 px-4 py-2.5 hover:bg-indigo-50 cursor-pointer transition-colors"
//                             >
//                               <img
//                                 src={teacher.profilePic}
//                                 alt={teacher.name}
//                                 className="w-8 h-8 rounded-full object-cover border border-slate-200 shadow-sm"
//                               />
//                               <div className="flex flex-col">
//                                 <span className="text-sm font-medium text-slate-900">
//                                   {teacher.name}
//                                 </span>
//                                 <span className="text-xs text-slate-500">
//                                   {teacher.email}
//                                 </span>
//                               </div>
//                             </div>
//                           ));
//                         })()}
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               </div>

//               <div className="space-y-4">
//                 <h2 className="text-lg font-semibold text-slate-900 border-b border-slate-100 pb-2">
//                   Schedule & Financials
//                 </h2>
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                   <div className="space-y-1.5">
//                     <label className="text-sm font-medium text-slate-700">
//                       Start Date
//                     </label>
//                     <div className="relative">
//                       <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
//                         <Calendar className="h-5 w-5 text-slate-400" />
//                       </div>
//                       <input
//                         type="date"
//                         name="startDate"
//                         required
//                         value={formData.startDate}
//                         onChange={handleChange}
//                         className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
//                       />
//                     </div>
//                   </div>

//                   <div className="space-y-1.5">
//                     <label className="text-sm font-medium text-slate-700">
//                       Duration (Months)
//                     </label>
//                     <div className="relative">
//                       <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
//                         <Clock className="h-5 w-5 text-slate-400" />
//                       </div>
//                       <input
//                         type="number"
//                         name="duration"
//                         min="1"
//                         required
//                         placeholder="e.g., 3"
//                         value={formData.duration}
//                         onChange={handleChange}
//                         className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
//                       />
//                     </div>
//                   </div>

//                   <div className="space-y-1.5">
//                     <label className="text-sm font-medium text-slate-700">
//                       Course Fees
//                     </label>
//                     <div className="relative">
//                       <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
//                         <IndianRupee className="h-5 w-5 text-slate-400" />
//                       </div>
//                       <input
//                         type="number"
//                         name="fees"
//                         min="0"
//                         required
//                         placeholder="e.g., 1000"
//                         value={formData.fees}
//                         onChange={handleChange}
//                         className="block w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
//                       />
//                     </div>
//                   </div>

//                   <div className="space-y-1.5">
//                     <label className="text-sm font-medium text-slate-700">
//                       Expected End Date
//                     </label>
//                     <div className="flex items-center px-4 py-2.5 bg-indigo-50/50 border border-indigo-100 rounded-xl h-[46px]">
//                       <span
//                         className={`text-sm font-semibold ${calculatedEndDate ? "text-indigo-700" : "text-slate-400"}`}
//                       >
//                         {formatDateForDisplay(calculatedEndDate)}
//                       </span>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-4">
//                 <button
//                   type="button"
//                   onClick={() => navigate("/courses")}
//                   className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isLoading}
//                   className="inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-indigo-200"
//                 >
//                   {isLoading ? (
//                     <>
//                       <Loader2 className="w-5 h-5 animate-spin" />
//                       Creating...
//                     </>
//                   ) : (
//                     <>
//                       <Save className="w-5 h-5" />
//                       Create Course
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </>
//   );
// };

// export default CreateCourse;

import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Clock,
  IndianRupee,
  Save,
  Loader2,
  UserCheck,
  ChevronDown,
} from "lucide-react";
import useClassStore from "../../stores/useClassStore";
import useUserStore from "../../stores/useUserStore";
import toast from "react-hot-toast";
import BackButton from "../../components/UI/Button";
import { TRADES } from "../../constants/trades";
import useTradeStore from "../../stores/useTradeStore";

const CreateCourse = () => {
  const navigate = useNavigate();
  const { createClass, isLoading, error } = useClassStore();
  const { getTeachers, teachers } = useUserStore();
  const userLoading = useUserStore((state) => state.isLoading);
  const assignTradeToCourse = useTradeStore(
    (state) => state.assignTradeToCourse,
  );

  const [formData, setFormData] = useState({
    name: "",
    startDate: "",
    duration: 3,
    fees: "",
    teacherEmail: "",
    teacherName: "",
  });

  const [calculatedEndDate, setCalculatedEndDate] = useState(null);
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState("");

  useEffect(() => {
    getTeachers();
  }, [getTeachers]);

  useEffect(() => {
    if (formData.startDate && formData.duration) {
      const start = new Date(formData.startDate);
      start.setMonth(start.getMonth() + parseInt(formData.duration));
      setCalculatedEndDate(start);
    } else {
      setCalculatedEndDate(null);
    }
  }, [formData.startDate, formData.duration]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Map the trade with course name so it persists across browsers
    const selectedTrade = TRADES.find((t) => t.id === selectedTradeId);
    let finalName = formData.name;
    if (
      selectedTrade &&
      !finalName.toLowerCase().includes(selectedTrade.name.toLowerCase())
    ) {
      finalName = `${selectedTrade.name} - ${finalName}`;
    }

    const payload = {
      ...formData,
      name: finalName,
      duration: Number(formData.duration),
      fees: Number(formData.fees),
      endDate: calculatedEndDate
        ? calculatedEndDate.toISOString().split("T")[0]
        : null,
      tradeId: selectedTradeId || undefined,
    };

    try {
      const created = await createClass(payload);

      let newCourseId =
        created?._id || created?.data?._id || created?.data?.data?._id;

      if (!newCourseId) {
        await useClassStore.getState().getClasses();
        const classes = useClassStore.getState().allClass;
        const matched = classes?.find((c) => c.name === payload.name);
        newCourseId = matched?._id;
      }

      if (newCourseId && selectedTradeId) {
        assignTradeToCourse(newCourseId, selectedTradeId);
      }
      toast.success("Course Created Successfully");
      navigate("/courses");
    } catch (err) {
      console.error("Failed to create class", err);
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to create class",
      );
    }
  };

  const formatDateForDisplay = (dateObj) => {
    if (!dateObj) return "Select start date and duration";
    return dateObj.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <>
      {userLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-foreground font-medium animate-pulse">
            Loading teachers...
          </p>
        </div>
      )}

      <div className="min-h-screen bg-background p-6 md:p-8 flex justify-center items-start transition-colors duration-300">
        <div className="max-w-3xl w-full space-y-6">
          <BackButton details={`Add a new course offering to the institute.`} />
          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden relative">
            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  Basic Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">
                      Course Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <BookOpen className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder="e.g., Data Structures & Algorithms"
                        value={formData.name}
                        onChange={handleChange}
                        className="block w-full pl-11 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Custom Teacher Dropdown */}
                  <div className="space-y-1.5 md:col-span-2 relative">
                    <label className="text-sm font-medium text-foreground">
                      Assign Teacher
                    </label>
                    <div
                      onClick={() =>
                        setIsTeacherDropdownOpen(!isTeacherDropdownOpen)
                      }
                      className="relative flex items-center w-full pl-3.5 pr-10 py-2 bg-background border border-border rounded-xl text-foreground focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all cursor-pointer min-h-[46px]"
                    >
                      <UserCheck className="h-5 w-5 text-muted-foreground absolute left-3.5" />
                      <div className="ml-8 flex-1 truncate">
                        {formData.teacherEmail ? (
                          (() => {
                            const teacherList =
                              teachers?.data || teachers || [];
                            const selected = teacherList.find(
                              (t) => t.email === formData.teacherEmail,
                            );
                            return selected ? (
                              <div className="flex items-center gap-2">
                                <img
                                  src={
                                    selected.profilePic ||
                                    `https://ui-avatars.com/api/?name=${selected.name}&background=e0e7ff&color=4f46e5`
                                  }
                                  alt={selected.name}
                                  className="w-6 h-6 rounded-full object-cover border border-border"
                                />
                                <span className="font-medium text-foreground">
                                  {selected.name}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">
                                Select an instructor...
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-muted-foreground">
                            Select an instructor...
                          </span>
                        )}
                      </div>
                      <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                        <ChevronDown
                          className={`h-5 w-5 text-muted-foreground transition-transform ${isTeacherDropdownOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </div>

                    {isTeacherDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-xl shadow-lg max-h-60 overflow-auto py-1 animate-in fade-in slide-in-from-top-2">
                        {(() => {
                          const teacherList = teachers?.data || teachers || [];
                          if (teacherList.length === 0)
                            return (
                              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                No teachers found
                              </div>
                            );
                          return teacherList.map((teacher) => (
                            <div
                              key={teacher._id}
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  teacherEmail: teacher.email,
                                  teacherName: teacher.name,
                                }));
                                setIsTeacherDropdownOpen(false);
                              }}
                              className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/50 cursor-pointer transition-colors"
                            >
                              <img
                                src={
                                  teacher.profilePic ||
                                  `https://ui-avatars.com/api/?name=${teacher.name}&background=e0e7ff&color=4f46e5`
                                }
                                alt={teacher.name}
                                className="w-8 h-8 rounded-full object-cover border border-border shadow-sm"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-foreground">
                                  {teacher.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {teacher.email}
                                </span>
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">
                      Trade
                    </label>
                    <select
                      value={selectedTradeId}
                      onChange={(event) =>
                        setSelectedTradeId(event.target.value)
                      }
                      className="block w-full px-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="">Unassigned</option>
                      {TRADES.map((trade) => (
                        <option key={trade.id} value={trade.id}>
                          {trade.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                  Schedule & Financials
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Start Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                        type="date"
                        name="startDate"
                        required
                        value={formData.startDate}
                        onChange={handleChange}
                        className="block w-full pl-11 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Duration (Months)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                        type="number"
                        name="duration"
                        min="1"
                        required
                        placeholder="e.g., 3"
                        value={formData.duration}
                        onChange={handleChange}
                        className="block w-full pl-11 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Course Fees
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <IndianRupee className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <input
                        type="number"
                        name="fees"
                        min="0"
                        required
                        placeholder="e.g., 1000"
                        value={formData.fees}
                        onChange={handleChange}
                        className="block w-full pl-11 pr-4 py-2.5 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Expected End Date
                    </label>
                    <div className="flex items-center px-4 py-2.5 bg-primary/10 border border-primary/20 rounded-xl h-[46px]">
                      <span
                        className={`text-sm font-semibold ${calculatedEndDate ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {formatDateForDisplay(calculatedEndDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-border flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => navigate("/courses")}
                  className="px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center justify-center gap-2 bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-6 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-primary/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Create Course
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreateCourse;
