import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
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
  Briefcase,
} from "lucide-react";
import useClassStore from "../../stores/useClassStore";
import useUserStore from "../../stores/useUserStore";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { generateSlug } from "../../util/generateSlug";
import useTradeStore from "../../stores/useTradeStore";
import { TRADES, getTradeLabel } from "../../constants/trades";

const CourseDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Extract data from the hidden routing state
  const courseId = location.state?.courseId;
  const displayCourseName = location.state?.courseName || "Course Details";

  // Class Store
  const getClassById = useClassStore((state) => state.getClassById);
  const getStudentProgress = useClassStore((state) => state.getStudentProgress);
  const removeStudentInClass = useClassStore(
    (state) => state.removeStudentInClass,
  );
  const updateClass = useClassStore((state) => state.updateClass);
  const deleteClass = useClassStore((state) => state.deleteClass);
  const isLoading = useClassStore((state) => state.isLoading);
  const courseTradeMap = useTradeStore((state) => state.courseTradeMap);
  const assignTradeToCourse = useTradeStore(
    (state) => state.assignTradeToCourse,
  );
  const getTradeFromCourseName = useTradeStore(
    (state) => state.getTradeFromCourseName,
  );

  // User Store (for Instructors)
  const getTeachers = useUserStore((state) => state.getTeachers);
  const rawTeachers = useUserStore((state) => state.teachers);
  const teachers = Array.isArray(rawTeachers)
    ? rawTeachers
    : rawTeachers?.data || [];

  const [courseData, setCourseData] = useState(null);
  const [localError, setLocalError] = useState(null);
  const [loadingKeys, setLoadingKeys] = useState({});
  const [studentSearchTerm, setStudentSearchTerm] = useState("");

  const [activeDropdown, setActiveDropdown] = useState(null);
  const [studentToRemove, setStudentToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Edit states
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

  // Delete course states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingCourse, setIsDeletingCourse] = useState(false);

  const pageVariants = {
    initial: { opacity: 0, y: 20, scale: 0.98 },
    in: { opacity: 1, y: 0, scale: 1 },
    out: { opacity: 0, y: 20, scale: 0.98 },
  };

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) {
        navigate("/courses");
        return;
      }
      try {
        const data = await getClassById(courseId);
        setCourseData(data);
      } catch (err) {
        setLocalError("Failed to load course details. Please try again.");
      }
    };
    fetchCourseDetails();

    // Fetch teachers for the edit dropdown if not already loaded
    if (getTeachers && teachers.length === 0) {
      getTeachers();
    }
  }, [courseId, getClassById, navigate, getTeachers]);

  // Close teacher dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        teacherDropdownRef.current &&
        !teacherDropdownRef.current.contains(event.target)
      ) {
        setIsTeacherDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleOpenEditModal = () => {
    const { mainClass } = courseData;
    const initialTeachers =
      mainClass?.teachers?.map((t) =>
        typeof t === "object" && t !== null ? t._id : t,
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
  };

  const handleEditFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;

    setEditFormData((prev) => {
      const updatedData = { ...prev, [name]: newValue };

      // Recalculate endDate when startDate or duration changes
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
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setIsUpdatingCourse(true);
    try {
      // Map the trade with course name for cross browser persistence
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

      // Save trade to local store
      if (editFormData.tradeId !== undefined) {
        assignTradeToCourse(courseData.mainClass._id, editFormData.tradeId);
      }

      // Optimistically update the UI state
      setCourseData((prevData) => ({
        ...prevData,
        mainClass: {
          ...prevData.mainClass,
          ...payload,
        },
      }));

      toast.success("Course details updated successfully!");
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update course", error);
      toast.error(
        error.response?.data?.message || "Failed to update course details.",
      );
    } finally {
      setIsUpdatingCourse(false);
    }
  };

  const handleDeleteCourse = async () => {
    setIsDeletingCourse(true);
    try {
      await deleteClass(courseData.mainClass._id);
      toast.success("Course deleted successfully!");
      navigate("/courses", { replace: true });
    } catch (error) {
      console.error("Failed to delete course", error);
      toast.error(error.response?.data?.message || "Failed to delete course.");
      setIsDeletingCourse(false);
    }
  };

  const handleStatusToggle = async (recordId, fieldName, currentValue) => {
    const updateKey = `${recordId}-${fieldName}`;
    setLoadingKeys((prev) => ({ ...prev, [updateKey]: true }));

    try {
      await getStudentProgress(recordId, { [fieldName]: !currentValue });
      setCourseData((prevData) => {
        const updatedProgress = prevData.studentsProgress.map((record) => {
          if (record._id === recordId) {
            return { ...record, [fieldName]: !currentValue };
          }
          return record;
        });
        return { ...prevData, studentsProgress: updatedProgress };
      });
      toast.success("Status update successfully !!");
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
  };

  const handleConfirmRemove = async () => {
    if (!studentToRemove) return;
    setIsRemoving(true);

    try {
      await removeStudentInClass({
        mainClassId: courseData.mainClass._id,
        studentId: studentToRemove.student._id,
      });

      setCourseData((prevData) => {
        const updatedProgress = prevData.studentsProgress.filter(
          (record) => record?.student?._id !== studentToRemove?.student?._id,
        );

        const updatedMainClassStudents =
          prevData.mainClass?.students?.filter(
            (s) => s?._id !== studentToRemove?.student?._id,
          ) || [];

        return {
          ...prevData,
          studentsProgress: updatedProgress,
          mainClass: {
            ...prevData.mainClass,
            students: updatedMainClassStudents,
          },
        };
      });
      toast.success("Student Removed Successfully !!");
      setStudentToRemove(null);
    } catch (err) {
      console.error("Failed to remove student", err);
      toast.error(err.response?.data?.message || "Failed to remove student.");
    } finally {
      setIsRemoving(false);
    }
  };

  if (isLoading || (!courseData && !localError)) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-lg">Loading {displayCourseName}...</p>
      </div>
    );
  }

  if (localError) {
    return (
      <div className="p-8">
        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-2xl max-w-2xl mx-auto text-center">
          <p className="font-medium">{localError}</p>
          <button
            onClick={handleBack}
            className="mt-4 px-4 py-2 bg-destructive/20 rounded-lg hover:bg-destructive/30 transition font-medium"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const { mainClass, studentsProgress } = courseData;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const ToggleButton = ({ recordId, fieldName, status }) => {
    const isUpdating = !!loadingKeys[`${recordId}-${fieldName}`];

    return (
      <button
        onClick={() => handleStatusToggle(recordId, fieldName, status)}
        disabled={isUpdating}
        className="p-1.5 rounded-lg hover:bg-muted transition-colors disabled:opacity-50 group flex items-center justify-center mx-auto"
        title={`Toggle ${fieldName}`}
      >
        {isUpdating ? (
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        ) : status ? (
          <CheckCircle2 className="w-5 h-5 text-success group-hover:opacity-80 transition-opacity" />
        ) : (
          <Circle className="w-5 h-5 text-muted-foreground/40 group-hover:text-muted-foreground/70 transition-colors" />
        )}
      </button>
    );
  };

  const filteredStudents =
    studentsProgress?.filter((record) => {
      const searchLower = studentSearchTerm.toLowerCase();
      return (
        record?.student?.name?.toLowerCase().includes(searchLower) ||
        record?.student?.email?.toLowerCase().includes(searchLower) ||
        record?.rollno?.toString().includes(searchLower)
      );
    }) || [];

  return (
    <>
      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-background p-6 md:p-8 transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2.5 bg-card border border-border rounded-xl hover:bg-muted hover:text-primary transition-colors shadow-sm"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div>
                <p className="text-muted-foreground flex items-center gap-2 mt-1">
                  <span
                    className={`w-2 h-2 rounded-full ${mainClass?.isActive ? "bg-success" : "bg-destructive"}`}
                  ></span>
                  {mainClass?.isActive ? "Active Course" : "Inactive Course"} •
                  Created on {formatDate(mainClass?.createdAt)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-card border border-destructive/30 text-destructive rounded-xl hover:bg-destructive/10 transition-colors shadow-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={handleOpenEditModal}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 transition-opacity shadow-sm font-medium"
              >
                <Edit className="w-4 h-4" />
                Edit Course
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm col-span-1 md:col-span-2 space-y-6">
              <h1 className="text-2xl md:text-3xl font-bold text-foreground capitalize">
                {mainClass?.name || displayCourseName}
              </h1>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 w-max rounded-lg text-sm font-medium text-primary border border-primary/20 mt-2 mb-4">
                <Briefcase className="w-4 h-4" />
                {getTradeLabel(
                  courseTradeMap[mainClass?._id] ||
                    mainClass?.tradeId ||
                    getTradeFromCourseName(mainClass?.name),
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> Start Date
                  </span>
                  <p className="font-medium text-foreground">
                    {formatDate(mainClass?.startDate)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" /> End Date
                  </span>
                  <p className="font-medium text-foreground">
                    {formatDate(mainClass?.endDate)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                    <Clock className="w-4 h-4" /> Duration
                  </span>
                  <p className="font-medium text-foreground">
                    {mainClass?.duration || 0} Months
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                    <IndianRupee className="w-4 h-4" /> Fees
                  </span>
                  <p className="font-medium text-primary">
                    ₹{mainClass?.fees || 0}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-sm font-medium text-muted-foreground mb-3">
                  Instructor Details
                </h3>
                {mainClass?.teachers && mainClass.teachers.length > 0 ? (
                  <div className="space-y-3">
                    {mainClass.teachers.map((teacher, idx) => (
                      <div
                        key={teacher._id || idx}
                        className="flex items-center gap-6 bg-muted/30 p-4 rounded-xl border border-border"
                      >
                        <div>
                          <p className="font-bold text-foreground">
                            {teacher.name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Mail className="w-3.5 h-3.5" />{" "}
                            {teacher.email || "No Email Provided"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-6 bg-muted/30 p-4 rounded-xl border border-border">
                    <div>
                      <p className="font-bold text-foreground">Unassigned</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card p-6 rounded-2xl border border-border shadow-sm space-y-6">
              <h2 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                Batches & Capacity
              </h2>
              <div className="flex items-center gap-4 bg-primary/10 border border-primary/20 text-primary p-4 rounded-xl">
                <Users className="w-8 h-8 text-primary bg-card p-1.5 rounded-lg shadow-sm border border-primary/10" />
                <div>
                  <p className="text-2xl font-bold">
                    {mainClass?.students?.length || 0}
                  </p>
                  <p className="text-sm font-medium opacity-80">
                    Total Students Enrolled
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Assigned Batches
                </h3>
                <div className="space-y-2">
                  {mainClass?.batches?.map((batch) => (
                    <div
                      key={batch?._id || Math.random()}
                      onClick={() =>
                        navigate(`/batches/${generateSlug(batch?.name)}`, {
                          state: {
                            batchId: batch._id,
                            batchName: batch.name,
                          },
                        })
                      }
                      className="px-3 py-2 text-sm bg-muted/30 border border-border rounded-lg text-foreground font-medium flex items-center gap-2 cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                      {batch?.name}
                    </div>
                  ))}
                  {(!mainClass?.batches || mainClass.batches.length === 0) && (
                    <p className="text-sm text-muted-foreground italic">
                      No batches assigned yet.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Student Progress Table */}
          <div className="bg-card rounded-2xl border border-border shadow-sm overflow-visible">
            <div className="p-6 border-b border-border bg-card flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 rounded-t-2xl">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <GraduationCap className="text-primary" />
                Student Progress Tracker
              </h2>

              {studentsProgress?.length > 0 && (
                <div className="relative w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={studentSearchTerm}
                    onChange={(e) => setStudentSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 bg-background border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  />
                </div>
              )}
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-muted/50 text-muted-foreground border-b border-border">
                  <tr>
                    <th className="px-6 py-4 font-semibold w-16">Roll No</th>
                    <th className="px-6 py-4 font-semibold">Student Info</th>
                    <th className="px-6 py-4 font-semibold">Join Date</th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Batch Status
                    </th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Exam Cleared
                    </th>
                    <th className="px-6 py-4 font-semibold text-center">
                      Certificate
                    </th>
                    <th className="px-6 py-4 font-semibold text-center w-16">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50 pb-20">
                  {studentsProgress?.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-12 text-center text-muted-foreground"
                      >
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Users className="w-8 h-8 opacity-50" />
                          <p>No students enrolled in this course yet.</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredStudents.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-12 text-center text-muted-foreground"
                      >
                        <p>No students match your search term.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((record) => (
                      <tr
                        key={record?._id || Math.random()}
                        className="hover:bg-muted/30 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
                            #{record?.rollno || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-bold text-foreground">
                            {record?.student?.name || "Unknown Student"}
                          </p>
                          <div className="flex items-center gap-3 text-muted-foreground text-xs mt-1">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />{" "}
                              {record?.student?.email || "No Email"}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />{" "}
                              {record?.student?.phone || "No Phone"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {formatDate(record?.joinDate)}
                        </td>

                        <td className="px-6 py-4 align-middle text-center">
                          <ToggleButton
                            recordId={record?._id}
                            fieldName="batchcompletion"
                            status={record?.batchcompletion}
                          />
                        </td>
                        <td className="px-6 py-4 align-middle text-center">
                          <ToggleButton
                            recordId={record?._id}
                            fieldName="examcompletion"
                            status={record?.examcompletion}
                          />
                        </td>
                        <td className="px-6 py-4 align-middle text-center">
                          <ToggleButton
                            recordId={record?._id}
                            fieldName="certificateIssued"
                            status={record?.certificateIssued}
                          />
                        </td>

                        <td className="px-6 py-4 align-middle text-center relative">
                          {activeDropdown === record?._id && (
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActiveDropdown(null)}
                            />
                          )}

                          <button
                            onClick={() =>
                              setActiveDropdown(
                                activeDropdown === record?._id
                                  ? null
                                  : record?._id,
                              )
                            }
                            className={`p-1.5 rounded-lg transition-colors relative z-20 ${
                              activeDropdown === record?._id
                                ? "bg-primary/10 text-primary"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          <AnimatePresence>
                            {activeDropdown === record?._id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                transition={{ duration: 0.15 }}
                                className="absolute right-10 top-10 w-40 bg-card border border-border rounded-xl shadow-xl z-30 overflow-hidden"
                              >
                                <button
                                  onClick={() => {
                                    setStudentToRemove(record);
                                    setActiveDropdown(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove Student
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Course Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
            >
              <button
                onClick={() => !isDeletingCourse && setIsDeleteModalOpen(false)}
                className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Delete Course?
                </h3>
                <p className="text-muted-foreground mb-1">
                  Are you sure you want to delete{" "}
                  <strong className="text-foreground">{mainClass?.name}</strong>
                  ?
                </p>
                <p className="text-sm text-destructive font-medium">
                  This action cannot be undone. All batches and student progress
                  records linked to this course will be permanently removed.
                </p>
              </div>

              <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  disabled={isDeletingCourse}
                  className="px-4 py-2 font-semibold text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCourse}
                  disabled={isDeletingCourse}
                  className="px-4 py-2 font-semibold text-destructive-foreground bg-destructive hover:opacity-90 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-destructive/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
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

      {/* Remove Student Modal */}
      <AnimatePresence>
        {studentToRemove && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative"
            >
              <button
                onClick={() => !isRemoving && setStudentToRemove(null)}
                className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">
                  Remove Student?
                </h3>
                <p className="text-muted-foreground mb-1">
                  Are you sure you want to remove{" "}
                  <strong className="text-foreground">
                    {studentToRemove?.student?.name || "this student"}
                  </strong>{" "}
                  from this course?
                </p>
                <p className="text-sm text-destructive font-medium">
                  This action cannot be undone. Progress tracking will be lost.
                </p>
              </div>

              <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3">
                <button
                  onClick={() => setStudentToRemove(null)}
                  disabled={isRemoving}
                  className="px-4 py-2 font-semibold text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmRemove}
                  disabled={isRemoving}
                  className="px-4 py-2 font-semibold text-destructive-foreground bg-destructive hover:opacity-90 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-destructive/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
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

      {/* Edit Course Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden relative max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                  <Edit className="w-5 h-5 text-primary" />
                  Edit Course Details
                </h3>
                <button
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
                      <label className="text-sm font-medium text-foreground">
                        Course Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        value={editFormData.name}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="startDate"
                        required
                        value={editFormData.startDate}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">
                        Duration (Months)
                      </label>
                      <input
                        type="number"
                        name="duration"
                        required
                        min="1"
                        value={editFormData.duration}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground flex justify-between items-center">
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
                        className="w-full px-3 py-2 border border-border bg-muted/50 text-muted-foreground rounded-lg cursor-not-allowed focus:outline-none focus:ring-0"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-foreground">
                        Fees (₹)
                      </label>
                      <input
                        type="number"
                        name="fees"
                        required
                        min="0"
                        value={editFormData.fees}
                        onChange={handleEditFormChange}
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    {/* Custom Instructor Dropdown */}
                    <div
                      className="space-y-1.5 md:col-span-2 relative"
                      ref={teacherDropdownRef}
                    >
                      <label className="text-sm font-medium text-foreground">
                        Assign Instructor
                      </label>
                      <div
                        className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-primary/20 focus:border-primary hover:bg-muted/50 transition-colors min-h-[42px]"
                        onClick={() =>
                          setIsTeacherDropdownOpen(!isTeacherDropdownOpen)
                        }
                      >
                        {editFormData.teachers?.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {editFormData.teachers.map((teacherId) => {
                              const selectedTeacher = teachers?.find(
                                (t) => t._id === teacherId,
                              );
                              if (!selectedTeacher) return null;
                              return (
                                <div
                                  key={teacherId}
                                  className="flex items-center gap-1.5 bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-medium"
                                >
                                  {selectedTeacher.name}
                                  <span
                                    className="cursor-pointer hover:text-destructive transition-colors ml-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditFormData((prev) => ({
                                        ...prev,
                                        teachers: prev.teachers.filter(
                                          (id) => id !== teacherId,
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
                            className="absolute z-50 top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl max-h-56 overflow-y-auto"
                          >
                            {teachers?.length > 0 ? (
                              teachers.map((teacher) => {
                                const isSelected =
                                  editFormData.teachers?.includes(teacher._id);
                                return (
                                  <div
                                    key={teacher._id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditFormData((prev) => {
                                        const newTeachers = isSelected
                                          ? prev.teachers.filter(
                                              (id) => id !== teacher._id,
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
                                    className={`px-4 py-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3 transition-colors border-b last:border-0 border-border/50 ${isSelected ? "bg-primary/5" : ""}`}
                                  >
                                    <div className="w-8 h-8 rounded-full bg-primary/20 flex flex-shrink-0 items-center justify-center text-sm font-bold text-primary overflow-hidden">
                                      {teacher?.profilePic ? (
                                        <img
                                          src={teacher?.profilePic}
                                          alt={teacher?.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        teacher.name?.charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div className="flex flex-col flex-1">
                                      <span className="text-sm font-semibold text-foreground">
                                        {teacher.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground">
                                        {teacher.email}
                                      </span>
                                    </div>
                                    {isSelected && (
                                      <CheckCircle2 className="w-4 h-4 text-primary" />
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

                    <div className="md:col-span-2 mt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={editFormData.isActive}
                          onChange={handleEditFormChange}
                          className="w-4 h-4 text-primary rounded border-border focus:ring-primary bg-background"
                        />
                        <span className="text-sm font-medium text-foreground">
                          Course is Active
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-sm font-medium text-foreground">
                      Trade
                    </label>
                    <select
                      name="tradeId"
                      value={editFormData.tradeId}
                      onChange={handleEditFormChange}
                      className="w-full px-3 py-2 border border-border bg-background text-foreground rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none cursor-pointer"
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

              <div className="p-4 border-t border-border bg-muted/30 flex justify-end gap-3 rounded-b-2xl">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isUpdatingCourse}
                  className="px-4 py-2 font-semibold text-foreground hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="editCourseForm"
                  disabled={isUpdatingCourse}
                  className="px-5 py-2 font-semibold text-primary-foreground bg-primary hover:opacity-90 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0"
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

export default CourseDetails;
