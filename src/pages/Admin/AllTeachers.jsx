import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronRight,
  ChevronLeft,
  Mail,
  Phone,
  User,
  X,
} from "lucide-react";
import useUserStore from "../../stores/useUserStore";
import { useNavigate } from "react-router-dom";

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

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5; // Change this value to display more/less items per page

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

  // Reset to first page whenever search term changes
  useEffect(() => {
    setCurrentPage(1);
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

  const handleTeacherClick = (teacher) => {
    setSelectedTeacher(teacher);
    setSelectedTeacherId(teacher._id);
  };

  const handleProfileClick = (teacher) => {
    navigate("/teacherprofile", {
      state: {
        userId: teacher?._id,
        studentId: teacher?._id,
        userData: teacher,
      },
    });
  };

  const pageVariants = {
    initial: { opacity: 0, x: -20 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: -20 },
  };

  const pageTransition = {
    type: "tween",
    ease: "easeInOut",
    duration: 0.3,
  };

  // Generate page numbers for specific page clicking
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      // Use constrained height (h-[100dvh] or h-screen) so the body doesn't scroll, but the inner container does
      className="h-[100dvh] bg-background p-4 md:p-8 transition-colors duration-300 flex flex-col"
    >
      <div className="max-w-7xl mx-auto w-full flex flex-col h-full gap-6">
        {/* HEADER SECTION - Fixed at the top */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0 relative">
          <div>
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              Teachers Directory
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage and view all teachers along with their assigned courses.
            </p>
          </div>

          {/* SEARCH BOX - Sticky on Mobile */}
          <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md py-2 md:py-0 w-full md:max-w-md shrink-0 md:relative md:z-auto">
            <div className="relative group w-full">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-11 pr-12 py-3.5 bg-card border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm text-base"
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

        {/* ERROR MESSAGE */}
        {error && (
          <div className="shrink-0 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive flex items-center gap-2 font-medium">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* LIST SECTION - Independent Scrollbar */}
        <div className="flex-1 overflow-y-auto pr-2 pb-4 custom-scrollbar relative">
          {isLoading ? (
            <div className="flex flex-col gap-4">
              {[1, 2, 3, 4, 5].map((index) => (
                <TeacherCardSkeleton key={index} />
              ))}
            </div>
          ) : filteredTeachers.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border border-dashed p-12 text-center h-full flex flex-col items-center justify-center">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No Teachers Found
              </h3>
              <p className="text-muted-foreground">
                {searchTerm
                  ? "Try adjusting your search criteria or clearing the input."
                  : "No teachers available at the moment."}
              </p>
            </div>
          ) : (
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
          )}
        </div>

        {/* PAGINATION SECTION - Fixed at the bottom */}
        {!isLoading && totalPages > 1 && (
          <div className="shrink-0 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
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

export default AllTeachers;
