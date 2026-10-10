import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  User,
  X,
  ArrowUp,
  RefreshCw,
  BookOpen,
  Users,
} from "lucide-react";
import useUserStore from "../../stores/useUserStore";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { generateSlug } from "../../util/generateSlug";

// ==========================================
// 1. HELPER FUNCTIONS FOR AVATAR
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

// ==========================================
// 2. SHARED UI COMPONENTS
// ==========================================
const DirectoryHeader = React.memo(
  ({ isScrolled, searchTerm, onSearchChange, onRefresh, isRefreshing }) => (
    <div
      className={`sticky top-0 z-40 flex flex-col md:flex-row md:items-end justify-between gap-4 px-6 md:px-10 pb-4 transition-all duration-300 ${
        isScrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border shadow-sm pt-4"
          : "bg-background/90 backdrop-blur-xl border-b border-transparent pt-4 md:pt-8"
      }`}
    >
      <div className="hidden md:block flex-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Teachers Directory
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage and view all teachers along with their assigned courses.
        </p>
      </div>

      <div className="w-full md:w-[400px] shrink-0 flex gap-2">
        <div className="relative group w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by name or email..."
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

const EmptyState = React.memo(({ isSearchActive }) => (
  <div className="bg-background rounded-xl border border-border/60 border-dashed p-16 flex flex-col items-center justify-center text-muted-foreground">
    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
      <Search className="w-8 h-8 text-muted-foreground/50" />
    </div>
    <h3 className="text-lg font-semibold text-foreground tracking-tight">
      No teachers found
    </h3>
    <p className="text-sm mt-1 text-center max-w-sm">
      {isSearchActive
        ? "We couldn't find any teachers matching your search criteria. Try a different term."
        : "There are no teachers available in the directory at the moment."}
    </p>
  </div>
));

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

const Pagination = React.memo(
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

const TeacherCardSkeleton = () => (
  <div className="bg-card rounded-xl p-6 border border-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-pulse">
    <div className="flex items-center gap-4">
      <div className="w-12 h-12 rounded-full bg-muted shrink-0" />
      <div className="flex flex-col gap-2 w-full max-w-[200px]">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="flex gap-2">
          <div className="h-3 w-20 bg-muted/60 rounded" />
          <div className="h-3 w-20 bg-muted/60 rounded" />
        </div>
      </div>
    </div>
    <div className="hidden sm:flex items-center gap-6 border-l border-border/50 pl-6">
      <div className="flex flex-col items-center gap-1">
        <div className="h-6 w-8 bg-muted rounded" />
        <div className="h-2 w-12 bg-muted/60 rounded" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="h-6 w-8 bg-muted rounded" />
        <div className="h-2 w-12 bg-muted/60 rounded" />
      </div>
    </div>
  </div>
);

// ==========================================
// 3. MAIN CONTAINER COMPONENT
// ==========================================
const AllTeachers = () => {
  // Initialize states with values from sessionStorage if they exist
  const [searchTerm, setSearchTerm] = useState(() => {
    return sessionStorage.getItem("teachersDirectory_search") || "";
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = sessionStorage.getItem("teachersDirectory_page");
    return savedPage ? parseInt(savedPage, 10) : 1;
  });

  const [selectedTeacherId, setSelectedTeacherId] = useState(null);

  // Container ref and Scroll State for the Sticky Header & Top Button
  const scrollContainerRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const itemsPerPage = 10;

  const teachers = useUserStore((state) => state.teachers);
  const getTeachers = useUserStore((state) => state.getTeachers);
  const isLoading = useUserStore((state) => state.isLoading);
  const error = useUserStore((state) => state.error);

  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedTeacherId && (!teachers || teachers.length === 0)) {
      getTeachers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeacherId]);

  const handleManualRefresh = useCallback(() => {
    getTeachers();
  }, [getTeachers]);

  // Handle local container scroll for header transition and back-to-top button
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
      sessionStorage.setItem("teachersDirectory_search", val);
      setCurrentPage(1); // Reset to page 1 ONLY when the user actively types
      sessionStorage.setItem("teachersDirectory_page", "1");
      scrollToTop();
    },
    [scrollToTop],
  );

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPage(page);
      sessionStorage.setItem("teachersDirectory_page", page.toString());
      scrollToTop();
    },
    [scrollToTop],
  );

  // Filter Data
  const filteredTeachers = useMemo(() => {
    if (!Array.isArray(teachers)) return [];
    const query = searchTerm.toLowerCase().trim();
    if (!query) return teachers;

    return teachers.filter(
      (teacher) =>
        teacher?.name?.toLowerCase().includes(query) ||
        teacher?.email?.toLowerCase().includes(query),
    );
  }, [teachers, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);

  // Failsafe: if filtered results shrink (e.g., deleted teacher) and the current page is now empty, adjust back
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
      sessionStorage.setItem("teachersDirectory_page", totalPages.toString());
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeachers = filteredTeachers.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleProfileClick = (teacher) => {
    navigate(`/profile/${generateSlug(teacher?.name)}`, {
      state: {
        userId: teacher?._id,
        userData: teacher,
      },
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-full max-h-[calc(100vh)] overflow-hidden bg-background relative flex flex-col"
    >
      <Helmet>
        <title>IOK - Teachers</title>
      </Helmet>

      <div className="max-w-6xl mx-auto w-full flex flex-col h-full overflow-hidden relative">
        <DirectoryHeader
          isScrolled={isScrolled}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          onRefresh={handleManualRefresh}
          isRefreshing={isLoading}
        />

        {/* Scrollable Container just for teachers */}
        <div
          className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 py-4 relative"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          {/* ERROR MESSAGE */}
          {error && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-3 font-medium text-sm">
              <span className="shrink-0">⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map((index) => (
                <TeacherCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredTeachers.length === 0 ? (
            <EmptyState isSearchActive={!!searchTerm} />
          ) : (
            <div className="flex flex-col relative pb-4">
              <div className="flex flex-col gap-4 mt-2">
                <AnimatePresence mode="popLayout">
                  {paginatedTeachers.map((teacher, index) => {
                    const initials = getInitials(teacher.name);
                    const avatarColor = getAvatarColor(teacher.name);

                    return (
                      <motion.div
                        layout
                        key={teacher._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleProfileClick(teacher)}
                        className="bg-card rounded-xl border border-border shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200 cursor-pointer p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
                      >
                        {/* Left Side: Avatar & Basic Info */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex items-center gap-4">
                            {teacher.profilePic ? (
                              <img
                                src={teacher.profilePic}
                                alt={teacher.name}
                                className="w-12 h-12 rounded-full object-cover border border-border bg-muted shrink-0"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(initials || "User")}&background=random&color=fff`;
                                }}
                              />
                            ) : (
                              <div
                                className={`w-12 h-12 rounded-full ${avatarColor} text-white flex items-center justify-center shrink-0 font-bold text-lg border shadow-sm`}
                              >
                                {initials ? initials : <User size={20} />}
                              </div>
                            )}

                            <div>
                              <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="text-base font-semibold text-foreground tracking-tight">
                                  {teacher.name || "Unnamed Teacher"}
                                </h3>
                              </div>
                              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                                {teacher.email && (
                                  <div className="flex items-center gap-1.5">
                                    <Mail size={13} className="opacity-70" />
                                    <span>{teacher.email}</span>
                                  </div>
                                )}
                                {teacher.phone && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone size={13} className="opacity-70" />
                                    <span>{teacher.phone}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Side: Stats (Courses & Batches) */}
                        <div className="flex items-center gap-4 sm:gap-6 pt-4 border-t border-border/50 sm:pt-0 sm:border-t-0 sm:border-l sm:pl-6 justify-between sm:justify-end">
                          <div className="flex gap-6 shrink-0">
                            <div className="flex flex-col items-center sm:items-end justify-center">
                              <div className="flex items-center gap-1.5 text-primary">
                                <BookOpen size={16} />
                                <span className="text-xl font-bold leading-none">
                                  {teacher.mainClasses?.length || 0}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">
                                Courses
                              </p>
                            </div>

                            <div className="w-px h-8 bg-border/60 hidden sm:block mx-1"></div>

                            <div className="flex flex-col items-center sm:items-end justify-center">
                              <div className="flex items-center gap-1.5 text-primary">
                                <Users size={16} />
                                <span className="text-xl font-bold leading-none">
                                  {teacher.batches?.length || 0}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold mt-1">
                                Batches
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground/50 shrink-0 hidden sm:block" />
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Mobile inline pagination - scrolls up with content */}
          {!isLoading && totalPages > 1 && (
            <div className="md:hidden mt-6 pt-6 pb-8 border-t border-border">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                startIndex={startIndex}
                itemsPerPage={itemsPerPage}
                totalItems={filteredTeachers.length}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>

        {/* Desktop fixed pagination - stays statically glued to the bottom */}
        {!isLoading && totalPages > 1 && (
          <div className="hidden md:block bg-background px-6 md:px-10 py-3 border-t border-border z-30 shrink-0">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              startIndex={startIndex}
              itemsPerPage={itemsPerPage}
              totalItems={filteredTeachers.length}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      <ScrollToTopButton isVisible={showTopBtn} onScrollTop={scrollToTop} />
    </motion.div>
  );
};

export default AllTeachers;
