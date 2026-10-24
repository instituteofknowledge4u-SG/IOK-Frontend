import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Plus,
  Users,
  BookOpen,
  ChevronRight,
  ChevronLeft,
  Calendar,
  IndianRupee,
  X,
  ArrowUp,
  RefreshCw,
} from "lucide-react";
import useClassStore from "../../stores/useClassStore";
import useTradeStore from "../../stores/useTradeStore";
import { TRADES } from "../../constants/trades";
import { Helmet } from "react-helmet-async";

// ==========================================
// 1. SHARED UI COMPONENTS
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
  <div className="bg-background rounded-xl border border-border/60 border-dashed p-16 flex flex-col items-center justify-center text-muted-foreground min-h-[300px]">
    <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
      <BookOpen className="w-8 h-8 text-muted-foreground/50" />
    </div>
    <h3 className="text-lg font-semibold text-foreground tracking-tight">No courses found</h3>
    <p className="text-sm mt-1 text-center max-w-sm">
      {isSearchActive
        ? "We couldn't find any courses matching your search or filter criteria."
        : "Get started by creating your first course."}
    </p>
  </div>
));

const CourseSkeleton = () => (
  <div className="bg-card rounded-xl border border-border p-6 flex flex-col h-[200px] animate-pulse shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="w-full">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="h-5 bg-muted rounded-md w-2/3"></div>
          <div className="h-5 bg-muted rounded-full w-20 shrink-0"></div>
        </div>
        <div className="h-4 bg-muted rounded-md w-1/2 mb-2"></div>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 mb-6 mt-2">
      <div className="h-7 bg-muted/60 rounded-md w-20"></div>
      <div className="h-7 bg-muted/60 rounded-md w-24"></div>
      <div className="h-7 bg-muted/60 rounded-md w-16"></div>
    </div>
    <div className="pt-4 mt-auto border-t border-border/50 flex items-center justify-between">
      <div className="h-4 bg-muted rounded-md w-24"></div>
      <div className="h-4 bg-muted rounded-md w-5"></div>
    </div>
  </div>
);

