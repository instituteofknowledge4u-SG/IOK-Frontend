import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import useBatchStore from "../../stores/useBatchStore";
import useAuthStore from "../../stores/useAuthStore";
import useUserStore from "../../stores/useUserStore";
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
  Edit3,
  UserPlus,
  Mail,
  Phone,
  GraduationCap,
  RefreshCw,
  ArrowUpRight,
} from "lucide-react";
import toast from "react-hot-toast";
import BackButton from "../../components/UI/Button";
import { generateSlug } from "../../util/generateSlug";
import { canTeacherAccessBatch } from "../../util/teacherAccessControl";
import { Helmet } from "react-helmet-async";
import { getStudentId } from "../../util/getStudentId";

// --- Local Cache for Student Profiles & Directory (Prevents Re-fetching on Pagination/Search) ---
const USER_CACHE_TTL = 60 * 1000; // 1 minute
const studentProfileCache = new Map();
const pendingStudentRequests = new Map();
let lastStudentsDirectoryFetch = 0;

const isStudentCacheValid = (timestamp) =>
  Boolean(timestamp && Date.now() - timestamp < USER_CACHE_TTL);

// --- Reusable Confirmation Modal ---
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Delete",
  isProcessing = false,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-border"
        >
          <div className="p-6 sm:p-7">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 shrink-0 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-center text-destructive">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Please confirm your action
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {message}
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                disabled={isProcessing}
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-sm text-foreground hover:bg-muted transition-colors font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessing}
                onClick={async () => {
                  await onConfirm();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl text-sm bg-destructive hover:opacity-95 text-destructive-foreground shadow-sm shadow-destructive/20 transition-all font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
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
    <div className="w-28 h-10 bg-muted animate-pulse rounded-xl mb-6 mt-2" />
    <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm mb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="w-full md:w-1/2 space-y-3">
          <div className="h-5 w-24 bg-muted animate-pulse rounded-full" />
          <div className="h-10 w-3/4 bg-muted animate-pulse rounded-xl" />
          <div className="h-5 w-1/2 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="flex gap-3">
          <div className="w-24 h-10 bg-muted animate-pulse rounded-xl" />
          <div className="w-28 h-10 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        <div>
          <div className="h-7 w-48 bg-muted animate-pulse rounded-lg mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-36 bg-muted animate-pulse rounded-2xl"
              />
            ))}
          </div>
        </div>
        <div>
          <div className="h-7 w-48 bg-muted animate-pulse rounded-lg mb-4" />
          <div className="h-12 w-full bg-muted animate-pulse rounded-xl mb-4" />
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 flex items-center gap-4 border-b border-border last:border-0"
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-muted animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-1/2 bg-muted animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div>
        <div className="h-[420px] bg-card border border-border shadow-sm rounded-3xl animate-pulse" />
      </div>
    </div>
  </div>
);

