import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useBatchStore from "../../stores/useBatchStore";
import useAuthStore from "../../stores/useAuthStore";
import useUserStore from "../../stores/useUserStore";
import useClassStore from "../../stores/useClassStore";
import {
  Loader2,
  Trash2,
  AlertTriangle,
  X,
  BookOpen,
  Clock,
  Calendar,
  Users,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "../../components/UI/Button";
import { generateSlug } from "../../util/generateSlug";
import { canTeacherAccessBatch } from "../../util/teacherAccessControl";

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
                className="px-4 py-2 rounded-xl bg-destructive hover:opacity-90 text-destructive-foreground shadow-sm shadow-destructive/20 hover:-translate-y-0.5 transition-all font-medium flex items-center gap-2"
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

// --- Page Level Skeleton Loader ---
const BatchSkeleton = () => (
  <div className="container mx-auto px-4 py-8 max-w-6xl min-h-screen">
    <div className="w-24 h-10 bg-muted animate-pulse rounded-xl mb-6 mt-2"></div>
    <div className="p-8 rounded-3xl bg-card border border-border shadow-sm mb-8 mt-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-1/2">
          <div className="h-10 w-3/4 bg-muted animate-pulse rounded-xl mb-3"></div>
          <div className="h-6 w-1/2 bg-muted animate-pulse rounded-lg"></div>
        </div>
        <div className="flex gap-3">
          <div className="w-20 h-10 bg-muted animate-pulse rounded-lg"></div>
          <div className="w-28 h-10 bg-muted animate-pulse rounded-xl"></div>
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-24 bg-muted animate-pulse rounded-2xl"
          ></div>
        ))}
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded-lg mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-32 bg-muted animate-pulse rounded-2xl"
              ></div>
            ))}
          </div>
        </div>
        <div>
          <div className="h-8 w-48 bg-muted animate-pulse rounded-lg mb-4"></div>
          <div className="h-12 w-full bg-muted animate-pulse rounded-xl mb-4"></div>
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 flex items-center gap-4 border-b border-border last:border-0"
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-muted animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded"></div>
                  <div className="h-3 w-1/4 bg-muted animate-pulse rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div className="h-[400px] bg-card border border-border shadow-sm rounded-3xl animate-pulse sticky top-8"></div>
      </div>
    </div>
  </div>
);

// --- Student Row Sub-component ---
const StudentRow = ({
  baseStudent,
  mainClassName,
  canDelete,
  canViewProfile,
  onDelete,
  getUserById,
}) => {
  const navigate = useNavigate();
  const [details, setDetails] = useState(baseStudent);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setIsFetching(true);
      try {
        const data = await getUserById(baseStudent._id);
        if (isMounted && data) {
          setDetails((prev) => ({ ...prev, ...data }));
        }
      } catch (e) {
        console.error("Failed to fetch student details", e);
      } finally {
        if (isMounted) setIsFetching(false);
      }
    };

    if (baseStudent._id) {
      fetchDetails();
    } else {
      setIsFetching(false);
    }

    return () => {
      isMounted = false;
    };
  }, [baseStudent._id, getUserById]);

  // Navigation Function
  const handleViewProfile = () => {
    navigate("/studentprofile", {
      state: {
        userId: details._id,
        studentId: details._id,
        userData: details, // Using the freshly fetched details
      },
    });
  };

  if (isFetching) {
    return (
      <motion.li
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-4 w-full">
          <div className="w-12 h-12 shrink-0 rounded-full bg-muted animate-pulse border border-border"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 max-w-[50%] bg-muted animate-pulse rounded"></div>
            <div className="h-3 w-56 max-w-[70%] bg-muted animate-pulse rounded"></div>
            <div className="h-3 w-32 max-w-[40%] bg-muted animate-pulse rounded"></div>
          </div>
        </div>
      </motion.li>
    );
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, x: -20, height: 0 }}
      transition={{ duration: 0.2 }}
      className={`p-4 flex items-center justify-between transition-colors overflow-hidden ${
        canViewProfile ? "hover:bg-muted/50 group" : ""
      }`}
    >
      {/* Clickable Area for Profile Navigation */}
      <div
        className={`flex items-center gap-4 flex-1 ${canViewProfile ? "cursor-pointer" : ""}`}
        onClick={canViewProfile ? handleViewProfile : undefined}
        title={canViewProfile ? "View Student Profile" : "Student Details"}
      >
        <div
          className={`w-12 h-12 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg shadow-inner overflow-hidden border border-border transition-all ${canViewProfile ? "group-hover:ring-2 ring-primary/30" : ""}`}
        >
          {details?.profilePic || details?.profilePicture ? (
            <img
              src={details.profilePic || details.profilePicture}
              alt={details.name}
              className="w-full h-full object-cover"
            />
          ) : (
            (
              details.name?.charAt(0) ||
              details.email?.charAt(0) ||
              "S"
            ).toUpperCase()
          )}
        </div>
        <div>
          <p
            className={`font-bold text-foreground transition-colors ${canViewProfile ? "group-hover:text-primary" : ""}`}
          >
            {details.name || "Unknown Student"}
          </p>
          <p className="text-sm text-muted-foreground">
            {details.email} {details.phone ? `• ${details.phone}` : ""}
          </p>
          <p className="text-xs font-medium text-primary mt-1">
            Course: {mainClassName}
          </p>
        </div>
      </div>

      {/* Delete Button (Separate from clickable profile area) */}
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevents click from bubbling to the profile navigation
            onDelete(baseStudent);
          }}
          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors ml-4 shrink-0"
          title="Remove Student"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      )}
    </motion.li>
  );
};

