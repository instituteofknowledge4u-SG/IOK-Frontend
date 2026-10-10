import React, {
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  Loader2,
  Search,
  AlertCircle,
  User,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  MapPin,
  Phone,
  ArrowUp,
  RefreshCw,
  Mail,
  GraduationCap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

import useUserStore from "../../stores/useUserStore";
import useClassStore from "../../stores/useClassStore";
import useAuthStore from "../../stores/useAuthStore";
import useBatchStore from "../../stores/useBatchStore";
import { getStudentId } from "../../util/getStudentId";
import {
  filterStudentsForTeacher,
  filterBatchesForTeacher,
} from "../../util/teacherAccessControl";
import { generateSlug } from "../../util/generateSlug";

// ==========================================
// 1. GLOBAL CACHE
// ==========================================
let globalProgressMapCache = {};
let isProgressMapBuilt = false;
let cachedStudentCount = 0;

// ==========================================
// 2. HELPER FUNCTIONS FOR AVATAR
// ==========================================
export const getInitials = (name) => {
  if (!name) return "";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export const getAvatarColor = (name) => {
  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-orange-500",
    "bg-cyan-500",
  ];
  if (!name) return "bg-primary";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const ToastNotification = React.memo(({ toast, onClose }) => (
  <AnimatePresence>
    {toast && (
      <motion.div
        initial={{ opacity: 0, y: -20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className={`fixed top-6 right-6 z-[9999] flex items-center gap-3 pl-4 pr-10 py-3.5 rounded-lg shadow-xl border backdrop-blur-md font-medium text-sm ${
          toast.type === "error"
            ? "bg-destructive text-destructive-foreground border-destructive/20"
            : "bg-emerald-600 text-white border-emerald-500"
        }`}
      >
        {toast.type === "error" ? (
          <AlertCircle size={18} />
        ) : (
          <CheckCircle2 size={18} />
        )}
        <span>{toast.message}</span>
        <button
          onClick={onClose}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-black/20 transition-colors focus:outline-none"
        >
          <X size={14} className="text-current opacity-90 hover:opacity-100" />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
));

export const DirectoryHeader = React.memo(
  ({
    isScrolled,
    userRole,
    searchTerm,
    onSearchChange,
    onRefresh,
    isRefreshing,
  }) => (
    <div
      className={`sticky top-0 z-40 flex flex-col md:flex-row md:items-end justify-between gap-4 px-6 md:px-10 pb-4 transition-all duration-300 ${
        isScrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-sm pt-4"
          : "bg-background/90 backdrop-blur-xl border-b border-transparent pt-4 md:pt-8"
      }`}
    >
      {/* Hidden on mobile, visible on medium+ screens */}
      <div className="hidden md:block flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Student Directory
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage enrollments, track academic progress, and view student
          profiles.
        </p>
      </div>

      <div className="w-full md:w-[400px] shrink-0 flex gap-2">
        <div className="relative group w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder={
              userRole === "Teacher"
                ? "Search by name or ID..."
                : "Search by name, email, ID..."
            }
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-10 py-2.5 bg-background border border-border hover:border-border/80 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Data"
          className="px-3 py-2.5 bg-background border border-border rounded-lg text-foreground hover:bg-muted disabled:opacity-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-center shrink-0"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? "animate-spin text-primary" : "text-muted-foreground"}`}
          />
        </button>
      </div>
    </div>
  ),
);

export const EmptyState = React.memo(({ isSearchActive }) => (
  <div className="bg-background rounded-xl border border-border/60 border-dashed p-16 flex flex-col items-center justify-center text-muted-foreground">
    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
      <Search className="w-8 h-8 text-muted-foreground/50" />
    </div>
    <h3 className="text-lg font-semibold text-foreground tracking-tight">
      No students found
    </h3>
    <p className="text-sm mt-1 text-center max-w-sm">
      {isSearchActive
        ? "We couldn't find any students matching your search criteria. Try a different term."
        : "There are no students available in the directory at the moment."}
    </p>
  </div>
));

export const ScrollToTopButton = React.memo(({ isVisible, onScrollTop }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.button
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        onClick={onScrollTop}
        className="fixed bottom-20 md:bottom-24 right-8 z-50 p-2.5 bg-foreground text-background rounded-full shadow-lg hover:scale-105 transition-all focus:outline-none"
      >
        <ArrowUp className="w-5 h-5" />
      </motion.button>
    )}
  </AnimatePresence>
));

export const Pagination = React.memo(
  ({
    currentPage,
    totalPages,
    startIndex,
    itemsPerPage,
    totalItems,
    onPageChange,
  }) => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
      const pages = [];
      if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
        return pages;
      }
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          "...",
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages,
        );
      } else {
        pages.push(
          1,
          "...",
          currentPage - 1,
          currentPage,
          currentPage + 1,
          "...",
          totalPages,
        );
      }
      return pages;
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
        <p className="text-sm text-muted-foreground order-2 sm:order-1">
          Showing{" "}
          <span className="font-medium text-foreground">{startIndex + 1}</span>{" "}
          to{" "}
          <span className="font-medium text-foreground">
            {Math.min(startIndex + itemsPerPage, totalItems)}
          </span>{" "}
          of <span className="font-medium text-foreground">{totalItems}</span>{" "}
          results
        </p>

        <div className="flex items-center gap-1 order-1 sm:order-2">
          <button
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-md border border-transparent text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((number, idx) =>
              number === "..." ? (
                <span
                  key={`ellipsis-${idx}`}
                  className="w-8 flex justify-center text-muted-foreground text-sm"
                >
                  ...
                </span>
              ) : (
                <button
                  key={number}
                  onClick={() => onPageChange(number)}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                    currentPage === number
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  {number}
                </button>
              ),
            )}
          </div>

          <button
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-md border border-transparent text-foreground hover:bg-muted disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  },
);

export const StudentCardSkeleton = () => (
  <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col gap-6 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
      <div className="flex flex-col gap-2 w-full max-w-[200px]">
        <div className="h-4 w-full bg-muted rounded" />
        <div className="h-3 w-2/3 bg-muted/60 rounded" />
      </div>
    </div>
    <div className="h-px w-full bg-border/50" />
    <div className="space-y-3">
      {[1, 2].map((i) => (
        <div key={i} className="h-12 bg-muted/30 rounded-lg w-full" />
      ))}
    </div>
  </div>
);

export const StudentCard = React.memo(
  ({
    student,
    classMap,
    progressMap,
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
    const assignedClassIds = (student.mainClasses || []).map(
      (cls) => cls._id || cls,
    );
    const isTeacher = userRole === "Teacher";
    const fatherName =
      student.fatherName || student.fathersName || student.parentName || "-";

    const initials = getInitials(student.name);
    const avatarColor = getAvatarColor(student.name);

    // const handleCardClick = () => {
    // if (isTeacher) return;
    //   navigate("/students/studentprofile", {
    //     state: { userId: student._id, studentId: student._id, userData: student },
    //   });
    // };

    const handleCardClick = (student) => {
      if (isTeacher) return;
      navigate(`/profile/${generateSlug(student?.name)}`, {
        state: {
          userId: student?._id,
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
        await patchStudentProgress(progressDoc._id, { [fieldName]: newValue });
        onProgressUpdate(student._id, clsId, { [fieldName]: newValue });

        const statusText = newValue ? "Completed" : "Pending";
        if (onShowToast) onShowToast(`${label} marked as ${statusText}.`);
      } catch (error) {
        console.error("Failed update:", error);
        if (onShowToast) onShowToast(`Failed to update ${label}.`, "error");
      } finally {
        setLoadingToggles((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    };

    const InteractiveBadge = ({ clsId, fieldName, label }) => {
      const progressDoc = progressMap[`${student._id}_${clsId}`];
      const isChecked = progressDoc?.[fieldName] || false;
      const isUpdating =
        loadingToggles[`${student._id}_${clsId}_${fieldName}`] || false;

      const isMissingData = !progressDoc;
      const isAllowedForTeacher = fieldName === "batchcompletion";
      const isDisabledByRole = isTeacher && !isAllowedForTeacher;
      const isDisabled = isMissingData || isUpdating || isDisabledByRole;

      const handleClick = (e) => {
        e.stopPropagation();
        if (isDisabledByRole) {
          if (onShowToast)
            onShowToast("Teachers can only edit Course status.", "error");
          return;
        }
        if (isMissingData) {
          if (onShowToast) onShowToast("Batch is not assigned yet.", "error");
          return;
        }
        if (isUpdating) return;
        handleToggle(clsId, fieldName, isChecked, label);
      };

      return (
        <button
          type="button"
          onClick={handleClick}
          disabled={isDisabled}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
            isDisabled
              ? "opacity-50 cursor-not-allowed bg-muted text-muted-foreground border border-transparent"
              : isChecked
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 shadow-sm"
                : "bg-background text-muted-foreground border border-border hover:bg-muted hover:text-foreground shadow-sm"
          }`}
        >
          {isUpdating ? (
            <Loader2 size={13} className="animate-spin" />
          ) : isChecked ? (
            <Check
              size={13}
              className={
                isDisabled
                  ? "text-muted-foreground"
                  : "text-emerald-600 dark:text-emerald-400"
              }
            />
          ) : (
            <div className="w-3 h-3 rounded-full border-[1.5px] border-current opacity-70" />
          )}
          {label}
        </button>
      );
    };

    return (
      <div
        onClick={() => handleCardClick(student)}
        className={`bg-card rounded-xl border border-border shadow-sm transition-all duration-200 ${!isTeacher && "cursor-pointer hover:border-primary/30 hover:shadow-md"} p-6 flex flex-col gap-5`}
      >
        {/* Header section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {student.profilePic ? (
              <img
                src={student.profilePic}
                alt={student.name}
                className="w-12 h-12 rounded-full object-cover border border-border bg-muted shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  // Graceful fallback to initial API if actual image fails
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials || "User")}&background=random&color=fff`;
                }}
              />
            ) : (
              <div
                className={`w-12 h-12 rounded-full ${avatarColor} text-white flex items-center justify-center shrink-0 font-bold text-lg `}
              >
                {initials ? initials : <User size={20} />}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h3 className="text-base font-semibold text-foreground tracking-tight">
                  {student.name || "Unnamed Student"}
                </h3>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-muted-foreground border border-border">
                  ID: {studentId || "N/A"}
                </span>
              </div>
              {!isTeacher && (
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail size={13} />
                  <span>{student.email || "No email"}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info List (Non-Teacher) */}
        {!isTeacher && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 border-t border-border/50 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <User size={14} className="opacity-70" />
              <span>
                <span className="text-foreground font-medium">
                  {fatherName}
                </span>{" "}
                (Parent)
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone size={14} className="opacity-70" />
              <span className="text-foreground font-medium">
                {student.phone || "-"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin size={14} className="opacity-70" />
              <span className="text-foreground font-medium truncate max-w-[200px]">
                {student.address || "-"}
              </span>
            </div>
          </div>
        )}

        {/* Progress Section */}
        <div className="pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <GraduationCap size={14} />
            Enrolled Courses & Progress
          </div>

          {isBuildingMap ? (
            <div className="space-y-2 animate-pulse">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 bg-muted/40 rounded-lg w-full" />
              ))}
            </div>
          ) : assignedClassIds.length === 0 ? (
            <div className="text-muted-foreground text-sm py-3 px-4 bg-muted/30 rounded-lg border border-dashed border-border flex items-center justify-center">
              No active courses assigned
            </div>
          ) : (
            <div className="space-y-2">
              {assignedClassIds.map((clsId) => (
                <div
                  key={clsId}
                  className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-muted/20 border border-border/60 rounded-lg hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen
                      size={14}
                      className="text-primary opacity-80 shrink-0"
                    />
                    <span
                      className="text-sm font-medium text-foreground truncate max-w-[220px]"
                      title={classMap.get(clsId)}
                    >
                      {classMap.get(clsId) || "Unknown Course"}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:gap-3">
                    <InteractiveBadge
                      clsId={clsId}
                      fieldName="batchcompletion"
                      label="Course"
                    />
                    {!isTeacher && (
                      <>
                        <InteractiveBadge
                          clsId={clsId}
                          fieldName="examcompletion"
                          label="Exam"
                        />
                        <InteractiveBadge
                          clsId={clsId}
                          fieldName="certificateIssued"
                          label="Certificate"
                        />
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
  },
);

// ==========================================
// 4. MAIN CONTAINER COMPONENT (Smart)
// ==========================================

const AllStudents = () => {
  // Initialize states with values from sessionStorage if they exist
  const [searchTerm, setSearchTerm] = useState(() => {
    return sessionStorage.getItem("studentsDirectory_search") || "";
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = sessionStorage.getItem("studentsDirectory_page");
    return savedPage ? parseInt(savedPage, 10) : 1;
  });

  const [progressMap, setProgressMap] = useState(globalProgressMapCache);
  const [isBuildingMap, setIsBuildingMap] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const scrollContainerRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const itemsPerPage = 10;

  const students = useUserStore((state) => state.students);
  const getStudents = useUserStore((state) => state.getStudents);
  const isLoadingStudents = useUserStore((state) => state.isLoading);
  const studentError = useUserStore((state) => state.error);

  const userRole = useAuthStore((state) => state.userRole);
  const userData = useAuthStore((state) => state.user);

  const allClass = useClassStore((state) => state.allClass);
  const getClasses = useClassStore((state) => state.getClasses);
  const getClassById = useClassStore((state) => state.getClassById);

  const batches = useBatchStore((state) => state.batches);
  const fetchBatches = useBatchStore((state) => state.fetchBatches);

  useEffect(() => {
    if (!students || students.length === 0) getStudents();
    if (!allClass || allClass.length === 0) getClasses();
    if (!batches || batches.length === 0) fetchBatches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    setIsScrolled(scrollTop > 10);
    setShowTopBtn(scrollTop > 400);
  };

  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, []);

  // Updated Change Handlers saving to Session Storage
  const handleSearchChange = useCallback(
    (val) => {
      setSearchTerm(val);
      sessionStorage.setItem("studentsDirectory_search", val);
      setCurrentPage(1); // Reset to page 1 ONLY when the user actively types
      sessionStorage.setItem("studentsDirectory_page", "1");
      scrollToTop();
    },
    [scrollToTop],
  );

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(page);
      sessionStorage.setItem("studentsDirectory_page", page.toString());
      scrollToTop();
    },
    [scrollToTop],
  );

  const handleManualRefresh = useCallback(() => {
    isProgressMapBuilt = false;
    globalProgressMapCache = {};
    setProgressMap({});
    getStudents();
    getClasses();
    fetchBatches();
    triggerToast("Data refreshed successfully.", "success");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getStudents, getClasses, fetchBatches]);

  const triggerToast = useCallback((message, type = "success") => {
    const toastId = Date.now();
    setToastMessage({ message, type, id: toastId });
    setTimeout(() => {
      setToastMessage((prev) => (prev?.id === toastId ? null : prev));
    }, 4000);
  }, []);

  const handleProgressUpdate = useCallback(
    (studentId, classId, updatedFields) => {
      setProgressMap((prev) => {
        const key = `${studentId}_${classId}`;
        const updatedMap = {
          ...prev,
          [key]: { ...prev[key], ...updatedFields },
        };
        globalProgressMapCache = updatedMap;
        return updatedMap;
      });
    },
    [],
  );

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

    if (
      isProgressMapBuilt &&
      cachedStudentCount === filteredStudentsForTeacher.length &&
      Object.keys(globalProgressMapCache).length > 0
    ) {
      setProgressMap(globalProgressMapCache);
      return;
    }

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

      globalProgressMapCache = newProgressMap;
      cachedStudentCount = filteredStudentsForTeacher.length;
      isProgressMapBuilt = true;

      setProgressMap(newProgressMap);
      setIsBuildingMap(false);
    };

    buildProgressMap();
  }, [filteredStudentsForTeacher, getClassById]);

  const classMap = useMemo(() => {
    const validClasses = Array.isArray(allClass) ? allClass : [];
    return new Map(validClasses.map((cls) => [cls._id, cls.name]));
  }, [allClass]);

  const filteredStudents = useMemo(() => {
    if (!Array.isArray(filteredStudentsForTeacher)) return [];
    const query = searchTerm.toLowerCase().trim();
    if (!query) return filteredStudentsForTeacher;

    return filteredStudentsForTeacher.filter((student) => {
      const visibleStudentId = String(getStudentId(student) || "")
        .toLowerCase()
        .trim();
      if (userRole === "Teacher") {
        return (
          student?.name?.toLowerCase().includes(query) ||
          visibleStudentId.includes(query)
        );
      }
      return (
        student?.name?.toLowerCase().includes(query) ||
        student?.email?.toLowerCase().includes(query) ||
        student?.phone?.toLowerCase().includes(query) ||
        visibleStudentId.includes(query)
      );
    });
  }, [filteredStudentsForTeacher, searchTerm, userRole]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);

  // Failsafe: if filtered results shrink (e.g. search changed in another tab or students deleted)
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
      sessionStorage.setItem("studentsDirectory_page", totalPages.toString());
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full max-h-[calc(100vh)] overflow-hidden bg-background relative flex flex-col"
    >
      <Helmet>
        <title>IOK - Students</title>
      </Helmet>

      <ToastNotification
        toast={toastMessage}
        onClose={() => setToastMessage(null)}
      />

      <div className="max-w-6xl mx-auto w-full flex flex-col h-full overflow-hidden relative">
        <DirectoryHeader
          isScrolled={isScrolled}
          userRole={userRole}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onRefresh={handleManualRefresh}
          isRefreshing={isLoadingStudents || isBuildingMap}
        />

        {/* Scrollable Container just for students */}
        <div
          className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 py-4 relative"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          {studentError && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-3 font-medium text-sm">
              <AlertCircle size={16} className="shrink-0" />
              <p>{studentError}</p>
            </div>
          )}

          {isLoadingStudents ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3].map((skeletonIndex) => (
                <StudentCardSkeleton key={skeletonIndex} />
              ))}
            </div>
          ) : filteredStudents.length === 0 ? (
            <EmptyState isSearchActive={!!searchTerm} />
          ) : (
            <div className="flex flex-col relative pb-4">
              {isBuildingMap && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-muted overflow-hidden z-20 rounded-full mb-4">
                  <div className="h-full bg-primary w-1/3 animate-[slide_1.5s_ease-in-out_infinite]" />
                </div>
              )}

              <div className="flex flex-col gap-4 mt-2">
                {paginatedStudents.map((student, index) => (
                  <StudentCard
                    key={student._id || index}
                    student={student}
                    classMap={classMap}
                    progressMap={progressMap}
                    onProgressUpdate={handleProgressUpdate}
                    onShowToast={triggerToast}
                    isBuildingMap={isBuildingMap}
                    userRole={userRole}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Mobile inline pagination - scrolls up with content */}
          {!isLoadingStudents && totalPages > 1 && (
            <div className="md:hidden mt-6 pt-6 pb-8 border-t border-border">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                itemsPerPage={itemsPerPage}
                totalItems={filteredStudents.length}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>

        {/* Desktop fixed pagination - stays statically glued to the bottom */}
        {!isLoadingStudents && totalPages > 1 && (
          <div className="hidden md:block bg-background px-6 md:px-10 py-3 border-t border-border z-30 shrink-0">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              totalItems={filteredStudents.length}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      <ScrollToTopButton isVisible={showTopBtn} onScrollTop={scrollToTop} />
    </motion.div>
  );
};

export default AllStudents;
