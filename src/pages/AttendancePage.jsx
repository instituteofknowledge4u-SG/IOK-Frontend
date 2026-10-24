import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  ArrowLeft,
  Layers,
  Clock,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Calendar,
  Search,
  Filter,
  CalendarDays,
  Sunrise,
  Sun,
  Moon,
  ArrowUp,
  RefreshCw,
} from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import useAuthStore from "../stores/useAuthStore";
import useAttendanceStore from "../stores/useAttendanceStore";
import useUserStore from "../stores/useUserStore";
import toast from "react-hot-toast";
import BackButton from "../components/UI/Button";
import { filterBatchesForTeacher } from "../util/teacherAccessControl";
import { Helmet } from "react-helmet-async";

// ============================================================
// CONSTANTS
// ============================================================

const ITEMS_PER_PAGE = 12;

const DAYS = [
  "All",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const TIME_SLOTS = [
  {
    label: "All Times",
    value: "All",
    icon: Clock,
  },
  {
    label: "Morning (< 12 PM)",
    value: "Morning",
    icon: Sunrise,
  },
  {
    label: "Afternoon (12-5 PM)",
    value: "Afternoon",
    icon: Sun,
  },
  {
    label: "Evening (> 5 PM)",
    value: "Evening",
    icon: Moon,
  },
];

// ============================================================
// UTILITY
// ============================================================

const getBatchHour = (timeStr) => {
  if (!timeStr) return -1;

  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);

  if (!match) return -1;

  let h = parseInt(match[1], 10);
  const modifier = match[3]?.toLowerCase();

  if (modifier === "pm" && h < 12) h += 12;
  if (modifier === "am" && h === 12) h = 0;

  return h;
};

// ============================================================
// PAGINATION
// Same pagination as Courses page
// ============================================================

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
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }

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
            aria-label="Previous page"
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
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  },
);

// ============================================================
// SCROLL TO TOP
// ============================================================

const ScrollToTopButton = React.memo(({ isVisible, onScrollTop }) => (
  <AnimatePresence>
    {isVisible && (
      <Motion.button
        initial={{
          opacity: 0,
          scale: 0.8,
          y: 20,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: 0.8,
          y: 20,
        }}
        onClick={onScrollTop}
        className="fixed bottom-20 md:bottom-24 right-8 z-50 p-2.5 bg-foreground text-background rounded-full shadow-lg hover:scale-105 transition-all focus:outline-none"
        aria-label="Scroll to top"
      >
        <ArrowUp className="w-5 h-5" />
      </Motion.button>
    )}
  </AnimatePresence>
));

// ============================================================
// BATCH SKELETON
// ============================================================

const BatchSkeleton = () => (
  <div className="bg-card rounded-xl border border-border p-6 flex flex-col h-[210px] animate-pulse shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="w-full">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="h-6 bg-muted rounded-md w-2/3" />
          <div className="h-5 bg-muted rounded-full w-20 shrink-0" />
        </div>

        <div className="h-4 bg-muted rounded-md w-1/2 mb-3" />
      </div>
    </div>

    <div className="flex flex-wrap gap-2 mb-6 mt-2">
      <div className="h-7 bg-muted/60 rounded-md w-24" />
      <div className="h-7 bg-muted/60 rounded-md w-28" />
    </div>

    <div className="pt-4 mt-auto border-t border-border/50 flex items-center justify-between">
      <div className="h-4 bg-muted rounded-md w-32" />
      <div className="h-5 bg-muted rounded-md w-5" />
    </div>
  </div>
);

// ============================================================
// EMPTY STATE
// ============================================================

const EmptyBatchState = React.memo(({ isSearchActive }) => (
  <div className="bg-background rounded-xl border border-border/60 border-dashed p-16 flex flex-col items-center justify-center text-muted-foreground min-h-[300px]">
    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
      <Layers className="w-8 h-8 text-muted-foreground/50" />
    </div>

    <h3 className="text-lg font-semibold text-foreground tracking-tight">
      No batches found
    </h3>

    <p className="text-sm mt-1 text-center max-w-sm">
      {isSearchActive
        ? "We couldn't find any batches matching your search or filter criteria."
        : "No batches are currently available."}
    </p>
  </div>
));

// ============================================================
// STUDENT AVATAR
// ============================================================

const AVATAR_COLORS = [
  "bg-blue-500 text-white",
  "bg-violet-500 text-white",
  "bg-emerald-500 text-white",
  "bg-orange-500 text-white",
  "bg-pink-500 text-white",
  "bg-cyan-500 text-white",
  "bg-indigo-500 text-white",
  "bg-rose-500 text-white",
];

