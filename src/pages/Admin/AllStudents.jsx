import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  Search,
  XCircle,
  AlertCircle,
  User,
  Check,
  Award,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MapPin,
  Phone,
  Hash,
} from "lucide-react";
import useUserStore from "../../stores/useUserStore";
import useClassStore from "../../stores/useClassStore";
import useAuthStore from "../../stores/useAuthStore";
import useBatchStore from "../../stores/useBatchStore";
import { getStudentId } from "../../util/getStudentId";
import {
  filterStudentsForTeacher,
  filterBatchesForTeacher,
} from "../../util/teacherAccessControl";
import { useNavigate } from "react-router-dom";

// --- Skeleton Loader Component ---
const StudentCardSkeleton = () => (
  <div className="bg-card rounded-2xl p-5 border border-border/60 shadow-sm flex flex-col gap-5 animate-pulse">
    {/* Top Header */}
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-muted shrink-0" />
        <div className="flex flex-col gap-2 w-full">
          <div className="h-5 w-32 bg-muted rounded" />
          <div className="h-4 w-48 bg-muted/60 rounded" />
        </div>
      </div>
      <div className="w-24 h-8 bg-muted rounded-md shrink-0 hidden sm:block" />
    </div>

    {/* Middle Section */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/20 p-4 rounded-xl border border-border/30">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-4 h-4 bg-muted rounded shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5 w-full">
            <div className="h-3 w-16 bg-muted/80 rounded" />
            <div className="h-4 w-24 bg-muted rounded" />
          </div>
        </div>
      ))}
    </div>

    {/* Bottom Section */}
    <div className="pt-4 border-t border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-muted rounded" />
        <div className="h-4 w-40 bg-muted rounded" />
      </div>
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="h-[72px] bg-muted/30 rounded-xl w-full border border-border/50"
          />
        ))}
      </div>
    </div>
  </div>
);

