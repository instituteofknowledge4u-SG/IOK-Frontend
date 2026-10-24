import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Trash2,
  AlertTriangle,
  BookOpen,
  Clock,
  User,
  ArrowUp,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";
import useBatchStore from "../../stores/useBatchStore";
import useAuthStore from "../../stores/useAuthStore";
import useTradeStore from "../../stores/useTradeStore";
import useUserStore from "../../stores/useUserStore";
import { generateSlug } from "../../util/generateSlug";
import { TRADES, getTradeLabel } from "../../constants/trades";
import { filterBatchesForTeacher } from "../../util/teacherAccessControl";
import { Helmet } from "react-helmet-async";

// ==========================================
// 1. CONSTANTS & HELPERS
// ==========================================
const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const getWeekdayOrder = (weekday) => {
  const index = WEEKDAYS.findIndex(
    (day) => day.toLowerCase() === String(weekday || "").toLowerCase(),
  );
  return index === -1 ? WEEKDAYS.length : index;
};

const getTimeValue = (time) => {
  if (!time) return Number.MAX_SAFE_INTEGER;
  const match = String(time)
    .trim()
    .match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);

  if (!match) return Number.MAX_SAFE_INTEGER;

  let hours = Number(match[1]);
  const minutes = Number(match[2] || 0);
  const meridiem = match[3]?.toUpperCase();

  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