// --- Cached Student Row Sub-component ---
const StudentRow = ({
  baseStudent,
  directoryStudent,
  mainClassName,
  canDelete,
  canViewProfile,
  onDelete,
  getUserById,
}) => {
  const navigate = useNavigate();
  const studentId = baseStudent?._id || baseStudent?.id;

  // Hydrate immediately from cache or directory if available
  const initialData = useMemo(() => {
    const cached = studentId
      ? studentProfileCache.get(String(studentId))
      : null;
    return {
      ...baseStudent,
      ...(directoryStudent || {}),
      ...(cached?.data || {}),
    };
  }, [baseStudent, directoryStudent, studentId]);

  const [details, setDetails] = useState(initialData);
  const [isFetching, setIsFetching] = useState(() => {
    if (!studentId) return false;
    const cached = studentProfileCache.get(String(studentId));
    if (cached && isStudentCacheValid(cached.timestamp)) return false;
    if (directoryStudent?.name && directoryStudent?.email) return false;
    if (baseStudent?.name && baseStudent?.email && baseStudent?.phone)
      return false;
    return true;
  });

  useEffect(() => {
    let isMounted = true;
    if (!studentId) {
      setIsFetching(false);
      return;
    }

    const key = String(studentId);
    const cached = studentProfileCache.get(key);

    if (cached && isStudentCacheValid(cached.timestamp)) {
      setDetails((prev) => ({ ...prev, ...cached.data }));
      setIsFetching(false);
      return;
    }

    const fetchDetails = async () => {
      // Only show row skeleton if we don't even have basic student info
      if (!details?.name && !details?.email) {
        setIsFetching(true);
      }

      try {
        let request = pendingStudentRequests.get(key);
        if (!request) {
          request = getUserById(studentId);
          pendingStudentRequests.set(key, request);
        }

        const data = await request;
        if (data) {
          studentProfileCache.set(key, {
            data,
            timestamp: Date.now(),
          });
          if (isMounted) {
            setDetails((prev) => ({ ...prev, ...data }));
          }
        }
      } catch (e) {
        console.error("Failed to fetch student details", e);
      } finally {
        pendingStudentRequests.delete(key);
        if (isMounted) setIsFetching(false);
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [studentId, getUserById]);

  const handleViewProfile = () => {
    if (!canViewProfile) return;
    navigate(`/profile/${generateSlug(details?.name || "student")}`, {
      state: {
        userId: details._id || studentId,
        userData: details,
      },
    });
  };

  if (isFetching) {
    return (
      <li className="p-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4 w-full">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-muted animate-pulse border border-border" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-40 max-w-[50%] bg-muted animate-pulse rounded" />
            <div className="h-3 w-56 max-w-[70%] bg-muted animate-pulse rounded" />
          </div>
        </div>
      </li>
    );
  }

  const avatarSrc = details?.profilePic || details?.profilePicture;
  const initials = (
    details?.name?.charAt(0) ||
    details?.email?.charAt(0) ||
    "S"
  ).toUpperCase();

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.18 }}
      className={`p-4 sm:px-6 flex items-center justify-between gap-4 transition-colors ${
        canViewProfile ? "hover:bg-muted/40 group" : ""
      }`}
    >
      {/* Clickable Area for Profile Navigation */}
      <div
        className={`flex items-center gap-4 flex-1 min-w-0 ${
          canViewProfile ? "cursor-pointer" : ""
        }`}
        onClick={handleViewProfile}
        title={canViewProfile ? "View Student Profile" : "Student Details"}
      >
        <div
          className={`w-12 h-12 shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base overflow-hidden border border-primary/20 transition-all ${
            canViewProfile
              ? "group-hover:bg-primary group-hover:text-primary-foreground group-hover:shadow-md"
              : ""
          }`}
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={details?.name || "Student"}
              className="w-full h-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={`font-bold text-foreground truncate transition-colors ${
                canViewProfile ? "group-hover:text-primary" : ""
              }`}
            >
              {details?.name || "Unknown Student"}
            </p>

            <span className="text-sm font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">
              {getStudentId(details)}
            </span>

            {canViewProfile && (
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
            {details?.email && (
              <span className="inline-flex items-center gap-1 truncate max-w-[240px] sm:max-w-xs">
                <Mail className="w-3.5 h-3.5 opacity-70 shrink-0" />
                {details.email}
              </span>
            )}
            {details?.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 opacity-70 shrink-0" />
                {details.phone}
              </span>
            )}
          </div>

          <div className="mt-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/15">
              <GraduationCap className="w-3 h-3" />
              {mainClassName}
            </span>
          </div>
        </div>
      </div>

      {/* Remove Student Button */}
      {canDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(details);
          }}
          className="p-2.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors shrink-0"
          title="Remove Student from Batch"
        >
          <Trash2 className="w-4 h-4" />
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
  const [isRemoving, setIsRemoving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    currentBatch,
    fetchBatchById,
    addStudentToBatch,
    removeStudentFromBatch,
    deleteBatch,
    syncCurrentBatchCache,
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

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  // Verify whether currentBatch in store belongs to the current route's batch ID
  const isBatchMatched =
    currentBatch && String(currentBatch._id || currentBatch.id) === String(id);

  // Fetch students directory with cache check (non-Student roles only)
  useEffect(() => {
    if (userRole !== "Student") {
      const hasCachedDirectory =
        Array.isArray(students) &&
        students.length > 0 &&
        Date.now() - lastStudentsDirectoryFetch < USER_CACHE_TTL;

      if (!hasCachedDirectory) {
        Promise.resolve(getStudents()).then(() => {
          lastStudentsDirectoryFetch = Date.now();
        });
      }
    }
  }, [getStudents, userRole, students?.length]);

  // Close student dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Default course selection when batch loads
  useEffect(() => {
    if (isBatchMatched && currentBatch?.mainClasses?.length > 0) {
      const classExists = currentBatch.mainClasses.some(
        (c) => String(c._id) === String(mainClassId),
      );
      if (!mainClassId || !classExists) {
        setMainClassId(currentBatch.mainClasses[0]._id);
      }
    }
  }, [isBatchMatched, currentBatch, mainClassId]);

  // Fetch batch details (uses store cache automatically unless forced)
  useEffect(() => {
    if (id) {
      fetchBatchById(id);
    } else {
      navigate("/batches");
    }
  }, [id, fetchBatchById, navigate]);

  // Teacher Access Verification (Only run when currentBatch matches current id)
  useEffect(() => {
    if (isBatchMatched && id && userRole === "Teacher") {
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
  }, [isBatchMatched, currentBatch, id, userRole, authUser, navigate]);

  // Manual Force Refresh Handler
  const handleManualRefresh = async () => {
    if (!id || isRefreshing) return;
    setIsRefreshing(true);
    try {
      await fetchBatchById(id, true);
      toast.success("Batch details refreshed");
    } catch {
      // Error is handled by store
    } finally {
      setIsRefreshing(false);
    }
  };

  // Map directory students by ID for instant lookup inside rows
  const directoryStudentsMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(students)) {
      students.forEach((s) => {
        if (s?._id) map.set(String(s._id), s);
      });
    }
    return map;
  }, [students]);

  // --- Filtering & Pagination ---
  const filteredBatchStudents = useMemo(() => {
    const list = currentBatch?.students || [];
    const term = listSearch.trim().toLowerCase();
    if (!term) return list;

    return list.filter((student) => {
      const dirStudent = directoryStudentsMap.get(String(student._id));
      const cachedStudent = studentProfileCache.get(String(student._id))?.data;
      const name =
        student.name || dirStudent?.name || cachedStudent?.name || "";
      const email =
        student.email || dirStudent?.email || cachedStudent?.email || "";
      return (
        name.toLowerCase().includes(term) || email.toLowerCase().includes(term)
      );
    });
  }, [currentBatch?.students, listSearch, directoryStudentsMap]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredBatchStudents.length / pageSize),
  );

  // Prevent staying on an empty page after deleting the last item on that page
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [listSearch]);

  const paginatedStudents = filteredBatchStudents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const batchStudentEmails = useMemo(
    () =>
      new Set(
        (currentBatch?.students || [])
          .map((s) => s.email || directoryStudentsMap.get(String(s._id))?.email)
          .filter(Boolean),
      ),
    [currentBatch?.students, directoryStudentsMap],
  );

  const batchStudentIds = useMemo(
    () =>
      new Set(
        (currentBatch?.students || [])
          .map((s) => String(s._id || s.id))
          .filter(Boolean),
      ),
    [currentBatch?.students],
  );

  const availableStudentsToAdd = useMemo(() => {
    if (!Array.isArray(students) || !mainClassId) return [];
    return students.filter((student) => {
      if (batchStudentIds.has(String(student._id))) return false;
      if (student.email && batchStudentEmails.has(student.email)) return false;
      return student.mainClasses?.some(
        (sc) => String(sc._id || sc) === String(mainClassId),
      );
    });
  }, [students, mainClassId, batchStudentIds, batchStudentEmails]);

  const searchFilteredAvailable = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return availableStudentsToAdd;
    return availableStudentsToAdd.filter(
      (student) =>
        student.name?.toLowerCase().includes(q) ||
        student.email?.toLowerCase().includes(q),
    );
  }, [availableStudentsToAdd, searchQuery]);

  const selectedStudentObj = useMemo(
    () => availableStudentsToAdd.find((u) => u.email === studentEmail),
    [availableStudentsToAdd, studentEmail],
  );

  const handleSelectStudent = (student) => {
    setStudentEmail(student.email);
    setSearchQuery(`${student.name || "Unknown"} (${student.email})`);
    setIsDropdownOpen(false);
  };

  const handleClearSelectedStudent = () => {
    setStudentEmail("");
    setSearchQuery("");
  };

  // --- OPTIMIZED ADD STUDENT (Updates Store & Cache without Full-Page Reload) ---
  const handleAddStudent = async (e) => {
    e.preventDefault();

    if (userRole === "Teacher") {
      toast.error("Teachers cannot modify batch students");
      return;
    }

    if (!studentEmail || !mainClassId) {
      toast.error("Please select a course and a student");
      return;
    }

    setIsAdding(true);
    try {
      await addStudentToBatch(id, { studentEmail, mainClassId });

      const newlyAddedStudent = students?.find((s) => s.email === studentEmail);
      const associatedClass = currentBatch.mainClasses?.find(
        (c) => String(c._id) === String(mainClassId),
      );

      if (newlyAddedStudent && associatedClass) {
        const updatedBatch = {
          ...currentBatch,
          students: [...(currentBatch.students || []), newlyAddedStudent],
          mainClassStudentPairs: [
            ...(currentBatch.mainClassStudentPairs || []),
            { mainClass: associatedClass, student: newlyAddedStudent },
          ],
        };
        syncCurrentBatchCache(id, updatedBatch);
      } else {
        await fetchBatchById(id, true);
      }

      setStudentEmail("");
      setSearchQuery("");
    } catch {
      // Error toast is already handled by useBatchStore
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

  // --- OPTIMIZED REMOVE STUDENT (Updates Store & Cache Only on Success) ---
  const handleRemoveStudent = async () => {
    if (!studentToDelete) return;

    const targetId = studentToDelete._id || studentToDelete.id;
    const pair = currentBatch.mainClassStudentPairs?.find(
      (p) => String(p.student?._id || p.student) === String(targetId),
    );
    const studentMainClassId =
      pair?.mainClass?._id ||
      pair?.mainClass ||
      currentBatch.mainClasses?.[0]?._id;

    if (!studentMainClassId) {
      toast.error(
        "Could not find the main class associated with this student.",
      );
      setStudentToDelete(null);
      return;
    }

    setIsRemoving(true);
    try {
      const success = await removeStudentFromBatch(
        id,
        targetId,
        studentMainClassId,
      );

      if (success) {
        const updatedBatch = {
          ...currentBatch,
          students: (currentBatch.students || []).filter(
            (s) => String(s._id || s.id) !== String(targetId),
          ),
          mainClassStudentPairs: (
            currentBatch.mainClassStudentPairs || []
          ).filter(
            (p) => String(p.student?._id || p.student) !== String(targetId),
          ),
        };
        syncCurrentBatchCache(id, updatedBatch);
      }
    } finally {
      setIsRemoving(false);
      setStudentToDelete(null);
    }
  };

  // Show skeleton only on initial load or when switching to an uncached batch
  if (!id || (!isBatchMatched && isLoading) || !currentBatch) {
    return <BatchSkeleton />;
  }

  const isAdmin = authUser?.role === "Admin";

  const getStudentClassInfo = (studentId) => {
    const pair = currentBatch.mainClassStudentPairs?.find(
      (p) => String(p.student?._id || p.student) === String(studentId),
    );
    return pair?.mainClass?.name || "Assigned Course";
  };

  const displayBatchName = currentBatch?.name?.trim() || fallbackName;
  const instructorLabel =
    Array.isArray(currentBatch.teachers) && currentBatch.teachers.length > 0
      ? currentBatch.teachers
          .map((t) => t.name || t.email || "Unknown")
          .join(", ")
      : currentBatch.teacherEmail || "TBA";

  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(
    currentPage * pageSize,
    filteredBatchStudents.length,
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 py-8 max-w-6xl min-h-screen bg-background text-foreground transition-colors duration-300"
    >
      <Helmet>
        <title>{`IOK - Batch | ${displayBatchName}`}</title>
      </Helmet>

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
        isProcessing={isRemoving}
        title="Remove Student"
        message={`Are you sure you want to remove ${
          studentToDelete?.name || studentToDelete?.email || "this student"
        } from "${displayBatchName}"?`}
        confirmText="Remove"
      />

      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-4">
        <BackButton details="Detailed view of the batch" />

        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-all shadow-sm disabled:opacity-50"
          title="Refresh batch data"
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
          />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Hero Header Card */}
      <div className="relative overflow-hidden p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm mb-8 mt-5 transition-colors">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase">
              <Calendar className="w-3.5 h-3.5" />
              Active Batch
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground capitalize tracking-tight">
              {displayBatchName}
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-sm sm:text-base text-muted-foreground font-medium">
              <Users className="w-4 h-4 text-primary shrink-0" />
              <span>Instructor:</span>
              <span className="text-foreground font-semibold">
                {instructorLabel}
              </span>
            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3 w-full md:w-auto">
              <button
                type="button"
                onClick={() =>
                  navigate(
                    `/batches/${generateSlug(currentBatch.name) || "Unknown Batch"}/edit`,
                    { state: { batchId: id } },
                  )
                }
                className="flex-1 md:flex-initial justify-center px-5 py-2.5 rounded-xl bg-muted hover:bg-muted/80 text-foreground font-semibold text-sm transition-all border border-border flex items-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Edit
              </button>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(true)}
                className="flex-1 md:flex-initial justify-center px-5 py-2.5 rounded-xl bg-destructive/10 hover:bg-destructive hover:text-destructive-foreground text-destructive font-semibold text-sm transition-all flex items-center gap-2 border border-destructive/20"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        {/* Batch Overview Metrics */}
        <div
          className={`grid grid-cols-2 ${
            userRole !== "Student" ? " lg:grid-cols-4" : ""
          } gap-4 mt-8`}
        >
          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex items-center gap-3.5">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Schedule Day
              </p>
              <p className="font-bold text-foreground text-base sm:text-lg truncate">
                {currentBatch.weekday || "N/A"}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex items-center gap-3.5">
            <div className="w-11 h-11 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-muted-foreground">
                Timing
              </p>
              <p className="font-bold text-foreground text-sm sm:text-base truncate">
                {currentBatch.startTime} - {currentBatch.endTime}
              </p>
            </div>
          </div>

          {userRole !== "Student" && (
            <>
              <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex items-center gap-3.5">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Courses
                  </p>
                  <p className="font-bold text-foreground text-base sm:text-lg">
                    {currentBatch.mainClasses?.length || 0}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 flex items-center gap-3.5">
                <div className="w-11 h-11 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-muted-foreground">
                    Enrolled Students
                  </p>
                  <p className="font-bold text-foreground text-base sm:text-lg">
                    {currentBatch.students?.length || 0}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content Layout for Admin / Teacher */}
      {userRole !== "Student" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Associated Courses Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Associated Courses
                </h2>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                  {currentBatch.mainClasses?.length || 0} Total
                </span>
              </div>

              {currentBatch.mainClasses?.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {currentBatch.mainClasses.map((cls) => (
                    <div
                      key={cls._id}
                      onClick={() =>
                        isAdmin &&
                        navigate(`/courses/${generateSlug(cls.name)}`, {
                          state: { courseId: cls._id, courseName: cls.name },
                        })
                      }
                      className={`group p-5 bg-card border border-border rounded-2xl shadow-sm transition-all ${
                        isAdmin
                          ? "hover:border-primary/50 hover:shadow-md cursor-pointer"
                          : ""
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3 mb-3">
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {cls.name}
                        </h3>
                        {userRole !== "Teacher" && cls.fees !== undefined && (
                          <span className="text-xs font-bold text-success bg-success/10 border border-success/20 px-2.5 py-1 rounded-lg shrink-0">
                            ₹{cls.fees}
                          </span>
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-muted-foreground mb-2 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 opacity-70" />
                        <span>Instructor:</span>
                        <span className="font-medium text-foreground">
                          {cls.teacherName || "TBA"}
                        </span>
                      </p>

                      {cls.startDate && cls.endDate && (
                        <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5 pt-2 border-t border-border/60">
                          <Calendar className="w-3.5 h-3.5 opacity-70" />
                          {new Date(cls.startDate).toLocaleDateString()} —{" "}
                          {new Date(cls.endDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 rounded-2xl bg-card border border-border text-center text-muted-foreground text-sm">
                  No courses linked to this batch yet.
                </div>
              )}
            </div>

            {/* Batch Students Directory Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2.5">
                  <Users className="w-5 h-5 text-primary" />
                  Batch Students
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
                    {filteredBatchStudents.length}
                  </span>
                </h2>
              </div>

              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter enrolled students by name or email..."
                  value={listSearch}
                  onChange={(e) => setListSearch(e.target.value)}
                  className="w-full pl-11 pr-10 py-3 rounded-2xl border border-border bg-card text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                />
                {listSearch && (
                  <button
                    type="button"
                    onClick={() => setListSearch("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Students Card List */}
              <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-sm">
                {paginatedStudents.length > 0 ? (
                  <>
                    <ul className="divide-y divide-border">
                      <AnimatePresence initial={false}>
                        {paginatedStudents.map((student) => {
                          const sid = student._id || student.id;
                          return (
                            <StudentRow
                              key={sid}
                              baseStudent={student}
                              directoryStudent={directoryStudentsMap.get(
                                String(sid),
                              )}
                              mainClassName={getStudentClassInfo(sid)}
                              canDelete={isAdmin}
                              canViewProfile={isAdmin}
                              onDelete={setStudentToDelete}
                              getUserById={getUserById}
                            />
                          );
                        })}
                      </AnimatePresence>
                    </ul>

                    {totalPages > 1 && (
                      <div className="px-6 py-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="text-xs font-medium text-muted-foreground">
                          Showing{" "}
                          <strong className="text-foreground">
                            {startIndex}–{endIndex}
                          </strong>{" "}
                          of{" "}
                          <strong className="text-foreground">
                            {filteredBatchStudents.length}
                          </strong>{" "}
                          students
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentPage((p) => Math.max(1, p - 1))
                            }
                            disabled={currentPage === 1}
                            className="flex items-center gap-1 text-xs font-semibold px-3.5 py-2 rounded-xl border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4" /> Prev
                          </button>
                          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-muted text-foreground">
                            {currentPage} / {totalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setCurrentPage((p) => Math.min(totalPages, p + 1))
                            }
                            disabled={currentPage === totalPages}
                            className="flex items-center gap-1 text-xs font-semibold px-3.5 py-2 rounded-xl border border-border bg-background text-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Next <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-12 text-center flex flex-col items-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
                      <Users className="w-7 h-7 text-muted-foreground/60" />
                    </div>
                    <p className="text-foreground font-semibold">
                      {listSearch
                        ? "No matching students found"
                        : "No students enrolled yet"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                      {listSearch
                        ? "Try adjusting your search query or clearing the filter."
                        : isAdmin
                          ? "Use the enrollment panel to add students to this batch."
                          : "Students enrolled in this batch will appear here."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Admin Enrollment Sidebar */}
          {isAdmin && (
            <div className="space-y-6">
              <div className="p-6 sm:p-7 rounded-3xl bg-card border border-border shadow-sm sticky top-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-foreground">
                      Enroll Student
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Assign a student to this batch
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAddStudent} className="space-y-5">
                  {/* Step 1: Course Selection */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
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
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm cursor-pointer"
                    >
                      <option value="" disabled>
                        Select a Course...
                      </option>
                      {currentBatch.mainClasses?.map((cls) => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name} (₹{cls.fees})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Student Search & Selection */}
                  <div ref={dropdownRef} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        2. Search & Select Student
                      </label>
                      {mainClassId && (
                        <span className="text-[11px] font-medium text-muted-foreground">
                          {availableStudentsToAdd.length} eligible
                        </span>
                      )}
                    </div>

                    <div className="relative">
                      <div className="relative flex items-center">
                        <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground pointer-events-none" />
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
                          className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          placeholder={
                            mainClassId
                              ? "Search by name or email..."
                              : "Select a course first..."
                          }
                        />
                        {(searchQuery || studentEmail) && (
                          <button
                            type="button"
                            onClick={handleClearSelectedStudent}
                            className="absolute right-3 p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Clear selection"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Selected Student Confirmation Chip */}
                      {selectedStudentObj && (
                        <div className="mt-2.5 p-2.5 rounded-xl bg-primary/5 border border-primary/20 flex items-center gap-3">
                          <div className="w-8 h-8 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold overflow-hidden">
                            {selectedStudentObj.profilePicture ||
                            selectedStudentObj.profilePic ? (
                              <img
                                src={
                                  selectedStudentObj.profilePicture ||
                                  selectedStudentObj.profilePic
                                }
                                alt={selectedStudentObj.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (
                                selectedStudentObj.name?.charAt(0) || "S"
                              ).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate">
                              {selectedStudentObj.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {selectedStudentObj.email}
                            </p>
                          </div>
                          <Check className="w-4 h-4 text-success shrink-0 mr-1" />
                        </div>
                      )}

                      {/* Dropdown Menu */}
                      {isDropdownOpen && mainClassId && (
                        <div className="absolute z-50 w-full mt-2 bg-card rounded-2xl border border-border shadow-2xl max-h-60 overflow-y-auto">
                          {searchFilteredAvailable.length > 0 ? (
                            <ul className="py-1.5 divide-y divide-border/40">
                              {searchFilteredAvailable.map((student) => (
                                <li
                                  key={student._id}
                                  onClick={() => handleSelectStudent(student)}
                                  className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer hover:bg-muted/60 transition-colors ${
                                    studentEmail === student.email
                                      ? "bg-primary/10"
                                      : ""
                                  }`}
                                >
                                  <div className="w-8 h-8 shrink-0 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs overflow-hidden">
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
                                  <div className="overflow-hidden flex-1">
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
                            <div className="p-4 text-center text-xs text-muted-foreground leading-relaxed">
                              {students?.length === 0
                                ? "No students registered in the system."
                                : "No eligible students match your search, or all students in this course are already enrolled."}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={!studentEmail || !mainClassId || isAdding}
                    className="w-full py-3.5 bg-primary hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Enrolling Student...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Enroll Student
                      </>
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