const StudentCard = ({
  student,
  index,
  classMap,
  progressMap,
  allStudents,
  onProgressUpdate,
  onShowToast,
  isBuildingMap,
  userRole,
}) => {
  const navigate = useNavigate();
  const [loadingToggles, setLoadingToggles] = useState({});
  const patchStudentProgress = useClassStore(
    (state) => state.getStudentProgress,
  );

  const studentId = getStudentId(student);

  const allEnrolledClassIds = (student.mainClasses || []).map(
    (cls) => cls._id || cls,
  );

  // Use all assigned classes to ensure missing progress docs still render UI
  const assignedClassIds = allEnrolledClassIds;
  const isTeacher = userRole === "Teacher"; // Defined role check

  // --- Card Click Navigation Handler ---
  const handleCardClick = () => {
    if (userRole === "Teacher") return;

    navigate("/studentprofile", {
      state: {
        userId: student._id,
        studentId: student._id,
        userData: student,
      },
    });
  };

  const handleToggle = async (clsId, fieldName, currentValue, label) => {
    const progressDoc = progressMap[`${student._id}_${clsId}`];

    if (!progressDoc || !progressDoc._id) return;

    const key = `${student._id}_${clsId}_${fieldName}`;
    setLoadingToggles((prev) => ({ ...prev, [key]: true }));

    const newValue = !currentValue;

    try {
      await patchStudentProgress(progressDoc._id, {
        [fieldName]: newValue,
      });

      onProgressUpdate(student._id, clsId, { [fieldName]: newValue });

      const statusText = newValue
        ? "marked as Complete"
        : "marked as Incomplete";
      if (onShowToast) {
        onShowToast(`"${label}" for ${student.name} ${statusText}.`);
      }
    } catch (error) {
      console.error("Failed to update progress:", error);
      if (onShowToast) {
        onShowToast(`Failed to update ${label} for ${student.name}.`, "error");
      }
    } finally {
      setLoadingToggles((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const renderStatusToggle = (clsId, fieldName, label) => {
    const progressDoc = progressMap[`${student._id}_${clsId}`];
    const isChecked = progressDoc?.[fieldName] || false;
    const isUpdating =
      loadingToggles[`${student._id}_${clsId}_${fieldName}`] || false;

    const isMissingData = !progressDoc;
    const isCertificate = fieldName === "certificateIssued";

    // --- Teacher Access Control ---
    const isAllowedForTeacher = fieldName === "batchcompletion";
    const isDisabledByRole = isTeacher && !isAllowedForTeacher;

    const isDisabled = isMissingData || isUpdating || isDisabledByRole;

    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (isDisabledByRole) {
            if (onShowToast)
              onShowToast(
                "Teachers can only update the Course End status.",
                "error",
              );
            return;
          }
          if (isMissingData) {
            if (onShowToast)
              onShowToast("The batch is not assigned yet.", "error");
            return;
          }
          if (isUpdating) return;
          handleToggle(clsId, fieldName, isChecked, label);
        }}
        className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 ${
          isDisabled
            ? "opacity-50 cursor-not-allowed border-border bg-background"
            : isCertificate && isChecked
              ? "bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white shadow-sm"
              : "border-border bg-background hover:bg-muted/50 text-foreground"
        }`}
      >
        {isUpdating ? (
          <Loader2
            className={`w-4 h-4 animate-spin ${isCertificate && isChecked ? "text-white" : "text-primary"}`}
          />
        ) : isCertificate ? (
          isChecked ? (
            <Award className="w-4 h-4 text-white" />
          ) : (
            <Check className="w-4 h-4 text-muted-foreground" />
          )
        ) : isChecked ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
          <XCircle className="w-4 h-4 text-muted-foreground" />
        )}

        <span
          className={`text-xs font-semibold ${isCertificate && isChecked ? "text-white" : "text-muted-foreground"}`}
        >
          {label}
        </span>
      </button>
    );
  };

  const fatherName =
    student.fatherName ||
    student.fathersName ||
    student.father_name ||
    student.fathername ||
    student.parentName ||
    "-";

  return (
    <div
      onClick={handleCardClick}
      className="bg-card hover:bg-muted/10 border border-border/60 hover:border-primary/40 rounded-2xl p-5 transition-all shadow-sm group cursor-pointer flex flex-col gap-5"
    >
      {/* Top Header: Avatar & Main Info */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {student.profilePic ? (
            <img
              src={student.profilePic}
              alt={student.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-muted bg-muted shrink-0 group-hover:border-primary/50 transition-colors"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src =
                  "https://ui-avatars.com/api/?name=" +
                  encodeURIComponent(student.name || "User") +
                  "&background=random";
              }}
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-lg uppercase group-hover:bg-primary/20 transition-colors">
              {student.name ? student.name.charAt(0) : <User size={24} />}
            </div>
          )}

          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {student.name || "Unnamed Student"}
            </h3>
            {!isTeacher && (
              <p className="text-sm text-muted-foreground break-all">
                {student.email}
              </p>
            )}
          </div>
        </div>

        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 bg-muted/30 sm:bg-transparent p-3 sm:p-0 rounded-lg">
          <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground bg-background sm:bg-muted/50 px-2.5 py-1 rounded-md border border-border/50">
            <span>ID : {studentId || "N/A"}</span>
          </div>
        </div>
      </div>

      {!isTeacher && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-muted/20 p-4 rounded-xl border border-border/30">
          <div className="flex items-start gap-3">
            <User className="w-4 h-4 text-primary/70 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">
                Father's Name
              </p>
              <p className="text-sm font-medium text-foreground truncate">
                {fatherName}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-primary/70 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Mobile</p>
              <p className="text-sm font-medium text-foreground truncate">
                {student.phone || "-"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-primary/70 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Address</p>
              <p className="text-sm font-medium text-foreground truncate">
                {student.address || "-"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section: Progress Tracker */}
      <div className="pt-2 border-t border-border/50">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary" />
          <h4 className="text-sm font-semibold text-foreground">
            Course Progress Tracker
          </h4>
        </div>

        {isBuildingMap ? (
          <div className="space-y-3 animate-pulse">
            {/* Skeleton Desktop Header */}
            <div
              className={`hidden lg:grid ${isTeacher ? "grid-cols-2" : "grid-cols-4"} gap-4 px-3 mb-2`}
            >
              <div className="h-3 bg-muted rounded w-20" />
              <div
                className={`h-3 bg-muted rounded w-20 ${isTeacher ? "ml-auto" : "mx-auto"}`}
              />
              {!isTeacher && (
                <>
                  <div className="h-3 bg-muted rounded w-20 mx-auto" />
                  <div className="h-3 bg-muted rounded w-24 mx-auto" />
                </>
              )}
            </div>

            {/* Skeleton Tracker Rows */}
            {assignedClassIds.length > 0
              ? assignedClassIds.map((clsId, i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-1 ${isTeacher ? "lg:grid-cols-2" : "lg:grid-cols-4"} gap-3 lg:gap-4 items-center bg-background p-3 lg:p-2.5 rounded-xl border border-border shadow-sm`}
                  >
                    <div className="h-4 bg-muted rounded w-32" />
                    <div
                      className={`grid gap-2 ${isTeacher ? "grid-cols-1" : "grid-cols-3 lg:col-span-3"}`}
                    >
                      <div className="h-[34px] bg-muted rounded-lg w-full" />
                      {!isTeacher && (
                        <>
                          <div className="h-[34px] bg-muted rounded-lg w-full" />
                          <div className="h-[34px] bg-muted rounded-lg w-full" />
                        </>
                      )}
                    </div>
                  </div>
                ))
              : // Fallback skeleton if assignedClassIds length is 0 while fetching
                [1, 2].map((i) => (
                  <div
                    key={i}
                    className={`grid grid-cols-1 ${isTeacher ? "lg:grid-cols-2" : "lg:grid-cols-4"} gap-3 lg:gap-4 items-center bg-background p-3 lg:p-2.5 rounded-xl border border-border shadow-sm`}
                  >
                    <div className="h-4 bg-muted rounded w-32" />
                    <div
                      className={`grid gap-2 ${isTeacher ? "grid-cols-1" : "grid-cols-3 lg:col-span-3"}`}
                    >
                      <div className="h-[34px] bg-muted rounded-lg w-full" />
                      {!isTeacher && (
                        <>
                          <div className="h-[34px] bg-muted rounded-lg w-full" />
                          <div className="h-[34px] bg-muted rounded-lg w-full" />
                        </>
                      )}
                    </div>
                  </div>
                ))}
          </div>
        ) : assignedClassIds.length === 0 ? (
          <div className="text-muted-foreground text-sm italic py-4 bg-muted/10 rounded-xl flex justify-center border border-dashed border-border">
            No active courses assigned
          </div>
        ) : (
          <div className="space-y-3">
            {/* Desktop Header for Tracker Grid */}
            <div
              className={`hidden lg:grid ${isTeacher ? "grid-cols-2" : "grid-cols-4"} gap-4 px-3 text-xs font-semibold text-muted-foreground`}
            >
              <span>Course Name</span>
              <span
                className={isTeacher ? "text-right lg:pr-4" : "text-center"}
              >
                Course Status
              </span>
              {!isTeacher && (
                <>
                  <span className="text-center">Exam Status</span>
                  <span className="text-center">Certificate Status</span>
                </>
              )}
            </div>

            {/* Tracker Items */}
            {assignedClassIds.map((clsId) => (
              <div
                key={clsId}
                className={`grid grid-cols-1 ${isTeacher ? "lg:grid-cols-2" : "lg:grid-cols-4"} gap-3 lg:gap-4 items-center bg-background p-3 lg:p-2.5 rounded-xl border border-border shadow-sm`}
              >
                <div className="flex items-center gap-2 lg:pr-2">
                  <div className="w-2 h-2 rounded-full bg-primary/50 shrink-0 lg:hidden" />
                  <span
                    className="text-sm font-medium text-foreground truncate"
                    title={classMap.get(clsId)}
                  >
                    {classMap.get(clsId) || "Unknown Course"}
                  </span>
                </div>
                <div
                  className={`grid gap-2 ${isTeacher ? "grid-cols-1" : "grid-cols-3 lg:col-span-3 lg:grid-cols-3"}`}
                >
                  {renderStatusToggle(clsId, "batchcompletion", "Course")}
                  {!isTeacher && (
                    <>
                      {renderStatusToggle(clsId, "examcompletion", "Exam")}
                      {renderStatusToggle(clsId, "certificateIssued", "Issued")}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const AllStudents = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [progressMap, setProgressMap] = useState({});
  const [isBuildingMap, setIsBuildingMap] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // User Store
  const students = useUserStore((state) => state.students);
  const getStudents = useUserStore((state) => state.getStudents);
  const isLoadingStudents = useUserStore((state) => state.isLoading);
  const studentError = useUserStore((state) => state.error);

  // Auth Store - for teacher access control
  const userRole = useAuthStore((state) => state.userRole);
  const userData = useAuthStore((state) => state.user);

  // Class Store
  const allClass = useClassStore((state) => state.allClass);
  const getClasses = useClassStore((state) => state.getClasses);
  const getClassById = useClassStore((state) => state.getClassById);

  // Batch Store
  const batches = useBatchStore((state) => state.batches);
  const fetchBatches = useBatchStore((state) => state.fetchBatches);

  useEffect(() => {
    getStudents();
    getClasses();
    fetchBatches();
  }, [getStudents, getClasses, fetchBatches]);

  // Filter students based on teacher's batches
  const filteredStudentsForTeacher = useMemo(() => {
    if (userRole === "Teacher") {
      const teacherBatches = filterBatchesForTeacher(
        batches,
        userData?.batches || [],
        userRole,
        userData?.email,
        userData?._id,
      );
      return filterStudentsForTeacher(students, teacherBatches, userRole);
    }
    return students;
  }, [students, userRole, userData, batches]);

  useEffect(() => {
    if (!filteredStudentsForTeacher?.length) return;

    const buildProgressMap = async () => {
      setIsBuildingMap(true);
      const uniqueClassIds = new Set();
      filteredStudentsForTeacher.forEach((student) => {
        (student.mainClasses || []).forEach((cls) =>
          uniqueClassIds.add(cls._id || cls),
        );
      });

      const newProgressMap = {};

      const fetchPromises = Array.from(uniqueClassIds).map(async (clsId) => {
        try {
          const classData = await getClassById(clsId);
          if (classData && classData.studentsProgress) {
            classData.studentsProgress.forEach((prog) => {
              const stdId = prog.student?._id || prog.student;
              newProgressMap[`${stdId}_${clsId}`] = prog;
            });
          }
        } catch (error) {
          console.error(`Failed to fetch progress for class ${clsId}`, error);
        }
      });

      await Promise.allSettled(fetchPromises);
      setProgressMap(newProgressMap);
      setIsBuildingMap(false);
    };

    buildProgressMap();
  }, [filteredStudentsForTeacher, getClassById]);

  const triggerToast = (message, type = "success") => {
    const toastId = Date.now();
    setToastMessage({ message, type, id: toastId });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.id === toastId ? null : prev));
    }, 5000);
  };

  const handleProgressUpdate = (studentId, classId, updatedFields) => {
    setProgressMap((prev) => {
      const key = `${studentId}_${classId}`;
      return {
        ...prev,
        [key]: { ...prev[key], ...updatedFields },
      };
    });
  };

  const classMap = useMemo(() => {
    const validClasses = Array.isArray(allClass) ? allClass : [];
    return new Map(validClasses.map((cls) => [cls._id, cls.name]));
  }, [allClass]);

  // Reset to first page whenever search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const filteredStudents = useMemo(() => {
    if (!Array.isArray(filteredStudentsForTeacher)) return [];
    const query = searchTerm.toLowerCase().trim();
    if (!query) return filteredStudentsForTeacher;

    return filteredStudentsForTeacher.filter((student) => {
      if (userRole === "Teacher") {
        const visibleStudentId = String(getStudentId(student) || "")
          .toLowerCase()
          .trim();
        return (
          student?.name?.toLowerCase().includes(query) ||
          visibleStudentId.includes(query)
        );
      }

      return (
        student?.name?.toLowerCase().includes(query) ||
        student?.email?.toLowerCase().includes(query) ||
        student?.phone?.toLowerCase().includes(query)
      );
    });
  }, [filteredStudentsForTeacher, searchTerm, userRole]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    in: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      variants={pageVariants}
      transition={{ duration: 0.3 }}
      className="min-h-full bg-background p-4 md:p-8 relative flex flex-col"
    >
      {/* Interactive Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 pl-4 pr-10 py-3 rounded-xl shadow-2xl border backdrop-blur-md font-medium text-sm ${
              toastMessage.type === "error"
                ? "bg-destructive/90 text-destructive-foreground border-destructive"
                : "bg-success/90 text-white border-success/20 dark:bg-emerald-600"
            }`}
          >
            {toastMessage.type === "error" ? (
              <AlertCircle size={18} />
            ) : (
              <CheckCircle2 size={18} />
            )}
            <span>{toastMessage.message}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-black/15 transition-colors focus:outline-none"
              aria-label="Close notification"
            >
              <X
                size={14}
                className="text-current opacity-80 hover:opacity-100"
              />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1600px] mx-auto w-full flex flex-col gap-6">
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 relative">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Student Directory
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage enrollments and track progress across all students.
            </p>
          </div>

          {/* Sticky Search Bar (Mobile specific sticky styling) */}
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md py-2 md:py-0 w-full md:max-w-md shrink-0 md:relative md:z-auto">
            <div className="relative group w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder={
                  userRole === "Teacher"
                    ? "Search by name or student ID..."
                    : "Search by name, email, or phone..."
                }
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-12 py-3 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              />
              {/* INSTANT CLEAR BUTTON */}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-destructive transition-colors focus:outline-none"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {studentError && (
          <div className="shrink-0 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive flex items-center gap-3 font-medium">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{studentError}</p>
          </div>
        )}

        {/* LOADING & DATA DISPLAY */}
        {isLoadingStudents ? (
          <div className="flex flex-col relative pb-4">
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((skeletonIndex) => (
                <StudentCardSkeleton key={skeletonIndex} />
              ))}
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border border-dashed p-16 flex flex-col items-center justify-center text-muted-foreground">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p className="text-lg font-medium text-foreground">
              No students found
            </p>
            <p className="text-sm mt-1">
              {searchTerm
                ? "Try adjusting your search criteria."
                : "No students available at the moment."}
            </p>
          </div>
        ) : (
          /* CARD LIST SECTION - Flows naturally to prevent gap */
          <div className="flex flex-col relative pb-4">
            {isBuildingMap && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-primary/10 overflow-hidden z-20 rounded-full mb-4">
                <div className="h-full bg-primary w-1/3 animate-[slide_1.5s_ease-in-out_infinite]" />
              </div>
            )}

            <div className="flex flex-col gap-4">
              {paginatedStudents.map((student, index) => (
                <StudentCard
                  key={student._id || index}
                  student={student}
                  index={startIndex + index}
                  classMap={classMap}
                  progressMap={progressMap}
                  allStudents={students}
                  onProgressUpdate={handleProgressUpdate}
                  onShowToast={triggerToast}
                  isBuildingMap={isBuildingMap}
                  userRole={userRole}
                />
              ))}
            </div>
          </div>
        )}

        {/* PAGINATION SECTION */}
        {!isLoadingStudents && totalPages > 1 && (
          <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 py-2 border-t border-border mt-2 pt-4">
            <p className="text-sm text-muted-foreground order-2 sm:order-1">
              Showing{" "}
              <span className="font-medium text-foreground">
                {startIndex + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {Math.min(startIndex + itemsPerPage, filteredStudents.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {filteredStudents.length}
              </span>{" "}
              students
            </p>

            <div className="flex items-center gap-2 order-1 sm:order-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-none no-scrollbar">
                {getPageNumbers().map((number) => (
                  <button
                    key={number}
                    onClick={() => setCurrentPage(number)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                      currentPage === number
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border border-border text-foreground hover:bg-muted"
                    }`}
                  >
                    {number}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AllStudents;