const getStudentInitials = (student) => {
  const firstName =
    student?.firstName ||
    student?.firstname ||
    student?.first_name ||
    "";

  const lastName =
    student?.lastName ||
    student?.lastname ||
    student?.last_name ||
    "";

  if (firstName || lastName) {
    return `${firstName?.trim()?.charAt(0) || ""}${lastName
      ?.trim()
      ?.charAt(0) || ""}`.toUpperCase() || "S";
  }

  const fullName = student?.name || student?.fullName || "";
  const nameParts = fullName.trim().split(/\\s+/).filter(Boolean);

  if (nameParts.length >= 2) {
    return `${nameParts[0].charAt(0)}${nameParts[nameParts.length - 1].charAt(
      0,
    )}`.toUpperCase();
  }

  return (nameParts[0]?.charAt(0) || "S").toUpperCase();
};

const StudentAvatar = React.memo(({ student, getPhoto }) => {
  const photo = getPhoto(student);
  const [imageError, setImageError] = useState(false);

  const identity =
    student?._id ||
    student?.id ||
    student?.studentId ||
    student?.email ||
    student?.name ||
    "student";

  const colorIndex =
    String(identity)
      .split("")
      .reduce((sum, char) => sum + char.charCodeAt(0), 0) %
    AVATAR_COLORS.length;

  const initials = getStudentInitials(student);

  if (!photo || imageError) {
    return (
      <div
        className={`w-10 h-10 rounded-full border border-border shrink-0 flex items-center justify-center text-xs font-bold ${AVATAR_COLORS[colorIndex]}`}
        aria-label={`${student?.name || "Student"} avatar`}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={photo}
      alt={student?.name || "Student"}
      className="w-10 h-10 rounded-full object-cover border border-border shrink-0"
      onError={() => setImageError(true)}
    />
  );
});

// ============================================================
// MAIN COMPONENT
// ============================================================

const AttendancePage = () => {
  // ==========================================================
  // AUTH STORE
  // ==========================================================

  const userData = useAuthStore((state) => state.user);

  const loadUser = useAuthStore((state) => state.loadUser);

  const userId = useAuthStore((state) => state.id);

  const userRole = useAuthStore((state) => state.userRole);

  // ==========================================================
  // ATTENDANCE STORE
  // ==========================================================

  const {
    batches,
    selectedBatch,
    students,
    attendance,
    attendanceDate,
    isLoading,
    error,
    success,
    getAllBatches,
    selectBatch,
    toggleAttendance,
    markAllPresent,
    markAllAbsent,
    submitAttendance,
    setAttendanceDate,
    clearError,
  } = useAttendanceStore();

  // ==========================================================
  // USER STORE
  // ==========================================================

  const allStudents = useUserStore((state) => state.students);

  const getAllStudentsList = useUserStore((state) => state.getStudents);

  // ==========================================================
  // REFS
  // ==========================================================

  /*
   * Prevents getAllBatches() from being triggered
   * more than once during this component lifecycle.
   */
  const batchesFetchedRef = useRef(false);

  /*
   * Prevents duplicate student requests as well.
   */
  const studentsFetchedRef = useRef(false);

  const scrollContainerRef = useRef(null);

  // ==========================================================
  // UI STATE
  // ==========================================================

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Separate loading state for selecting a batch so the batch list
  // does not disappear before the selected batch data is ready.
  const [isSelectingBatch, setIsSelectingBatch] = useState(false);

  const [showBatchSelection, setShowBatchSelection] = useState(true);

  // Student search
  const [searchTerm, setSearchTerm] = useState("");

  // Batch search
  const [batchSearchTerm, setBatchSearchTerm] = useState(
    () => sessionStorage.getItem("attendance_batchSearch") || "",
  );

  // Day filter
  const [selectedDay, setSelectedDay] = useState(() => {
    const savedDay = sessionStorage.getItem("attendance_day");

    if (savedDay) return savedDay;

    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
    });
  });

  // Time filter
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(
    () => sessionStorage.getItem("attendance_timeSlot") || "All",
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = sessionStorage.getItem("attendance_page");

    return savedPage ? parseInt(savedPage, 10) : 1;
  });

  // Time validation
  const [isTimeValid, setIsTimeValid] = useState(true);

  const [timeMessage, setTimeMessage] = useState("");

  // Scroll
  const [isScrolled, setIsScrolled] = useState(false);

  const [showTopBtn, setShowTopBtn] = useState(false);

  // ==========================================================
  // ROLE
  // ==========================================================

  const normalizedRole = userRole?.toLowerCase();

  const isAdmin = normalizedRole === "admin";

  const isTeacher = normalizedRole === "teacher";

  // ==========================================================
  // STUDENT ID HELPERS
  // ==========================================================

  const getStudentId = useCallback(
    (student) => {
      if (student === null || student === undefined) return null;

      if (typeof student === "string" || typeof student === "number") {
        return student;
      }

      return student?._id || student?.id || student?.studentId;
    },
    [],
  );

  const getNormalizedStudentId = useCallback(
    (student) => student?._id || student?.id || student?.studentId,
    [],
  );

  // ==========================================================
  // LOAD USER
  // ==========================================================

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // ==========================================================
  // LOAD STUDENTS ONLY WHEN NEEDED
  // ==========================================================

  useEffect(() => {
    if (studentsFetchedRef.current) {
      return;
    }

    if (Array.isArray(allStudents) && allStudents.length > 0) {
      studentsFetchedRef.current = true;
      return;
    }

    if (!getAllStudentsList) {
      return;
    }

    studentsFetchedRef.current = true;

    getAllStudentsList();
  }, [allStudents, getAllStudentsList]);

  // ==========================================================
  // LOAD BATCHES ONLY WHEN NEEDED
  // ==========================================================

  useEffect(() => {
    /*
     * Already requested during this mount.
     */
    if (batchesFetchedRef.current) {
      return;
    }

    /*
     * Authentication is not ready yet.
     */
    if (!userId || !userRole) {
      return;
    }

    /*
     * Batches already exist in Zustand.
     * No API request is necessary.
     */
    if (Array.isArray(batches) && batches.length > 0) {
      batchesFetchedRef.current = true;
      return;
    }

    /*
     * Mark BEFORE calling the API.
     * This is important for React StrictMode.
     */
    batchesFetchedRef.current = true;

    getAllBatches();
  }, [userId, userRole, batches, getAllBatches]);

  // ==========================================================
  // TEACHER DATE
  // ==========================================================

  useEffect(() => {
    if (isTeacher) {
      setAttendanceDate(new Date().toISOString().split("T")[0]);
    }
  }, [isTeacher, setAttendanceDate]);

  // ==========================================================
  // STUDENT LOOKUP
  // ==========================================================

  const studentLookup = useMemo(() => {
    const lookup = new Map();

    (allStudents || []).forEach((student) => {
      [student?._id, student?.id, student?.studentId]
        .filter(Boolean)
        .forEach((id) => {
          lookup.set(String(id), student);
        });
    });

    return lookup;
  }, [allStudents]);

  // ==========================================================
  // STUDENT PHOTO
  // ==========================================================

  const getStudentPhoto = useCallback((student) => {
    return (
      student?.profilePic ||
      student?.profilePicture ||
      student?.profile_picture ||
      student?.photo ||
      student?.image ||
      null
    );
  }, []);

  // ==========================================================
  // HYDRATED STUDENTS
  // ==========================================================

  const hydratedStudents = useMemo(
    () =>
      (students || []).map((student) => {
        const studentId = getNormalizedStudentId(student);

        const fullStudent = studentLookup.get(String(studentId));

        return fullStudent
          ? {
              ...fullStudent,
              ...student,
              _id: fullStudent._id || studentId,
            }
          : student;
      }),
    [students, studentLookup, getNormalizedStudentId],
  );

  // ==========================================================
  // REAL-TIME BATCH TIME VALIDATION
  // ==========================================================

  useEffect(() => {
    if (!selectedBatch || showBatchSelection) {
      return;
    }

    if (isAdmin) {
      setIsTimeValid(true);
      setTimeMessage("");
      return;
    }

    const checkBatchTime = () => {
      const now = new Date();

      const currentDayName = now.toLocaleDateString("en-US", {
        weekday: "long",
      });

      // Day check
      if (
        selectedBatch.weekday &&
        currentDayName.toLowerCase() !== selectedBatch.weekday.toLowerCase()
      ) {
        setIsTimeValid(false);

        setTimeMessage(
          `This batch runs on ${selectedBatch.weekday}s. Today is ${currentDayName}, attendance is locked.`,
        );

        return;
      }

      // Time parser
      const parseTime = (time) => {
        if (!time) return null;

        const match = time.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);

        if (!match) return null;

        let [, h, m, modifier] = match;

        h = parseInt(h, 10);
        m = parseInt(m, 10);

        if (modifier) {
          modifier = modifier.toLowerCase();

          if (modifier === "pm" && h < 12) {
            h += 12;
          }

          if (modifier === "am" && h === 12) {
            h = 0;
          }
        }

        const date = new Date();

        date.setHours(h, m, 0, 0);

        return date;
      };

      const startTime = parseTime(selectedBatch.startTime);

      const endTime = parseTime(selectedBatch.endTime);

      if (startTime && endTime) {
        if (now >= startTime && now <= endTime) {
          setIsTimeValid(true);
          setTimeMessage("");
        } else {
          setIsTimeValid(false);

          setTimeMessage(
            `Attendance can only be modified during batch hours (${selectedBatch.startTime} - ${selectedBatch.endTime}).`,
          );
        }
      } else {
        setIsTimeValid(true);
        setTimeMessage("");
      }
    };

    checkBatchTime();

    const interval = setInterval(checkBatchTime, 60000);

    return () => clearInterval(interval);
  }, [selectedBatch, isAdmin, showBatchSelection]);

  // ==========================================================
  // SCROLL
  // ==========================================================

  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;

    setIsScrolled(scrollTop > 10);

    setShowTopBtn(scrollTop > 400);
  };

  const scrollToTop = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }, []);

  // ==========================================================
  // SEARCH HANDLER
  // ==========================================================

  const handleBatchSearchChange = useCallback(
    (value) => {
      setBatchSearchTerm(value);

      sessionStorage.setItem("attendance_batchSearch", value);

      setCurrentPage(1);

      sessionStorage.setItem("attendance_page", "1");

      scrollToTop();
    },
    [scrollToTop],
  );

  // ==========================================================
  // DAY HANDLER
  // ==========================================================

  const handleDayChange = useCallback(
    (value) => {
      setSelectedDay(value);

      sessionStorage.setItem("attendance_day", value);

      setCurrentPage(1);

      sessionStorage.setItem("attendance_page", "1");

      scrollToTop();
    },
    [scrollToTop],
  );

  // ==========================================================
  // TIME HANDLER
  // ==========================================================

  const handleTimeSlotChange = useCallback(
    (value) => {
      setSelectedTimeSlot(value);

      sessionStorage.setItem("attendance_timeSlot", value);

      setCurrentPage(1);

      sessionStorage.setItem("attendance_page", "1");

      scrollToTop();
    },
    [scrollToTop],
  );

  // ==========================================================
  // PAGINATION HANDLER
  // ==========================================================

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(page);

      sessionStorage.setItem("attendance_page", page.toString());

      scrollToTop();
    },
    [scrollToTop],
  );

  // ==========================================================
  // MANUAL REFRESH
  // ==========================================================

  const handleManualRefresh = useCallback(async () => {
    try {
      await getAllBatches();

      toast.success("Batches refreshed");
    } catch {
      toast.error("Failed to refresh batches");
    }
  }, [getAllBatches]);

  // ==========================================================
  // ROLE-BASED BATCHES
  // ==========================================================

  const displayedBatches = useMemo(() => {
    if (isAdmin) {
      return Array.isArray(batches) ? batches : [];
    }

    return filterBatchesForTeacher(
      batches,
      userData?.batches || [],
      userRole,
      userData?.email,
      userData?._id,
    );
  }, [
    isAdmin,
    batches,
    userData?.batches,
    userData?.email,
    userData?._id,
    userRole,
  ]);

  // ==========================================================
  // BATCH STUDENT COUNT
  // ==========================================================

  const getBatchStudentCount = useCallback(
    (batch) => {
      // Calculate a unique count from the available relations first.
      // This also handles APIs that return student IDs instead of objects.
      const studentIds = new Set();

      const addStudentId = (student) => {
        const studentId = getStudentId(student);

        if (studentId !== null && studentId !== undefined && studentId !== "") {
          studentIds.add(String(studentId));
        }
      };

      if (Array.isArray(batch?.students)) {
        batch.students.forEach(addStudentId);
      }

      if (Array.isArray(batch?.mainClassStudentPairs)) {
        batch.mainClassStudentPairs.forEach((pair) => {
          addStudentId(pair?.student ?? pair?.studentId ?? pair);
        });
      }

      if (Array.isArray(batch?.studentIds)) {
        batch.studentIds.forEach(addStudentId);
      }

      if (studentIds.size > 0) {
        return studentIds.size;
      }

      // Finally fall back to an explicit count returned by the API.
      const explicitCount =
        batch?.studentCount ??
        batch?.studentsCount ??
        batch?.totalStudents ??
        batch?.totalStudentCount ??
        batch?.enrolledStudentsCount ??
        batch?.student_count;

      const parsedCount = Number(explicitCount);

      return Number.isFinite(parsedCount) && parsedCount >= 0
        ? parsedCount
        : 0;
    },
    [getStudentId],
  );

  // ==========================================================
  // FILTER BATCHES
  // ==========================================================

  const filteredBatches = useMemo(() => {
    return displayedBatches.filter((batch) => {
      // Name
      const matchName = batch?.name
        ?.toLowerCase()
        .includes(batchSearchTerm.toLowerCase());

      // Day
      const matchDay =
        selectedDay === "All" ||
        batch?.weekday?.toLowerCase() === selectedDay.toLowerCase();

      // Time
      let matchTime = true;

      if (selectedTimeSlot !== "All") {
        const hour = getBatchHour(batch?.startTime);

        if (hour !== -1) {
          if (selectedTimeSlot === "Morning") {
            matchTime = hour < 12;
          } else if (selectedTimeSlot === "Afternoon") {
            matchTime = hour >= 12 && hour < 17;
          } else if (selectedTimeSlot === "Evening") {
            matchTime = hour >= 17;
          }
        }
      }

      return matchName && matchDay && matchTime;
    });
  }, [displayedBatches, batchSearchTerm, selectedDay, selectedTimeSlot]);

  // ==========================================================
  // PAGINATION
  // ==========================================================

  const totalPages = Math.ceil(filteredBatches.length / ITEMS_PER_PAGE);

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);

      sessionStorage.setItem("attendance_page", totalPages.toString());
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;

  const paginatedBatches = filteredBatches.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  // ==========================================================
  // SELECT BATCH
  // ==========================================================

  const handleSelectBatch = async (batch) => {
    if (isSelectingBatch) return;

    setIsSelectingBatch(true);

    try {
      await selectBatch(batch);

      if (isTeacher) {
        setAttendanceDate(new Date().toISOString().split("T")[0]);
      }

      setSearchTerm("");
      setShowBatchSelection(false);

      toast.success(`Batch "${batch.name}" selected`);
    } catch {
      toast.error("Failed to select batch");
    } finally {
      setIsSelectingBatch(false);
    }
  };

  const handleBackToBatchList = useCallback(() => {
    setShowBatchSelection(true);
    setSearchTerm("");
    scrollToTop();
  }, [scrollToTop]);

  // ==========================================================
  // SUBMIT ATTENDANCE
  // ==========================================================

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();

    if (!selectedBatch) {
      toast.error("Please select a batch first");

      return;
    }

    if (students.length === 0) {
      toast.error("No students in this batch");

      return;
    }

    setIsSubmitting(true);

    try {
      await submitAttendance();

      toast.success("Attendance submitted successfully!");
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to submit attendance",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================
  // ATTENDANCE CALCULATIONS
  // ==========================================================

  const totalStudents = hydratedStudents.length;

  const checkIsPresent = useCallback((val) => {
    if (!val) return false;

    if (val === true) {
      return true;
    }

    if (typeof val === "string" && val.toLowerCase() === "present") {
      return true;
    }

    if (val.status && val.status.toLowerCase() === "present") {
      return true;
    }

    return false;
  }, []);

  const presentCount = Object.values(attendance).filter(checkIsPresent).length;

  const absentCount = totalStudents - presentCount;

  // ==========================================================
  // FILTER STUDENTS
  // ==========================================================

  const filteredStudents = useMemo(
    () =>
      hydratedStudents.filter((student) => {
        const searchLower = searchTerm.toLowerCase();

        return (
          student.name?.toLowerCase().includes(searchLower) ||
          student.email?.toLowerCase().includes(searchLower) ||
          String(getStudentId(student) || "")
            .toLowerCase()
            .includes(searchLower)
        );
      }),
    [hydratedStudents, searchTerm, getStudentId],
  );

  // ==========================================================
  // LOADING USER
  // ==========================================================

  if (!userData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />

        <p className="font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  // ==========================================================
  // RENDER
  // ==========================================================

  return (
    <>
      <Motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.3,
        }}
        className="h-full max-h-[calc(100vh)] overflow-hidden bg-background relative flex flex-col"
      >
        <Helmet>
          <title>IOK - Attendance</title>
        </Helmet>

        <div className="max-w-7xl mx-auto w-full flex flex-col h-full overflow-hidden relative">
          {/* ================================================== */}
          {/* HEADER */}
          {/* ================================================== */}

          <div
            className={`sticky top-0 z-40 flex flex-col xl:flex-row xl:items-end justify-between gap-4 px-6 md:px-10 pb-4 transition-all duration-300 ${
              isScrolled
                ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-sm pt-4"
                : "bg-background/90 backdrop-blur-xl border-b border-transparent pt-4 md:pt-8"
            }`}
          >
            <div className="flex-1">
              <div className="mb-3">
                {!showBatchSelection && (
                  <button
                    type="button"
                    onClick={handleBackToBatchList}
                    disabled={isSelectingBatch}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Batches
                  </button>
                )}
              </div>

              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {showBatchSelection
                  ? "Attendance Directory"
                  : selectedBatch?.name || "Attendance"}
              </h1>

              <p className="text-muted-foreground mt-1 text-sm">
                {showBatchSelection
                  ? "Select a batch to mark and manage student attendance."
                  : "Mark and manage student attendance for this batch."}
              </p>
            </div>

            {/* Filters */}
            {showBatchSelection && (
              <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 w-full xl:w-auto shrink-0">
                {/* Search */}
                <div className="relative group w-full sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>

                  <input
                    type="text"
                    placeholder="Search batches..."
                    value={batchSearchTerm}
                    onChange={(e) => handleBatchSearchChange(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-background border border-border hover:border-border/80 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  />

                  {batchSearchTerm && (
                    <button
                      onClick={() => handleBatchSearchChange("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Day */}
                <div className="w-[calc(100%-3rem)] sm:w-40 relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />

                  <select
                    value={selectedDay}
                    onChange={(e) => handleDayChange(e.target.value)}
                    className="block w-full pl-9 pr-8 py-2.5 bg-background border border-border hover:border-border/80 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    {DAYS.map((day) => (
                      <option key={day} value={day}>
                        {day}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>

                {/* Time */}
                <div className="w-[calc(100%-3rem)] sm:w-44 relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />

                  <select
                    value={selectedTimeSlot}
                    onChange={(e) => handleTimeSlotChange(e.target.value)}
                    className="block w-full pl-9 pr-8 py-2.5 bg-background border border-border hover:border-border/80 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm appearance-none cursor-pointer"
                  >
                    {TIME_SLOTS.map((slot) => (
                      <option key={slot.value} value={slot.value}>
                        {slot.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>

                {/* Refresh */}
                <button
                  onClick={handleManualRefresh}
                  disabled={isLoading}
                  title="Refresh Data"
                  className="px-3 py-2.5 bg-background border border-border rounded-lg text-foreground hover:bg-muted disabled:opacity-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-center shrink-0"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${
                      isLoading
                        ? "animate-spin text-primary"
                        : "text-muted-foreground"
                    }`}
                  />
                </button>
              </div>
            )}
          </div>

          {/* ================================================== */}
          {/* ALERTS */}
          {/* ================================================== */}

          <div className="px-6 md:px-10 pt-4">
            <AnimatePresence>
              {error && (
                <Motion.div
                  initial={{
                    opacity: 0,
                    y: -10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  className="mb-4 p-4 rounded-xl flex items-start gap-3 border bg-destructive/10 border-destructive/20 text-destructive"
                >
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />

                  <div>
                    <p className="font-medium">{error}</p>

                    <button
                      onClick={clearError}
                      className="text-xs mt-1 text-destructive hover:opacity-80 underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </Motion.div>
              )}

              {success && (
                <Motion.div
                  initial={{
                    opacity: 0,
                    y: -10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: -10,
                  }}
                  className="mb-4 p-4 rounded-xl flex items-start gap-3 border bg-success/10 border-success/20 text-success"
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />

                  <p className="font-medium">
                    Attendance submitted successfully!
                  </p>
                </Motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ================================================== */}
          {/* SCROLL AREA */}
          {/* ================================================== */}

          <div
            className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 py-4 relative"
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            {/* ================================================= */}
            {/* BATCH SELECTION */}
            {/* ================================================= */}

            {showBatchSelection ? (
              <>
                {isSelectingBatch ? (
                  <div className="min-h-[360px] flex flex-col items-center justify-center gap-4 text-muted-foreground">
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <p className="text-sm font-medium">
                      Loading students...
                    </p>
                  </div>
                ) : isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({
                      length: 6,
                    }).map((_, i) => (
                      <BatchSkeleton key={i} />
                    ))}
                  </div>
                ) : filteredBatches.length === 0 ? (
                  <EmptyBatchState
                    isSearchActive={
                      !!batchSearchTerm ||
                      selectedDay !== "All" ||
                      selectedTimeSlot !== "All"
                    }
                  />
                ) : (
                  <div className="flex flex-col relative pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <AnimatePresence mode="popLayout">
                        {paginatedBatches.map((batch, index) => {
                          const studentCount = getBatchStudentCount(batch);

                          return (
                            <Motion.div
                              key={batch?._id}
                              layout
                              initial={{
                                opacity: 0,
                                scale: 0.95,
                              }}
                              animate={{
                                opacity: 1,
                                scale: 1,
                              }}
                              exit={{
                                opacity: 0,
                                scale: 0.95,
                              }}
                              transition={{
                                delay: index * 0.05,
                              }}
                              whileHover={{
                                y: -4,
                              }}
                              whileTap={{
                                scale: 0.98,
                              }}
                              onClick={() => handleSelectBatch(batch)}
                              className="group bg-card rounded-xl border border-border shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-pointer p-6 flex flex-col relative overflow-hidden"
                            >
                              {/* Hover Top Line */}
                              <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                              {/* Header */}
                              <div className="flex justify-between items-start mb-4">
                                <div className="w-full">
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                      {batch?.name || "Unnamed Batch"}
                                    </h3>

                                    {/* <span className="px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider border bg-primary/10 text-primary border-primary/20 shrink-0"> */}
                                    <span className="px-2 py-0.5 text-[12px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md uppercase tracking-wider shrink-0">
                                      {batch?.weekday || "No Day"}
                                    </span>
                                  </div>

                                  <p className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                                    <Clock className="w-4 h-4 opacity-70" />
                                    {batch?.startTime || "--"} -{" "}
                                    {batch?.endTime || "--"}
                                  </p>
                                </div>
                              </div>

                              {/* Meta */}
                              <div className="flex flex-wrap gap-2 mb-6 mt-2">
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-md text-[11px] font-medium text-primary border border-primary/20">
                                  <CalendarDays className="w-3.5 h-3.5" />

                                  {batch?.weekday || "Schedule"}
                                </div>

                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 rounded-md text-[11px] font-medium text-muted-foreground border border-border/50">
                                  <Users className="w-3.5 h-3.5 opacity-70" />
                                  {studentCount} Students
                                </div>
                              </div>

                              {/* Footer */}
                              <div className="pt-4 mt-auto border-t border-border/50 flex items-center justify-between">
                                <div className="flex items-center text-muted-foreground text-sm gap-2">
                                  <Clock className="w-4 h-4 opacity-70" />

                                  <span>
                                    <strong className="text-foreground">
                                      {batch?.startTime || "--"}
                                    </strong>{" "}
                                    to{" "}
                                    <strong className="text-foreground">
                                      {batch?.endTime || "--"}
                                    </strong>
                                  </span>
                                </div>

                                <ArrowLeft className="w-5 h-5 rotate-180 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                              </div>
                            </Motion.div>
                          );
                        })}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {/* Mobile Pagination */}
                {!isLoading && totalPages > 1 && (
                  <div className="md:hidden mt-6 pt-6 pb-8 border-t border-border">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      startIndex={startIndex}
                      itemsPerPage={ITEMS_PER_PAGE}
                      totalItems={filteredBatches.length}
                      onPageChange={handlePageChange}
                    />
                  </div>
                )}
              </>
            ) : (
              /* ================================================= */
              /* ATTENDANCE FORM */
              /* ================================================= */

              <Motion.div
                initial={{
                  opacity: 0,
                  y: 10,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                transition={{
                  duration: 0.3,
                }}
                className="space-y-6 pb-8"
              >
                {/* Active Batch */}
                <Motion.div
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="bg-primary/5 border border-primary/20 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 text-primary rounded-xl hidden sm:block">
                      <Layers className="w-6 h-6" />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-foreground leading-tight">
                        {selectedBatch?.name}
                      </h2>

                      <p className="text-sm text-muted-foreground mt-1 flex flex-wrap items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        {selectedBatch?.weekday}
                        <span className="opacity-50">•</span>
                        <Clock className="w-4 h-4" />
                        {selectedBatch?.startTime} - {selectedBatch?.endTime}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleBackToBatchList}
                    disabled={isSelectingBatch}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Change Batch
                  </button>
                </Motion.div>

                {/* Attendance */}
                {students.length > 0 ? (
                  <Motion.div
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="bg-card border border-border rounded-xl shadow-sm p-6 md:p-8"
                  >
                    <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" />
                      Mark Attendance
                    </h2>

                    {/* Time Warning */}
                    {timeMessage && (
                      <div className="mb-6 p-4 rounded-xl flex items-start gap-3 border bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400">
                        <Clock className="w-5 h-5 shrink-0 mt-0.5" />

                        <p className="font-medium text-sm">{timeMessage}</p>
                      </div>
                    )}

                    <form
                      onSubmit={handleSubmitAttendance}
                      className="space-y-6"
                    >
                      {/* Date/Search */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label
                            htmlFor="attendanceDate"
                            className="block text-sm font-semibold text-foreground"
                          >
                            Attendance Date{" "}
                            <span className="text-destructive">*</span>
                          </label>

                          <input
                            type="date"
                            id="attendanceDate"
                            value={attendanceDate}
                            disabled={isTeacher}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        <div className="space-y-2">
                          <label
                            htmlFor="searchStudents"
                            className="block text-sm font-semibold text-foreground"
                          >
                            Find Student
                          </label>

                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                            <input
                              type="text"
                              id="searchStudents"
                              placeholder="Search by name or email..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={markAllPresent}
                          disabled={!isTimeValid}
                          className="flex-1 px-4 py-2.5 rounded-lg bg-success/10 text-success border border-success/20 font-medium hover:bg-success/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          Mark All Present
                        </button>

                        <button
                          type="button"
                          onClick={markAllAbsent}
                          disabled={!isTimeValid}
                          className="flex-1 px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          Mark All Absent
                        </button>
                      </div>

                      {/* Students */}
                      <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                        {filteredStudents.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8 border-2 border-dashed border-border rounded-xl">
                            No students found matching your search.
                          </p>
                        ) : (
                          filteredStudents.map((student) => {
                            const studentId = getStudentId(student);

                            const isPresent = checkIsPresent(
                              attendance[studentId],
                            );

                            return (
                              <Motion.div
                                key={studentId}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                  isTimeValid
                                    ? isPresent
                                      ? "border-success/50 bg-success/5 cursor-pointer"
                                      : "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                                    : "opacity-60 cursor-not-allowed border-border bg-muted/30"
                                }`}
                                onClick={() => {
                                  if (isTimeValid && studentId) {
                                    toggleAttendance(studentId);
                                  }
                                }}
                              >
                                <StudentAvatar
                                  student={student}
                                  getPhoto={getStudentPhoto}
                                />

                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-foreground truncate">
                                    {student.name || "Unknown Student"}
                                  </p>

                                  <p className="text-sm text-muted-foreground truncate">
                                    {student.email || "No email available"}
                                  </p>
                                </div>

                                <span
                                  className={`hidden sm:inline-flex shrink-0 rounded-md border px-2.5 py-1 text-xs font-semibold ${
                                    isPresent
                                      ? "border-success/30 bg-success/10 text-success"
                                      : "border-destructive/30 bg-destructive/10 text-destructive"
                                  }`}
                                >
                                  {isPresent ? "Present" : "Absent"}
                                </span>

                                <div className="shrink-0">
                                  <Motion.div
                                    whileHover={
                                      isTimeValid
                                        ? {
                                            scale: 1.1,
                                          }
                                        : {}
                                    }
                                    whileTap={
                                      isTimeValid
                                        ? {
                                            scale: 0.95,
                                          }
                                        : {}
                                    }
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                      isPresent
                                        ? "bg-success text-white shadow-sm shadow-success/30"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {isPresent ? (
                                      <Check className="w-5 h-5" />
                                    ) : (
                                      <X className="w-5 h-5" />
                                    )}
                                  </Motion.div>
                                </div>
                              </Motion.div>
                            );
                          })
                        )}
                      </div>

                      {/* Submit */}
                      <button
                        type="submit"
                        disabled={
                          isSubmitting || students.length === 0 || !isTimeValid
                        }
                        className="w-full py-3.5 px-6 bg-primary hover:opacity-90 text-primary-foreground font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-primary/20 text-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            Submit Attendance
                          </>
                        )}
                      </button>
                    </form>
                  </Motion.div>
                ) : (
                  <div className="bg-card border border-border rounded-xl p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />

                    <h3 className="font-semibold text-lg text-foreground">
                      No Students Found
                    </h3>

                    <p className="text-muted-foreground mt-1">
                      This batch currently has no enrolled students.
                    </p>
                  </div>
                )}

                {/* ================================================= */}
                {/* STATISTICS */}
                {/* ================================================= */}

                {students.length > 0 && (
                  <Motion.div
                    initial={{
                      opacity: 0,
                      y: 10,
                    }}
                    animate={{
                      opacity: 1,
                      y: 0,
                    }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-10"
                  >
                    {/* Total */}
                    <Motion.div
                      whileHover={{
                        y: -3,
                      }}
                      className="bg-primary/10 border border-primary/20 rounded-xl p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-primary mb-1">
                            Total Students
                          </p>

                          <p className="text-3xl font-bold text-foreground">
                            {totalStudents}
                          </p>
                        </div>

                        <div className="p-3 bg-primary/20 text-primary rounded-lg">
                          <Users className="w-6 h-6" />
                        </div>
                      </div>
                    </Motion.div>

                    {/* Present */}
                    <Motion.div
                      whileHover={{
                        y: -3,
                      }}
                      className="bg-success/10 border border-success/20 rounded-xl p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-success mb-1">
                            Present
                          </p>

                          <p className="text-3xl font-bold text-foreground">
                            {presentCount}
                          </p>

                          <p className="text-xs text-success mt-1">
                            {totalStudents
                              ? ((presentCount / totalStudents) * 100).toFixed(
                                  1,
                                )
                              : 0}
                            %
                          </p>
                        </div>

                        <div className="p-3 bg-success/20 text-success rounded-lg">
                          <Check className="w-6 h-6" />
                        </div>
                      </div>
                    </Motion.div>

                    {/* Absent */}
                    <Motion.div
                      whileHover={{
                        y: -3,
                      }}
                      className="bg-destructive/10 border border-destructive/20 rounded-xl p-6 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-destructive mb-1">
                            Absent
                          </p>

                          <p className="text-3xl font-bold text-foreground">
                            {absentCount}
                          </p>

                          <p className="text-xs text-destructive mt-1">
                            {totalStudents
                              ? ((absentCount / totalStudents) * 100).toFixed(1)
                              : 0}
                            %
                          </p>
                        </div>

                        <div className="p-3 bg-destructive/20 text-destructive rounded-lg">
                          <X className="w-6 h-6" />
                        </div>
                      </div>
                    </Motion.div>
                  </Motion.div>
                )}
              </Motion.div>
            )}
          </div>

          {/* ================================================== */}
          {/* DESKTOP PAGINATION */}
          {/* ================================================== */}

          {showBatchSelection && !isLoading && totalPages > 1 && (
            <div className="hidden md:block bg-background px-6 md:px-10 py-3 border-t border-border z-30 shrink-0">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={filteredBatches.length}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>

        <ScrollToTopButton isVisible={showTopBtn} onScrollTop={scrollToTop} />
      </Motion.div>
    </>
  );
};

export default AttendancePage;