const formatTime12Hour = (time) => {
  const minutesFromMidnight = getTimeValue(time);
  if (minutesFromMidnight === Number.MAX_SAFE_INTEGER) return time || "-";

  const hours24 = Math.floor(minutesFromMidnight / 60);
  const minutes = minutesFromMidnight % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${hours12}:${String(minutes).padStart(2, "0")} ${meridiem}`;
};

// --- Avatar Component & Helpers (Start + End Letter Initials & Multi-Color Gradients) ---
const failedUrlCache = new Set();

const AVATAR_COLOR_PALETTES = [
  "bg-gradient-to-br from-rose-500 to-orange-500 text-white border-rose-400/30",
  "bg-gradient-to-br from-violet-600 to-indigo-600 text-white border-violet-400/30",
  "bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-emerald-400/30",
  "bg-gradient-to-br from-sky-500 to-blue-600 text-white border-sky-400/30",
  "bg-gradient-to-br from-amber-500 to-orange-600 text-white border-amber-400/30",
  "bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white border-fuchsia-400/30",
  "bg-gradient-to-br from-cyan-500 to-teal-600 text-white border-cyan-400/30",
  "bg-gradient-to-br from-purple-600 to-pink-500 text-white border-purple-400/30",
  "bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-blue-400/30",
  "bg-gradient-to-br from-lime-500 to-emerald-600 text-white border-lime-400/30",
  "bg-gradient-to-br from-red-500 to-rose-600 text-white border-red-400/30",
  "bg-gradient-to-br from-teal-500 to-emerald-700 text-white border-teal-400/30",
  "bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-indigo-400/30",
  "bg-gradient-to-br from-pink-500 to-rose-500 text-white border-pink-400/30",
];

const getStartAndEndInitials = (name, email) => {
  const rawSource = (name || "").trim();
  const cleanChars = Array.from(rawSource.replace(/[^\p{L}\p{N}]/gu, ""));

  if (cleanChars.length >= 2) {
    return `${cleanChars[0]}${cleanChars[cleanChars.length - 1]}`.toUpperCase();
  }
  if (cleanChars.length === 1) {
    return cleanChars[0].toUpperCase();
  }

  if (email && typeof email === "string") {
    const emailLocal = email.split("@")[0].replace(/[^a-zA-Z0-9]/g, "");
    if (emailLocal.length >= 2) {
      return `${emailLocal[0]}${emailLocal[emailLocal.length - 1]}`.toUpperCase();
    }
    if (emailLocal.length === 1) {
      return emailLocal[0].toUpperCase();
    }
  }

  return "U";
};

const getAvatarColorPalette = (seedString = "") => {
  const str = String(seedString || "default").trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLOR_PALETTES.length;
  return AVATAR_COLOR_PALETTES[index];
};

const resolveAvatarUrl = (src, user) => {
  const candidates = [
    src,
    user?.profilePic,
    user?.profilePicture,
    user?.avatar,
    user?.photo,
    user?.image,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim() !== "") {
      return candidate.trim();
    }
  }
  return null;
};

const UserAvatar = React.memo(({ user, src, name, email, className = "w-6 h-6 text-[10px]" }) => {
  const resolvedName = name ?? user?.name ?? "";
  const resolvedEmail = email ?? user?.email ?? "";
  const resolvedSrc = useMemo(() => resolveAvatarUrl(src, user), [src, user]);

  const [imgError, setImgError] = useState(() =>
    resolvedSrc ? failedUrlCache.has(resolvedSrc) : false
  );

  useEffect(() => {
    setImgError(resolvedSrc ? failedUrlCache.has(resolvedSrc) : false);
  }, [resolvedSrc]);

  const initials = useMemo(
    () => getStartAndEndInitials(resolvedName, resolvedEmail),
    [resolvedName, resolvedEmail]
  );

  const colorPalette = useMemo(
    () =>
      getAvatarColorPalette(
        resolvedName || resolvedEmail || user?._id || user?.id
      ),
    [resolvedName, resolvedEmail, user?._id, user?.id]
  );

  const shouldShowImage = Boolean(resolvedSrc && !imgError);

  const handleImageError = () => {
    if (resolvedSrc) failedUrlCache.add(resolvedSrc);
    setImgError(true);
  };

  return (
    <div
      title={resolvedName || resolvedEmail || "Instructor"}
      className={`relative inline-flex items-center justify-center shrink-0 select-none overflow-hidden rounded-full font-extrabold tracking-wider border shadow-sm transition-all ${
        shouldShowImage ? "bg-muted border-border" : colorPalette
      } ${className}`}
    >
      {shouldShowImage ? (
        <img
          src={resolvedSrc}
          alt={resolvedName || "Avatar"}
          loading="lazy"
          onError={handleImageError}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="leading-none drop-shadow-sm">{initials}</span>
      )}
    </div>
  );
});
UserAvatar.displayName = "UserAvatar";

// ==========================================
// 2. SHARED UI COMPONENTS
// ==========================================
const ScrollToTopButton = React.memo(({ isVisible, onScrollTop }) => (
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

const Pagination = React.memo(({
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
      pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
      <p className="text-sm text-muted-foreground order-2 sm:order-1">
        Showing <span className="font-medium text-foreground">{startIndex + 1}</span> to{" "}
        <span className="font-medium text-foreground">
          {Math.min(startIndex + itemsPerPage, totalItems)}
        </span>{" "}
        of <span className="font-medium text-foreground">{totalItems}</span> results
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
              <span key={`ellipsis-${idx}`} className="w-8 flex justify-center text-muted-foreground text-sm">
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
            )
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
});

const EmptyState = React.memo(({ isSearchActive }) => (
  <div className="bg-background rounded-xl border border-border/60 border-dashed p-16 flex flex-col items-center justify-center text-muted-foreground">
    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
      <Search className="w-8 h-8 text-muted-foreground/50" />
    </div>
    <h3 className="text-lg font-semibold text-foreground tracking-tight">No batches found</h3>
    <p className="text-sm mt-1 text-center max-w-sm">
      {isSearchActive
        ? "Try adjusting your search terms or filters."
        : "There are currently no batches available in the directory."}
    </p>
  </div>
));

// --- Reusable Confirmation Modal ---
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-border"
        >
          <div className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-foreground">{title}</h3>
            </div>
            <p className="text-muted-foreground mb-6">{message}</p>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-foreground hover:bg-muted transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-destructive hover:opacity-90 text-destructive-foreground transition-all font-medium flex items-center gap-2 shadow-sm shadow-destructive/20 hover:-translate-y-0.5"
              >
                <Trash2 className="w-4 h-4" />
                {confirmText}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};


// ==========================================
// 3. MAIN CONTAINER COMPONENT
// ==========================================
const BatchList = () => {
  const { batches, fetchBatches, isLoading } = useBatchStore();
  const { user } = useAuthStore();
  const userRole = useAuthStore((state) => state.userRole);
  const batchTradeMap = useTradeStore((state) => state.batchTradeMap);

  // Cached teachers from useUserStore to hydrate instructor avatars
  const rawTeachers = useUserStore((state) => state.teachers);
  const getTeachers = useUserStore((state) => state.getTeachers);

  const teachersList = useMemo(
    () => (Array.isArray(rawTeachers) ? rawTeachers : rawTeachers?.data || []),
    [rawTeachers]
  );

  const teachersCacheMap = useMemo(() => {
    const byId = new Map();
    const byEmail = new Map();
    const byName = new Map();
    teachersList.forEach((t) => {
      if (!t) return;
      if (t._id) byId.set(String(t._id), t);
      if (t.email) byEmail.set(t.email.toLowerCase(), t);
      if (t.name) byName.set(t.name.toLowerCase(), t);
    });
    return { byId, byEmail, byName };
  }, [teachersList]);

  const resolveBatchTeachers = useCallback(
    (batch) => {
      if (Array.isArray(batch.teachers) && batch.teachers.length > 0) {
        return batch.teachers.map((t) => {
          if (typeof t === "string") {
            return (
              teachersCacheMap.byId.get(String(t)) || {
                _id: t,
                name: "Unknown",
              }
            );
          }
          const cached =
            (t?._id && teachersCacheMap.byId.get(String(t._id))) ||
            (t?.email &&
              teachersCacheMap.byEmail.get(t.email.toLowerCase())) ||
            (t?.name && teachersCacheMap.byName.get(t.name.toLowerCase()));
          return { ...t, ...(cached || {}) };
        });
      }
      if (batch.teacherEmail) {
        const cached = teachersCacheMap.byEmail.get(
          batch.teacherEmail.toLowerCase()
        );
        return [cached || { email: batch.teacherEmail, name: batch.teacherEmail }];
      }
      return [];
    },
    [teachersCacheMap]
  );

  // Initialize states with values from sessionStorage if they exist
  const [searchQuery, setSearchQuery] = useState(() => sessionStorage.getItem("batchDirectory_search") || "");
  const [selectedTradeId, setSelectedTradeId] = useState(() => sessionStorage.getItem("batchDirectory_trade") || "");
  const [selectedWeekday, setSelectedWeekday] = useState(() => sessionStorage.getItem("batchDirectory_weekday") || "");
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = sessionStorage.getItem("batchDirectory_page");
    return savedPage ? parseInt(savedPage, 10) : 1;
  });

  const itemsPerPage = 12; // Grid of 3 cols -> 4 rows

  // Scroll Container State
  const scrollContainerRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  useEffect(() => {
    if (!batches || batches.length === 0) {
      fetchBatches();
    }
    if (getTeachers && teachersList.length === 0 && userRole !== "Student") {
      getTeachers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleManualRefresh = useCallback(() => {
    fetchBatches();
  }, [fetchBatches]);

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

  // Update Handlers saving to Session Storage
  const handleSearchChange = useCallback((val) => {
    setSearchQuery(val);
    sessionStorage.setItem("batchDirectory_search", val);
    setCurrentPage(1);
    sessionStorage.setItem("batchDirectory_page", "1");
    scrollToTop();
  }, [scrollToTop]);

  const handleTradeChange = useCallback((val) => {
    setSelectedTradeId(val);
    sessionStorage.setItem("batchDirectory_trade", val);
    setCurrentPage(1);
    sessionStorage.setItem("batchDirectory_page", "1");
    scrollToTop();
  }, [scrollToTop]);

  const handleWeekdayChange = useCallback((val) => {
    setSelectedWeekday(val);
    sessionStorage.setItem("batchDirectory_weekday", val);
    setCurrentPage(1);
    sessionStorage.setItem("batchDirectory_page", "1");
    scrollToTop();
  }, [scrollToTop]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    sessionStorage.setItem("batchDirectory_page", page.toString());
    scrollToTop();
  }, [scrollToTop]);

  // Filter batches for teachers/students
  const batchesForUser = useMemo(() => {
    if (userRole === "Admin") return batches;
    if (userRole === "Teacher") {
      return filterBatchesForTeacher(
        batches,
        user?.batches || [],
        userRole,
        user?.email,
        user?._id,
      );
    }
    if (userRole === "Student") {
      return batches.filter((batch) => {
        const inStudents = batch.students?.some(
          (s) => (s._id || s) === user?._id,
        );
        const inPairs = batch.mainClassStudentPairs?.some(
          (p) => (p.student?._id || p.student) === user?._id,
        );
        return inStudents || inPairs;
      });
    }
    return batches;
  }, [batches, userRole, user]);

  const filteredBatches = useMemo(() => {
    return batchesForUser
      .filter((batch) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          batch.name?.toLowerCase().includes(query) ||
          batch.weekday?.toLowerCase().includes(query) ||
          batch.teacherEmail?.toLowerCase().includes(query) ||
          (Array.isArray(batch.teachers) &&
            batch.teachers.some(
              (t) =>
                t.name?.toLowerCase().includes(query) ||
                t.email?.toLowerCase().includes(query),
            ));

        const tradeId = batchTradeMap[batch._id] || "";
        const matchesTrade =
          selectedTradeId === ""
            ? true
            : selectedTradeId === "unassigned"
              ? !tradeId
              : tradeId === selectedTradeId;
        const matchesWeekday =
          selectedWeekday === "" ||
          String(batch.weekday || "").toLowerCase() ===
            selectedWeekday.toLowerCase();

        return matchesSearch && matchesTrade && matchesWeekday;
      })
      .sort((a, b) => {
        const dayDifference =
          getWeekdayOrder(a.weekday) - getWeekdayOrder(b.weekday);
        if (dayDifference !== 0) return dayDifference;

        const timeDifference = getTimeValue(a.startTime) - getTimeValue(b.startTime);
        if (timeDifference !== 0) return timeDifference;

        return String(a.name || "").localeCompare(String(b.name || ""));
      });
  }, [
    batchesForUser,
    batchTradeMap,
    searchQuery,
    selectedTradeId,
    selectedWeekday,
  ]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredBatches.length / itemsPerPage);

  // Failsafe: if filtered results shrink
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
      sessionStorage.setItem("batchDirectory_page", totalPages.toString());
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBatches = filteredBatches.slice(startIndex, startIndex + itemsPerPage);

  const getHeaderContent = (role) => {
    switch (role) {
      case "Teacher":
        return {
          title: "Assigned Batches",
          description:
            "Overview of your assigned classes, course details, and enrolled students.",
        };
      case "Student":
        return {
          title: "My Batches",
          description:
            "Access your enrolled batches, course details, and upcoming class schedules.",
        };
      case "Admin":
      default:
        return {
          title: "Batch Management",
          description:
            "Overview of all active batches, assigned courses, fees, and student allocations.",
        };
    }
  };

  const { title, description } = getHeaderContent(userRole);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full max-h-[calc(100vh)] overflow-hidden bg-background relative flex flex-col"
    >
      <Helmet>
        <title>IOK - Batches</title>
      </Helmet>

      <div className="max-w-7xl mx-auto w-full flex flex-col h-full overflow-hidden relative">
        
        {/* Sticky Header Section */}
        <div
          className={`sticky top-0 z-40 flex flex-col xl:flex-row xl:items-end justify-between gap-4 px-6 md:px-10 pb-4 transition-all duration-300 ${
            isScrolled
              ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-sm pt-4"
              : "bg-background/90 backdrop-blur-xl border-b border-transparent pt-4 md:pt-8"
          }`}
        >
          <div className="hidden md:block flex-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {description}
            </p>
          </div>

          <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 w-full xl:w-auto shrink-0">
            {/* Search Bar */}
            <div className="relative group w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search batches..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="block w-full pl-10 pr-10 py-2.5 bg-background border border-border hover:border-border/80 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Trade Filter */}
            <div className="w-[calc(50%-0.25rem)] sm:w-40 relative">
              <select
                value={selectedTradeId}
                onChange={(e) => handleTradeChange(e.target.value)}
                className="block w-full pl-3 pr-8 py-2.5 bg-background border border-border hover:border-border/80 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="">All Trades</option>
                <option value="unassigned">Unassigned</option>
                {TRADES.map((trade) => (
                  <option key={trade.id} value={trade.id}>
                    {trade.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Weekday Filter */}
            <div className="w-[calc(50%-0.25rem)] sm:w-36 relative">
              <select
                value={selectedWeekday}
                onChange={(e) => handleWeekdayChange(e.target.value)}
                className="block w-full pl-3 pr-8 py-2.5 bg-background border border-border hover:border-border/80 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm appearance-none cursor-pointer"
              >
                <option value="">All Days</option>
                {WEEKDAYS.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <button
                onClick={handleManualRefresh}
                disabled={isLoading}
                title="Refresh Data"
                className="px-3 py-2.5 bg-background border border-border rounded-lg text-foreground hover:bg-muted disabled:opacity-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-center shrink-0"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : "text-muted-foreground"}`} />
              </button>

              {userRole === "Admin" && (
                <Link
                  to="/batches/create"
                  className="flex-1 sm:flex-none whitespace-nowrap px-4 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-lg text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center"
                >
                  + Create Batch
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Container */}
        <div 
          className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 py-4 relative"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((skeleton) => (
                <div
                  key={skeleton}
                  className="h-[156px] p-6 rounded-xl bg-card border border-border shadow-sm animate-pulse"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-5 bg-muted rounded w-2/3"></div>
                    <div className="h-5 bg-muted rounded-full w-16"></div>
                  </div>
                  <div className="h-6 w-24 bg-muted/60 rounded-lg mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-muted/50 rounded w-1/2"></div>
                    <div className="h-4 bg-muted/50 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBatches.length === 0 ? (
            <EmptyState isSearchActive={!!searchQuery || !!selectedTradeId || !!selectedWeekday} />
          ) : (
            <div className="flex flex-col relative pb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                <AnimatePresence mode="popLayout">
                  {paginatedBatches.map((batch, index) => {
                    const resolvedTeachers = resolveBatchTeachers(batch);

                    return (
                      <motion.div
                        key={batch._id}
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Link
                          to={`/batches/${generateSlug(batch.name)}`}
                          state={{
                            batchId: batch._id,
                            batchName: batch.name?.trim(),
                          }}
                          className="block h-full"
                        >
                          <div className="h-full p-6 bg-card rounded-xl border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200 group">
                            <div className="flex justify-between items-start mb-3">
                              <h2 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate pr-2">
                                {batch.name?.trim()}
                              </h2>
                              <span className="px-2.5 py-1 text-[12px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-md shrink-0 uppercase tracking-wider">
                                {batch.weekday}
                              </span>
                            </div>

                            <div className="inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium bg-muted text-muted-foreground border border-border mb-4">
                              {getTradeLabel(batchTradeMap[batch._id])}
                            </div>

                            <div className="space-y-2.5 text-sm text-muted-foreground border-t border-border/50 pt-4">
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 shrink-0 opacity-70" />
                                <span className="font-medium text-foreground">
                                  {formatTime12Hour(batch.startTime)} - {formatTime12Hour(batch.endTime)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2.5">
                                {resolvedTeachers.length > 0 ? (
                                  <div className="flex items-center -space-x-1.5 shrink-0">
                                    {resolvedTeachers.slice(0, 3).map((teacher, idx) => (
                                      <UserAvatar
                                        key={teacher._id || teacher.email || idx}
                                        user={teacher}
                                        name={teacher.name}
                                        email={teacher.email}
                                        className="w-6 h-6 text-[10px] ring-2 ring-card"
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <User className="w-4 h-4 shrink-0 opacity-70" />
                                )}
                                <span className="truncate font-medium text-foreground">
                                  {Array.isArray(batch.teachers) && batch.teachers.length > 0
                                    ? batch.teachers
                                        .map((t) => t.name || t.email || "Unknown")
                                        .join(", ")
                                    : batch.teacherEmail || "TBA"}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Mobile inline pagination */}
          {!isLoading && totalPages > 1 && (
            <div className="md:hidden mt-6 pt-6 pb-8 border-t border-border">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                itemsPerPage={itemsPerPage}
                totalItems={filteredBatches.length}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>

        {/* Desktop fixed pagination */}
        {!isLoading && totalPages > 1 && (
          <div className="hidden md:block bg-background px-6 md:px-10 py-3 border-t border-border z-30 shrink-0">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              totalItems={filteredBatches.length}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      <ScrollToTopButton isVisible={showTopBtn} onScrollTop={scrollToTop} />
    </motion.div>
  );
};

export default BatchList;