// ==========================================
// 2. MAIN CONTAINER COMPONENT
// ==========================================
const CoursesPage = () => {
  const navigate = useNavigate();

  // Initialize states with values from sessionStorage if they exist
  const [searchTerm, setSearchTerm] = useState(() => sessionStorage.getItem("courseDirectory_search") || "");
  const [selectedTradeId, setSelectedTradeId] = useState(() => sessionStorage.getItem("courseDirectory_trade") || "");
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = sessionStorage.getItem("courseDirectory_page");
    return savedPage ? parseInt(savedPage, 10) : 1;
  });

  const itemsPerPage = 12; // Adjusted to 12 to fit a robust 3-column grid uniformly

  // Scroll Container State
  const scrollContainerRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  const allClass = useClassStore((state) => state.allClass);
  const getClasses = useClassStore((state) => state.getClasses);
  const isLoading = useClassStore((state) => state.isLoading);
  const error = useClassStore((state) => state.error);

  const courseTradeMap = useTradeStore((state) => state.courseTradeMap) || {};
  const getTradeLabel = useTradeStore((state) => state.getTradeLabel);
  const getTradeFromCourseName = useTradeStore((state) => state.getTradeFromCourseName);

  // === THE FIX ===
  // Only fetch classes if they aren't already loaded in the global state
  useEffect(() => {
    if (!allClass || allClass.length === 0) {
      getClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Force refetch on manual refresh
  const handleManualRefresh = useCallback(() => {
    getClasses();
  }, [getClasses]);

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
    setSearchTerm(val);
    sessionStorage.setItem("courseDirectory_search", val);
    setCurrentPage(1);
    sessionStorage.setItem("courseDirectory_page", "1");
    scrollToTop();
  }, [scrollToTop]);

  const handleTradeChange = useCallback((val) => {
    setSelectedTradeId(val);
    sessionStorage.setItem("courseDirectory_trade", val);
    setCurrentPage(1);
    sessionStorage.setItem("courseDirectory_page", "1");
    scrollToTop();
  }, [scrollToTop]);

  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    sessionStorage.setItem("courseDirectory_page", page.toString());
    scrollToTop();
  }, [scrollToTop]);

  // SAFELY filter classes to prevent React crashes if data is missing
  const filteredClasses = useMemo(() => {
    if (!Array.isArray(allClass)) return [];
    
    return allClass.filter((item) => {
      if (!item) return false;

      const nameStr = typeof item.name === "string" ? item.name : "";
      const teacherStr = Array.isArray(item.teachers)
        ? item.teachers
            .map((t) => (typeof t === "string" ? t : t.name))
            .join(" ")
        : typeof item.teacherName === "string"
          ? item.teacherName
          : "";

      const query = searchTerm.toLowerCase();
      const matchesSearch =
        nameStr.toLowerCase().includes(query) ||
        teacherStr.toLowerCase().includes(query);

      const tradeId =
        courseTradeMap[item._id] ||
        item.tradeId ||
        (getTradeFromCourseName ? getTradeFromCourseName(nameStr) : "") ||
        "";

      const matchesTrade =
        selectedTradeId === ""
          ? true
          : selectedTradeId === "unassigned"
            ? !tradeId
            : tradeId === selectedTradeId;

      return matchesSearch && matchesTrade;
    });
  }, [allClass, searchTerm, selectedTradeId, courseTradeMap, getTradeFromCourseName]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);

  // Failsafe: if filtered results shrink
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
      sessionStorage.setItem("courseDirectory_page", totalPages.toString());
    }
  }, [totalPages, currentPage]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClasses = filteredClasses.slice(startIndex, startIndex + itemsPerPage);

  const getClassStatus = (startDate, endDate, isActive) => {
    if (!isActive)
      return {
        label: "Unavailable",
        styles: "bg-destructive/10 text-destructive border-destructive/20",
      };
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (now < start)
      return {
        label: "Not Started",
        styles: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      };
    else if (now > end)
      return {
        label: "Ended",
        styles: "bg-muted text-muted-foreground border-border",
      };
    else
      return {
        label: "Available",
        styles: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      };
  };

  const handleCourseClick = (classItem) => {
    const safeUrlSlug = (classItem.name || "course")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    navigate(`/courses/${safeUrlSlug}`, {
      state: {
        courseId: classItem._id,
        courseName: classItem.name,
      },
    });
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="h-full max-h-[calc(100vh)] overflow-hidden bg-background relative flex flex-col"
      >
        <Helmet>
          <title>IOK - Courses</title>
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
                Courses Directory
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Overview of all active courses, fees, and student allocations.
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
                  placeholder="Search courses or instructor..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2.5 bg-background border border-border hover:border-border/80 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Trade Filter */}
              <div className="w-[calc(100%-3rem)] sm:w-40 relative">
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

              <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                <button
                  onClick={handleManualRefresh}
                  disabled={isLoading}
                  title="Refresh Data"
                  className="px-3 py-2.5 bg-background border border-border rounded-lg text-foreground hover:bg-muted disabled:opacity-50 transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center justify-center shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-primary" : "text-muted-foreground"}`} />
                </button>
                
                <Link
                  to="/courses/createcourse"
                  className="flex-1 sm:flex-none whitespace-nowrap px-4 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-lg text-sm transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Plus size={16} />
                  <span className="hidden sm:inline">Create Course</span>
                  <span className="sm:hidden">Course</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Scrollable Container */}
          <div 
            className="flex-1 overflow-y-auto custom-scrollbar px-6 md:px-10 py-4 relative"
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive flex items-center gap-3 font-medium text-sm">
                <span className="shrink-0">⚠️</span>
                <p>{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <CourseSkeleton key={i} />
                ))}
              </div>
            ) : filteredClasses.length === 0 ? (
              <EmptyState isSearchActive={!!searchTerm || !!selectedTradeId} />
            ) : (
              <div className="flex flex-col relative pb-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
                  <AnimatePresence mode="popLayout">
                    {paginatedClasses.map((classItem, index) => {
                      if (!classItem) return null;

                      const status = getClassStatus(
                        classItem?.startDate,
                        classItem?.endDate,
                        classItem?.isActive,
                      );

                      const derivedTradeId =
                        courseTradeMap[classItem?._id] ||
                        classItem?.tradeId ||
                        (getTradeFromCourseName
                          ? getTradeFromCourseName(classItem?.name)
                          : "");
                      const tradeName = getTradeLabel
                        ? getTradeLabel(derivedTradeId)
                        : "Unknown Trade";

                      return (
                        <motion.div
                          key={classItem?._id || Math.random()}
                          layout
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => handleCourseClick(classItem)}
                          className="group bg-card rounded-xl border border-border shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 cursor-pointer p-6 flex flex-col relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                          <div className="flex justify-between items-start mb-4">
                            <div className="w-full">
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                                  {classItem?.name || "Unknown Course"}
                                </h3>
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase tracking-wider border ${status.styles} shrink-0`}>
                                  {status.label}
                                </span>
                              </div>
                              <p className="text-sm font-medium text-muted-foreground line-clamp-1">
                                Instructor:{" "}
                                {classItem?.teachers && classItem.teachers.length > 0
                                  ? classItem.teachers
                                      .map((t) => (typeof t === "string" ? t : t.name))
                                      .join(", ")
                                  : classItem?.teacherName || "Unassigned"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-6 mt-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 rounded-md text-[11px] font-medium text-primary border border-primary/20">
                              {tradeName}
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted/50 rounded-md text-[11px] font-medium text-muted-foreground border border-border/50">
                              <Calendar className="w-3.5 h-3.5 opacity-70" />
                              {classItem?.duration || 0} Months
                            </div>
                            <div className="flex items-center gap-1 px-2.5 py-1 bg-muted/50 rounded-md text-[11px] font-medium text-muted-foreground border border-border/50">
                              <IndianRupee className="w-3.5 h-3.5 opacity-70" />
                              {classItem?.fees || 0}
                            </div>
                          </div>

                          <div className="pt-4 mt-auto border-t border-border/50 flex items-center justify-between">
                            <div className="flex items-center text-muted-foreground text-sm gap-2">
                              <Users className="w-4 h-4 opacity-70" />
                              <span>
                                <strong className="text-foreground">
                                  {classItem?.students?.length || 0}
                                </strong>{" "}
                                Enrolled
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                          </div>
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
                  totalItems={filteredClasses.length}
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
                totalItems={filteredClasses.length}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>

        <ScrollToTopButton isVisible={showTopBtn} onScrollTop={scrollToTop} />
      </motion.div>
      <Outlet />
    </>
  );
};

export default CoursesPage;