// --- Main Component ---
export default function BatchDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { batchName } = useParams();

  const id = location.state?.batchId;
  const fallbackName =
    location.state?.batchName ||
    (batchName ? batchName.replace(/-/g, " ") : "Batch Details");

  const [isAdding, setIsAdding] = useState(false);

  const {
    currentBatch,
    fetchBatchById,
    addStudentToBatch,
    removeStudentFromBatch,
    deleteBatch,
    isLoading,
  } = useBatchStore();

  const { user: authUser } = useAuthStore();
  const userRole = useAuthStore((state) => state.userRole);

  const { students, getStudents, getUserById } = useUserStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [studentEmail, setStudentEmail] = useState("");
  const [mainClassId, setMainClassId] = useState("");

  const [listSearch, setListSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Do not fetch students list if the user is a Student
  useEffect(() => {
    if (userRole !== "Student") {
      getStudents();
    }
  }, [getStudents, userRole]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentBatch?.mainClasses?.length > 0 && !mainClassId) {
      setMainClassId(currentBatch.mainClasses[0]._id);
    }
  }, [currentBatch, mainClassId]);

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  useEffect(() => {
    if (id) {
      fetchBatchById(id);
    } else {
      navigate("/batches");
    }
  }, [id, fetchBatchById, navigate]);

  useEffect(() => {
    if (currentBatch && id) {
      if (userRole === "Teacher") {
        const teacherBatches = authUser?.batches || [];
        const hasAccess = canTeacherAccessBatch(
          id,
          teacherBatches,
          userRole,
          currentBatch.teacherEmail,
          authUser?.email,
          currentBatch,
          authUser?._id,
        );

        if (!hasAccess) {
          toast.error("You can only view batches assigned to you");
          navigate("/access-denied");
        }
      }
    }
  }, [currentBatch, id, userRole, authUser, navigate]);

  // --- Filtering & Pagination ---
  const filteredBatchStudents =
    currentBatch?.students?.filter((student) => {
      const term = listSearch.toLowerCase();
      return (
        student.name?.toLowerCase().includes(term) ||
        student.email?.toLowerCase().includes(term)
      );
    }) || [];

  const totalPages = Math.ceil(filteredBatchStudents.length / pageSize) || 1;
  const paginatedStudents = filteredBatchStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [listSearch]);

  const batchStudentEmails = new Set(
    currentBatch?.students?.map((s) => s.email) || [],
  );

  const availableStudentsToAdd =
    students?.filter((student) => {
      if (batchStudentEmails.has(student.email)) return false;
      if (!mainClassId) return false;
      return student.mainClasses?.some((sc) => (sc._id || sc) === mainClassId);
    }) || [];

  const searchFilteredAvailable = availableStudentsToAdd.filter(
    (student) =>
      student.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectStudent = (student) => {
    setStudentEmail(student.email);
    setSearchQuery(`${student.name || "Unknown"} (${student.email})`);
    setIsDropdownOpen(false);
  };

  // --- OPTIMIZED ADD STUDENT ---
  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (userRole === "Teacher") {
      toast.error("Teachers cannot modify batch students");
      return;
    }

    if (!studentEmail || !mainClassId) {
      toast.error("Please select a student and a class");
      return;
    }

    setIsAdding(true);
    try {
      await addStudentToBatch(id, { studentEmail, mainClassId });

      // Direct local state update (Optimistic UI)
      const newlyAddedStudent = students.find((s) => s.email === studentEmail);
      const associatedClass = currentBatch.mainClasses?.find(
        (c) => c._id === mainClassId,
      );

      if (newlyAddedStudent && associatedClass) {
        useBatchStore.setState((state) => ({
          currentBatch: {
            ...state.currentBatch,
            students: [
              ...(state.currentBatch.students || []),
              newlyAddedStudent,
            ],
            mainClassStudentPairs: [
              ...(state.currentBatch.mainClassStudentPairs || []),
              { mainClass: associatedClass, student: newlyAddedStudent },
            ],
          },
        }));
      }

      setStudentEmail("");
      setSearchQuery("");
    } catch (err) {
      // Only show error if it fails
      toast.error(
        err.response?.data?.message ||
          err.message ||
          "An error occurred during enrollment.",
      );
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (userRole === "Teacher") {
      toast.error("Teachers cannot delete batches");
      return;
    }
    await deleteBatch(id, navigate);
  };

  // --- OPTIMIZED REMOVE STUDENT ---
  const handleRemoveStudent = async () => {
    if (studentToDelete) {
      const pair = currentBatch.mainClassStudentPairs?.find(
        (p) => p.student?._id === studentToDelete._id,
      );
      const studentMainClassId = pair?.mainClass?._id;

      if (!studentMainClassId) {
        toast.error(
          "Could not find the main class associated with this student.",
        );
        setStudentToDelete(null);
        return;
      }

      try {
        await removeStudentFromBatch(
          id,
          studentToDelete._id,
          studentMainClassId,
        );

        // Direct local state update (Optimistic UI)
        useBatchStore.setState((state) => ({
          currentBatch: {
            ...state.currentBatch,
            students: state.currentBatch.students.filter(
              (s) => s._id !== studentToDelete._id,
            ),
            mainClassStudentPairs:
              state.currentBatch.mainClassStudentPairs.filter(
                (p) => p.student?._id !== studentToDelete._id,
              ),
          },
        }));
      } catch (error) {
        toast.error("Failed to remove student.");
      } finally {
        setStudentToDelete(null);
      }
    }
  };

  if (!id || (isLoading && !isAdding) || !currentBatch) {
    return <BatchSkeleton />;
  }

  const isAdmin = authUser?.role === "Admin";

  const getStudentClassInfo = (studentId) => {
    const pair = currentBatch.mainClassStudentPairs?.find(
      (p) => p.student?._id === studentId,
    );
    return pair ? pair.mainClass.name : "Unassigned";
  };

  const displayBatchName = currentBatch?.name?.trim() || fallbackName;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 max-w-6xl min-h-screen bg-background text-foreground transition-colors duration-300"
    >
      <ConfirmModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        onConfirm={handleDeleteBatch}
        title="Delete Batch"
        message={`Are you sure you want to delete "${displayBatchName}"? This action cannot be undone and will remove all associated student records from this batch.`}
      />
      <ConfirmModal
        isOpen={!!studentToDelete}
        onClose={() => setStudentToDelete(null)}
        onConfirm={handleRemoveStudent}
        title="Remove Student"
        message={`Are you sure you want to remove ${studentToDelete?.name} from this batch?`}
        confirmText="Remove"
      />

      <BackButton details={`Detailed view of the batch`} />
      <div className="p-8 rounded-3xl bg-card border border-border shadow-sm mb-8 mt-6 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-extrabold text-foreground capitalize">
                {displayBatchName}
              </h1>
            </div>
            <p className="text-lg text-muted-foreground font-medium flex items-center gap-2">
              <Users className="w-5 h-5 opacity-70" />
              Instructor:{" "}
              {Array.isArray(currentBatch.teachers) &&
              currentBatch.teachers.length > 0
                ? currentBatch.teachers
                    .map((t) => t.name || t.email || "Unknown")
                    .join(", ")
                : currentBatch.teacherEmail || "TBA"}
            </p>
          </div>

          {isAdmin && (
            <div className="flex gap-3">
              <button
                onClick={() =>
                  navigate(`/batches/edit`, { state: { batchId: id } })
                }
                className="px-5 py-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground font-medium transition-colors border border-border"
              >
                Edit
              </button>
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-5 py-2.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive font-semibold transition-colors flex items-center gap-2 border border-destructive/20"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        <div
          className={`grid grid-cols-2 ${userRole !== "Student" ? "md:grid-cols-4" : ""} gap-4 mt-8`}
        >
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> Day
            </p>
            <p className="font-semibold text-foreground text-lg">
              {currentBatch.weekday}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
              <Clock className="w-4 h-4" /> Time
            </p>
            <p className="font-semibold text-foreground text-lg">
              {currentBatch.startTime} - {currentBatch.endTime}
            </p>
          </div>
          {userRole !== "Student" && (
            <>
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <BookOpen className="w-4 h-4" /> Total Classes
                </p>
                <p className="font-semibold text-foreground text-lg">
                  {currentBatch.mainClasses?.length || 0}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/50">
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                  <Users className="w-4 h-4" /> Total Students
                </p>
                <p className="font-semibold text-foreground text-lg">
                  {currentBatch.students?.length || 0}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
      {userRole !== "Student" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Associated Courses
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentBatch.mainClasses?.map((cls) => (
                  <div
                    key={cls._id}
                    onClick={() =>
                      isAdmin &&
                      navigate(`/courses/${generateSlug(cls.name)}`, {
                        state: { courseId: cls._id, courseName: cls.name },
                      })
                    }
                    className={`p-5 bg-card border border-border rounded-2xl shadow-sm ${isAdmin ? "hover:border-primary/50 transition-colors cursor-pointer" : ""}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-foreground">{cls.name}</h3>
                      {userRole !== "Teacher" && (
                        <span className="text-sm font-bold text-success bg-success/10 px-2 py-1 rounded-lg">
                          ₹{cls.fees}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Instructor: {cls.teacherName || "TBA"}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {new Date(cls.startDate).toLocaleDateString()} -{" "}
                      {new Date(cls.endDate).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Batch Students
              </h2>

              <div className="relative mb-4">
                <Search className="absolute left-4 top-3.5 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search students in this batch..."
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  className="w-full pl-12 pr-10 py-3 rounded-xl border border-border bg-card text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                />
                {listSearch && (
                  <button
                    onClick={() => setListSearch("")}
                    className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                {paginatedStudents.length > 0 ? (
                  <>
                    <ul className="divide-y divide-border">
                      {/* Animated List Container */}
                      <AnimatePresence initial={false}>
                        {paginatedStudents.map((student) => (
                          <StudentRow
                            key={student._id}
                            baseStudent={student}
                            mainClassName={getStudentClassInfo(student._id)}
                            canDelete={isAdmin}
                            canViewProfile={isAdmin}
                            onDelete={setStudentToDelete}
                            getUserById={getUserById}
                          />
                        ))}
                      </AnimatePresence>
                    </ul>

                    {totalPages > 1 && (
                      <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between">
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.max(1, p - 1))
                          }
                          disabled={currentPage === 1}
                          className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" /> Prev
                        </button>
                        <span className="text-sm font-medium text-muted-foreground">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() =>
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
                          }
                          disabled={currentPage === totalPages}
                          className="flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Next <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-10 text-center flex flex-col items-center">
                    <Users className="w-12 h-12 text-muted-foreground/50 mb-3" />
                    <p className="text-muted-foreground font-medium">
                      {listSearch
                        ? "No matching students found."
                        : "No students enrolled yet."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {isAdmin && (
            <div className="space-y-6">
              <div className="p-6 rounded-3xl bg-card border border-border shadow-sm sticky top-8">
                <h3 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    +
                  </span>
                  Add New Student
                </h3>

                <form onSubmit={handleAddStudent} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-foreground mb-1.5">
                      1. Select Course
                    </label>
                    <select
                      required
                      value={mainClassId}
                      onChange={(e) => {
                        setMainClassId(e.target.value);
                        setStudentEmail("");
                        setSearchQuery("");
                      }}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm appearance-none cursor-pointer"
                    >
                      <option value="" disabled>
                        Select a Class...
                      </option>
                      {currentBatch.mainClasses?.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name} (₹{cls.fees})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div ref={dropdownRef} className="relative">
                    <label className="block text-sm font-semibold text-foreground mb-1.5">
                      2. Search & Select Student
                    </label>
                    <div className="relative">
                      <div className="relative flex items-center">
                        <Search className="absolute left-4 w-5 h-5 text-muted-foreground" />
                        <input
                          type="text"
                          required
                          disabled={!mainClassId}
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setStudentEmail("");
                            setIsDropdownOpen(true);
                          }}
                          onFocus={() => setIsDropdownOpen(true)}
                          className="w-full pl-11 pr-10 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder={
                            mainClassId
                              ? "Search by name or email..."
                              : "Please select a course first..."
                          }
                        />
                        {studentEmail && (
                          <div className="absolute right-3 w-7 h-7 rounded-full bg-muted overflow-hidden flex items-center justify-center border border-border">
                            {availableStudentsToAdd.find(
                              (u) => u.email === studentEmail,
                            )?.profilePicture ||
                            availableStudentsToAdd.find(
                              (u) => u.email === studentEmail,
                            )?.profilePic ? (
                              <img
                                src={
                                  availableStudentsToAdd.find(
                                    (u) => u.email === studentEmail,
                                  ).profilePicture ||
                                  availableStudentsToAdd.find(
                                    (u) => u.email === studentEmail,
                                  ).profilePic
                                }
                                alt="Avatar"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Check className="w-4 h-4 text-success" />
                            )}
                          </div>
                        )}
                      </div>

                      {isDropdownOpen && mainClassId && (
                        <div className="absolute z-50 w-full mt-2 bg-card rounded-xl border border-border shadow-2xl max-h-60 overflow-y-auto">
                          {searchFilteredAvailable.length > 0 ? (
                            <ul className="py-2">
                              {searchFilteredAvailable.map((student) => (
                                <li
                                  key={student._id}
                                  onClick={() => handleSelectStudent(student)}
                                  className={`px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                                    studentEmail === student.email
                                      ? "bg-primary/10"
                                      : ""
                                  }`}
                                >
                                  <div className="w-8 h-8 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs overflow-hidden">
                                    {student.profilePicture ||
                                    student.profilePic ? (
                                      <img
                                        src={
                                          student.profilePicture ||
                                          student.profilePic
                                        }
                                        alt="pic"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      (
                                        student.name?.charAt(0) ||
                                        student.email?.charAt(0) ||
                                        "S"
                                      ).toUpperCase()
                                    )}
                                  </div>
                                  <div className="overflow-hidden">
                                    <p className="font-semibold text-sm text-foreground truncate">
                                      {student.name || "Unknown Name"}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {student.email}
                                    </p>
                                  </div>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <div className="p-4 text-center text-sm text-muted-foreground">
                              {students?.length === 0
                                ? "No students available."
                                : "No available students match this search or all are already enrolled in this batch."}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!studentEmail || !mainClassId || isAdding}
                    className="w-full py-3 bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-xl transition-all shadow-md hover:-translate-y-0.5 mt-4 flex items-center justify-center gap-2"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Enrolling...
                      </>
                    ) : (
                      "Enroll Student"
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
