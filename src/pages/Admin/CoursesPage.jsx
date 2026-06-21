import React, { useState, useEffect } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { motion } from "framer-motion";
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
} from "lucide-react";
import useClassStore from "../../stores/useClassStore";
import useTradeStore from "../../stores/useTradeStore";
import { TRADES } from "../../constants/trades";

// --- Skeleton Loader Component ---
const CourseSkeleton = () => (
  <div className="bg-card rounded-2xl border border-border p-6 flex flex-col h-[220px] animate-pulse">
    <div className="flex justify-between items-start mb-4">
      <div className="w-full">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="h-6 bg-muted rounded-md w-2/3"></div>
          <div className="h-5 bg-muted rounded-full w-20 shrink-0"></div>
        </div>
        <div className="h-4 bg-muted rounded-md w-1/2 mb-2"></div>
      </div>
    </div>
    <div className="flex flex-wrap gap-2 mb-6 mt-2">
      <div className="h-7 bg-muted rounded-lg w-20"></div>
      <div className="h-7 bg-muted rounded-lg w-24"></div>
      <div className="h-7 bg-muted rounded-lg w-16"></div>
    </div>
    <div className="pt-4 mt-auto border-t border-border flex items-center justify-between">
      <div className="h-5 bg-muted rounded-md w-28"></div>
      <div className="h-5 bg-muted rounded-md w-5"></div>
    </div>
  </div>
);

const CoursesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTradeId, setSelectedTradeId] = useState("");
  const navigate = useNavigate();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // 6 items fits a 3x2 grid perfectly

  const allClass = useClassStore((state) => state.allClass);
  const getClasses = useClassStore((state) => state.getClasses);
  const isLoading = useClassStore((state) => state.isLoading);
  const error = useClassStore((state) => state.error);

  const courseTradeMap = useTradeStore((state) => state.courseTradeMap) || {};
  const getTradeLabel = useTradeStore((state) => state.getTradeLabel);
  const getTradeFromCourseName = useTradeStore(
    (state) => state.getTradeFromCourseName,
  );

  useEffect(() => {
    getClasses();
  }, [getClasses]);

  // Reset to first page whenever search term or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTradeId]);

  // SAFELY filter classes to prevent React crashes if data is missing
  const filteredClasses = Array.isArray(allClass)
    ? allClass.filter((item) => {
        if (!item) return false;

        const nameStr = typeof item.name === "string" ? item.name : "";
        const teacherStr = Array.isArray(item.teachers)
          ? item.teachers
              .map((t) => (typeof t === "string" ? t : t.name))
              .join(" ")
          : typeof item.teacherName === "string"
            ? item.teacherName
            : "";

        const matchesSearch =
          nameStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacherStr.toLowerCase().includes(searchTerm.toLowerCase());

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
      })
    : [];

  // Pagination Logic
  const totalPages = Math.ceil(filteredClasses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClasses = filteredClasses.slice(
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
        styles: "bg-warning/10 text-warning border-warning/20",
      };
    else if (now > end)
      return {
        label: "Course Ended",
        styles: "bg-muted text-muted-foreground border-border",
      };
    else
      return {
        label: "Available",
        styles: "bg-success/10 text-success border-success/20",
      };
  };

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: 10 },
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
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-background p-4 md:p-8 transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto space-y-6">
          {/* TITLE & HEADER CONTROLS */}
          <div className="flex flex-col gap-5">
            <div>
              <h1 className="text-3xl font-bold text-foreground tracking-tight">
                Courses Directory
              </h1>
              <p className="text-muted-foreground mt-1">
                Overview of all active courses, fees, and student allocations.
              </p>
            </div>

            {/* COMPACT CONTROL PANEL */}
            <div className="bg-card p-4 rounded-2xl border border-border shadow-sm flex flex-col gap-4">
              {/* Row 1: Search + Add + Create */}
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                {/* Search */}
                <div className="relative group w-full flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search by class name or instructor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-10 py-2.5 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-sm"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm("")}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-destructive transition-colors focus:outline-none"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                  <Link
                    to="/courses/addnewstudent"
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-background border border-border hover:border-primary/50 text-foreground px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm hover:shadow-md active:scale-95 text-sm"
                  >
                    <Plus size={16} className="text-primary" />
                    Add Student
                  </Link>

                  <Link
                    to="/courses/createcourse"
                    className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 bg-primary hover:opacity-90 text-primary-foreground px-4 py-2.5 rounded-xl font-medium transition-all shadow-sm shadow-primary/20 hover:shadow-primary/30 active:scale-95 text-sm"
                  >
                    <Plus size={16} />
                    Create Course
                  </Link>
                </div>
              </div>

              {/* Row 2: Trade Filter */}
              <div className="flex items-center gap-3">
                <label className="text-sm font-semibold text-foreground/80 whitespace-nowrap pl-1 hidden sm:block">
                  Filter Trade:
                </label>
                <select
                  value={selectedTradeId}
                  onChange={(e) => setSelectedTradeId(e.target.value)}
                  className="w-full md:w-64 px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm cursor-pointer appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 12px center",
                  }}
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
            </div>
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive flex items-center gap-2 font-medium">
              <span>⚠️</span> {error}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: itemsPerPage }).map((_, i) => (
                <CourseSkeleton key={i} />
              ))}
            </div>
          ) : filteredClasses.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border border-dashed p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                No Courses found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedTradeId !== ""
                  ? "We couldn't find any courses matching your search or filter criteria."
                  : "Get started by creating your first class."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedClasses.map((classItem) => {
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
                  <div
                    key={classItem?._id || Math.random()}
                    onClick={() => handleCourseClick(classItem)}
                    className="group bg-card rounded-2xl border border-border p-6 cursor-pointer hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative overflow-hidden flex flex-col"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="flex justify-between items-start mb-4">
                      <div className="w-full">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                            {classItem?.name || "Unknown Course"}
                          </h3>
                          <span
                            className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider border ${status.styles} whitespace-nowrap`}
                          >
                            {status.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground line-clamp-1">
                          Instructor:{" "}
                          {classItem?.teachers && classItem.teachers.length > 0
                            ? classItem.teachers
                                .map((t) =>
                                  typeof t === "string" ? t : t.name,
                                )
                                .join(", ")
                            : classItem?.teacherName || "Unassigned"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-6 mt-2">
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 rounded-lg text-xs font-medium text-primary border border-primary/20">
                        {tradeName}
                      </div>
                      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-muted/50 rounded-lg text-xs font-medium text-muted-foreground border border-border/50">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground/70" />
                        {classItem?.duration || 0} Months
                      </div>
                      <div className="flex items-center gap-1 px-2.5 py-1.5 bg-muted/50 rounded-lg text-xs font-medium text-muted-foreground border border-border/50">
                        <IndianRupee className="w-3.5 h-3.5 text-muted-foreground/70" />
                        {classItem?.fees || 0}
                      </div>
                    </div>

                    <div className="pt-4 mt-auto border-t border-border flex items-center justify-between">
                      <div className="flex items-center text-muted-foreground text-sm gap-2">
                        <Users className="w-4 h-4 text-muted-foreground/70" />
                        <span>
                          <strong className="text-foreground">
                            {classItem?.students?.length || 0}
                          </strong>{" "}
                          Enrolled
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <p className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-foreground">
                  {Math.min(startIndex + itemsPerPage, filteredClasses.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {filteredClasses.length}
                </span>{" "}
                courses
              </p>

              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
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
      <Outlet />
    </>
  );
};

export default CoursesPage;
