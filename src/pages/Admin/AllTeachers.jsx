import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import useUserStore from "../../stores/useUserStore";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";

// --- Skeleton Loader Component ---
const TeacherCardSkeleton = () => (
  <div className="bg-card rounded-2xl border border-border/60 shadow-sm animate-pulse">
    <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Left side: Avatar and Info */}
      <div className="flex-1">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-muted rounded-full shrink-0" />
          <div className="flex-1 min-w-0 flex flex-col gap-2.5">
            <div className="h-5 w-48 bg-muted rounded" />
            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
              <div className="h-4 w-32 bg-muted/70 rounded" />
              <div className="h-4 w-24 bg-muted/70 rounded" />
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Classes count and chevron */}
      <div className="flex items-center justify-end gap-4 sm:ml-4 border-t sm:border-t-0 border-border/50 pt-4 sm:pt-0">
        <div className="flex gap-6">
          <div className="flex flex-col items-end gap-1.5">
            <div className="h-7 w-8 bg-muted rounded" />
            <div className="h-3 w-14 bg-muted/70 rounded" />
          </div>
          <div className="flex flex-col items-end gap-1.5 border-l border-border/50 pl-6">
            <div className="h-7 w-8 bg-muted rounded" />
            <div className="h-3 w-14 bg-muted/70 rounded" />
          </div>
        </div>
        <div className="w-6 h-6 bg-muted rounded shrink-0" />
      </div>
    </div>
  </div>
);

const AllTeachers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  // Container ref and Scroll State for the Sticky Header & Top Button
  const scrollContainerRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTopBtn, setShowTopBtn] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Adjust this value to display more/less items per page

  const teachers = useUserStore((state) => state.teachers);
  const getTeachers = useUserStore((state) => state.getTeachers);
  const isLoading = useUserStore((state) => state.isLoading);
  const error = useUserStore((state) => state.error);

  const navigate = useNavigate();

  useEffect(() => {
    if (!selectedTeacherId) {
      getTeachers();
    }
  }, [selectedTeacherId, getTeachers]);

  // Handle local container scroll for header transition and back-to-top button
  const handleScroll = (e) => {
    const scrollTop = e.target.scrollTop;
    setIsScrolled(scrollTop > 15);
    setShowTopBtn(scrollTop > 400); // Show button after scrolling 400px down
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Reset to first page and scroll to top whenever search term changes
  useEffect(() => {
    setCurrentPage(1);
    scrollToTop();
  }, [searchTerm]);

  // Filter Data
  const filteredTeachers = Array.isArray(teachers)
    ? teachers.filter(
        (teacher) =>
          teacher?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          teacher?.email?.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    : [];

  // Pagination Logic
  const totalPages = Math.ceil(filteredTeachers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTeachers = filteredTeachers.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

  const handleProfileClick = (teacher) => {
    navigate("/teachers/teacherprofile", {
      state: {
        userId: teacher?._id,
        studentId: teacher?._id,
        userData: teacher,
      },
    });
  };

  const pageVariants = {
    initial: { opacity: 0, y: 10 },
    in: { opacity: 1, y: 0 },
  };

  // Perfect Truncated Pagination Logic (Same as AllStudents)
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
    <motion.div
      initial="initial"
      animate="in"
      variants={pageVariants}
      transition={{ duration: 0.3 }}
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="h-full max-h-[calc(100vh)] overflow-y-auto bg-background relative flex flex-col custom-scrollbar"
    >
      <Helmet>
        <title>IOK - Teachers</title>
      </Helmet>
      <div className="max-w-[1600px] mx-auto w-full flex flex-col pb-8">
        {/* HEADER SECTION - Sticky relative to this scrollable container */}
        <div
          className={`sticky top-0 z-40 flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 md:px-8 pt-4 pb-4 transition-all duration-300 ${
            isScrolled
              ? "bg-background/85 backdrop-blur-xl border-b border-border shadow-sm"
              : "bg-background/85 backdrop-blur-xl border-b border-transparent"
          }`}
        >
          {!isScrolled && (
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                Teachers Directory
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                Manage and view all teachers along with their assigned courses.
              </p>
            </div>
          )}

          <div className="w-full md:max-w-md shrink-0">
            <div className="relative group w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-12 py-3 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
              />
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

        <div className="px-4 md:px-8 py-6 flex flex-col gap-6">
          {/* ERROR MESSAGE */}
          {error && (
            <div className="shrink-0 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive flex items-center gap-2 font-medium">
              <span>⚠️</span> {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col relative pb-4">
              <div className="flex flex-col gap-4">
                {[1, 2, 3, 4, 5].map((index) => (
                  <TeacherCardSkeleton key={index} />
                ))}
              </div>
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border border-dashed p-16 flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-1">
                No Teachers Found
              </h3>
              <p className="text-sm text-center">
                {searchTerm
                  ? "Try adjusting your search criteria."
                  : "No teachers available at the moment."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col relative pb-4">
              <div className="grid gap-4">
                <AnimatePresence mode="popLayout">
                  {paginatedTeachers.map((teacher, index) => (
                    <motion.div
                      layout
                      key={teacher._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleProfileClick(teacher)}
                      className="group bg-card rounded-2xl border border-border hover:border-primary hover:shadow-lg transition-all cursor-pointer overflow-hidden shadow-sm"
                    >
                      <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-4">
                            {teacher.profilePic ? (
                              <img
                                src={teacher.profilePic}
                                alt={teacher.name}
                                className="w-14 h-14 rounded-full object-cover bg-muted shrink-0 border-2 border-transparent group-hover:border-primary/20 transition-colors"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-lg shrink-0 group-hover:bg-primary/20 transition-colors">
                                {teacher.name.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                {teacher.name}
                              </h3>
                              <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1 truncate">
                                  <Mail
                                    size={16}
                                    className="text-muted-foreground/70 shrink-0"
                                  />
                                  <span className="truncate">
                                    {teacher.email}
                                  </span>
                                </div>
                                {teacher.phone && (
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Phone
                                      size={16}
                                      className="text-muted-foreground/70"
                                    />
                                    {teacher.phone}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-4 sm:ml-4 border-t sm:border-t-0 border-border/50 pt-4 sm:pt-0">
                          <div className="flex gap-6">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-primary leading-none mb-1">
                                {teacher.mainClasses?.length || 0}
                              </p>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                Courses
                              </p>
                            </div>
                            <div className="text-right border-l border-border/50 pl-6">
                              <p className="text-2xl font-bold text-primary leading-none mb-1">
                                {teacher.batches?.length || 0}
                              </p>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                                Batches
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-6 h-6 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-transform shrink-0" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* PAGINATION SECTION */}
          {!isLoading && totalPages > 1 && (
            <div className="shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 py-2 border-t border-border mt-2 pt-4">
              <p className="text-sm text-muted-foreground order-2 sm:order-1">
                Showing{" "}
                <span className="font-medium text-foreground">
                  {startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-foreground">
                  {Math.min(startIndex + itemsPerPage, filteredTeachers.length)}
                </span>{" "}
                of{" "}
                <span className="font-medium text-foreground">
                  {filteredTeachers.length}
                </span>{" "}
                teachers
              </p>

              <div className="flex items-center gap-2 order-1 sm:order-2">
                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.max(prev - 1, 1));
                    scrollToTop();
                  }}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1 overflow-x-auto sm:max-w-none no-scrollbar">
                  {getPageNumbers().map((number, idx) =>
                    number === "..." ? (
                      <span
                        key={`ellipsis-${idx}`}
                        className="w-9 h-9 flex items-center justify-center text-muted-foreground text-sm font-medium"
                      >
                        ...
                      </span>
                    ) : (
                      <button
                        key={number}
                        onClick={() => {
                          setCurrentPage(number);
                          scrollToTop();
                        }}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors shadow-sm ${
                          currentPage === number
                            ? "bg-primary text-primary-foreground"
                            : "bg-card border border-border text-foreground hover:bg-muted"
                        }`}
                      >
                        {number}
                      </button>
                    ),
                  )}
                </div>

                <button
                  onClick={() => {
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                    scrollToTop();
                  }}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BACK TO TOP BUTTON */}
      <AnimatePresence>
        {showTopBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-3 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 hover:shadow-xl transition-all focus:outline-none focus:ring-4 focus:ring-primary/30"
            aria-label="Back to top"
          >
            <ArrowUp className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AllTeachers;
