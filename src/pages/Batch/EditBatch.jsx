import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Check,
  BookOpen,
  Trash2,
  Plus,
  Calendar,
  Clock,
  Users,
  Search,
  RotateCcw,
  Save,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import useBatchStore from "../../stores/useBatchStore";
import useUserStore from "../../stores/useUserStore";
import useClassStore from "../../stores/useClassStore";
import BackButton from "../../components/UI/Button";
import { Helmet } from "react-helmet-async";

// --- Static Constants & Cache Timestamps ---
const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const REFERENCE_DATA_TTL = 60 * 1000; // 1 minute cache TTL for teachers & courses
let lastTeachersFetchTime = 0;
let lastClassesFetchTime = 0;

// --- Memoized Skeleton Loader ---
const EditBatchSkeleton = React.memo(() => (
  <div className="container mx-auto px-4 py-8 max-w-3xl min-h-screen">
    <div className="w-28 h-10 bg-muted animate-pulse rounded-xl mb-6" />
    <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm space-y-6">
      <div className="space-y-2 border-b border-border pb-6">
        <div className="h-5 w-28 bg-muted animate-pulse rounded-full" />
        <div className="h-9 w-56 bg-muted animate-pulse rounded-xl" />
      </div>
      <div className="space-y-4">
        <div className="h-12 w-full bg-muted animate-pulse rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-12 w-full bg-muted animate-pulse rounded-xl" />
          <div className="h-12 w-full bg-muted animate-pulse rounded-xl" />
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-12 w-full bg-muted animate-pulse rounded-xl" />
          <div className="h-12 w-full bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
      <div className="pt-4 border-t border-border space-y-3">
        <div className="h-6 w-40 bg-muted animate-pulse rounded-lg" />
        <div className="h-14 w-full bg-muted animate-pulse rounded-xl" />
        <div className="h-14 w-full bg-muted animate-pulse rounded-xl" />
      </div>
      <div className="pt-4 flex gap-4">
        <div className="h-12 w-full bg-muted animate-pulse rounded-xl" />
        <div className="h-12 w-full bg-muted animate-pulse rounded-xl" />
      </div>
    </div>
  </div>
));
EditBatchSkeleton.displayName = "EditBatchSkeleton";

// --- Memoized Teacher Option Item ---
const TeacherOptionItem = React.memo(({ teacher, isSelected, onSelect }) => {
  const avatarSrc = teacher.profilePic || teacher.profilePicture;
  const initials = (
    teacher.name?.charAt(0) ||
    teacher.email?.charAt(0) ||
    "T"
  ).toUpperCase();

  return (
    <li
      onClick={() => onSelect(teacher._id)}
      className={`px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/60 transition-colors ${
        isSelected ? "bg-primary/10" : ""
      }`}
    >
      <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/15 text-primary flex items-center justify-center font-bold text-xs overflow-hidden border border-primary/20">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={teacher.name || "Teacher"}
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
      <div className="overflow-hidden flex-1">
        <p className="font-semibold text-sm text-foreground truncate">
          {teacher.name || "Unknown Name"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {teacher.email}
        </p>
      </div>
      {isSelected && <Check className="w-4 h-4 text-primary shrink-0 ml-2" />}
    </li>
  );
});
TeacherOptionItem.displayName = "TeacherOptionItem";

// --- Memoized Assigned Course Row ---
const AssignedCourseItem = React.memo(
  ({ course, courseId, isNewlyAdded, onRemove }) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="flex items-center justify-between p-3.5 bg-muted/30 hover:bg-muted/50 rounded-2xl border border-border transition-colors group"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/15">
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-foreground text-sm truncate">
              {course?.name || "Assigned Course"}
            </span>
            {isNewlyAdded && (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20">
                New
              </span>
            )}
          </div>
          {course?.fees !== undefined && (
            <p className="text-xs text-muted-foreground mt-0.5">
              Course Fee: <span className="font-medium text-foreground">₹{course.fees}</span>
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemove(courseId)}
        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-colors shrink-0"
        title="Remove course from batch"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  )
);
AssignedCourseItem.displayName = "AssignedCourseItem";

// --- Main EditBatch Component ---
const EditBatch = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const id = location.state?.batchId;

  const { currentBatch, fetchBatchById, updateBatch, isLoading } =
    useBatchStore();
  const { teachers, getTeachers } = useUserStore();
  const { allClass: mainClasses = [], getClasses } = useClassStore();

  const [formData, setFormData] = useState({
    name: "",
    weekday: "Monday",
    startTime: "",
    endTime: "",
    teacherId: "",
  });

  const [selectedNewCourse, setSelectedNewCourse] = useState("");
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Dropdown State for Teacher
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const [teacherSearch, setTeacherSearch] = useState("");
  const teacherDropdownRef = useRef(null);

  // Track which batch ID has already hydrated the form to prevent overwriting user edits
  const hydratedBatchIdRef = useRef(null);

  // Check if currentBatch matches the requested route batch ID
  const isBatchMatched = useMemo(
    () =>
      Boolean(
        currentBatch &&
          id &&
          String(currentBatch._id || currentBatch.id) === String(id)
      ),
    [currentBatch, id]
  );

  // 1. Fetch Batch Details & Reference Data (with Cache TTL check)
  useEffect(() => {
    if (!id) {
      navigate("/batches");
      return;
    }

    fetchBatchById(id);

    const now = Date.now();
    if (
      !Array.isArray(teachers) ||
      teachers.length === 0 ||
      now - lastTeachersFetchTime > REFERENCE_DATA_TTL
    ) {
      Promise.resolve(getTeachers()).then(() => {
        lastTeachersFetchTime = Date.now();
      });
    }

    if (
      !Array.isArray(mainClasses) ||
      mainClasses.length === 0 ||
      now - lastClassesFetchTime > REFERENCE_DATA_TTL
    ) {
      Promise.resolve(getClasses()).then(() => {
        lastClassesFetchTime = Date.now();
      });
    }
  }, [
    id,
    fetchBatchById,
    getTeachers,
    getClasses,
    navigate,
    teachers?.length,
    mainClasses?.length,
  ]);

  // Helper to compute initial teacher ID from batch & teachers list
  const resolveInitialTeacherId = useCallback((batch, teachersList) => {
    if (!batch) return "";
    if (Array.isArray(batch.teachers) && batch.teachers.length > 0) {
      return String(batch.teachers[0]._id || batch.teachers[0]);
    }
    if (batch.teacherEmail && Array.isArray(teachersList)) {
      const found = teachersList.find((t) => t.email === batch.teacherEmail);
      if (found) return String(found._id);
    }
    return "";
  }, []);

  // 2. Hydrate Form State safely once when batch matches
  useEffect(() => {
    if (!isBatchMatched || !currentBatch) return;

    const currentIdStr = String(currentBatch._id || currentBatch.id);
    const resolvedTeacherId = resolveInitialTeacherId(currentBatch, teachers);

    if (hydratedBatchIdRef.current !== currentIdStr) {
      setFormData({
        name: currentBatch.name || "",
        weekday: currentBatch.weekday || "Monday",
        startTime: currentBatch.startTime || "",
        endTime: currentBatch.endTime || "",
        teacherId: resolvedTeacherId,
      });
      setAssignedCourses(currentBatch.mainClasses || []);
      hydratedBatchIdRef.current = currentIdStr;
    } else if (!formData.teacherId && resolvedTeacherId) {
      // Backfill teacherId if teachers array finished loading after batch details
      setFormData((prev) =>
        prev.teacherId ? prev : { ...prev, teacherId: resolvedTeacherId }
      );
    }
  }, [
    isBatchMatched,
    currentBatch,
    teachers,
    resolveInitialTeacherId,
    formData.teacherId,
  ]);

  // 3. Close Teacher Dropdown on Outside Click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        teacherDropdownRef.current &&
        !teacherDropdownRef.current.contains(event.target)
      ) {
        setIsTeacherDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- Memoized Lookups & Derived Lists ---
  const mainClassesMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(mainClasses)) {
      mainClasses.forEach((cls) => {
        if (cls?._id) map.set(String(cls._id), cls);
      });
    }
    return map;
  }, [mainClasses]);

  const selectedTeacher = useMemo(
    () =>
      (teachers || []).find(
        (t) => String(t._id) === String(formData.teacherId)
      ),
    [teachers, formData.teacherId]
  );

  const filteredTeachers = useMemo(() => {
    const list = teachers || [];
    const q = teacherSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (t) =>
        t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q)
    );
  }, [teachers, teacherSearch]);

  const assignedCourseIdsSet = useMemo(
    () =>
      new Set(assignedCourses.map((c) => String(c?._id || c)).filter(Boolean)),
    [assignedCourses]
  );

  const availableClassesToAdd = useMemo(
    () =>
      (mainClasses || []).filter(
        (cls) => !assignedCourseIdsSet.has(String(cls._id))
      ),
    [mainClasses, assignedCourseIdsSet]
  );

  // Memoized Change Detection (Used by both Submit Logic & UI Status Indicators)
  const changeState = useMemo(() => {
    if (!isBatchMatched || !currentBatch) {
      return {
        originalCourseIds: [],
        currentAssignedCourseIds: [],
        newlyAddedCourseIds: [],
        newlyAddedSet: new Set(),
        coursesRemoved: false,
        detailsChanged: false,
        hasAdditions: false,
        hasOtherChanges: false,
        hasAnyChanges: false,
      };
    }

    const originalCourseIds =
      currentBatch.mainClasses?.map((c) => c._id || c) || [];
    const currentAssignedCourseIds = assignedCourses.map((c) => c._id || c);

    const newlyAddedCourseIds = currentAssignedCourseIds.filter(
      (cid) => !originalCourseIds.some((oid) => String(oid) === String(cid))
    );
    const coursesRemoved = originalCourseIds.some(
      (oid) =>
        !currentAssignedCourseIds.some((cid) => String(cid) === String(oid))
    );

    const initialTeacherId = resolveInitialTeacherId(currentBatch, teachers);
    const teacherIdChanged =
      String(initialTeacherId || "") !== String(formData.teacherId || "");

    const detailsChanged =
      (currentBatch.name || "") !== formData.name ||
      (currentBatch.weekday || "Monday") !== formData.weekday ||
      (currentBatch.startTime || "") !== formData.startTime ||
      (currentBatch.endTime || "") !== formData.endTime ||
      teacherIdChanged;

    const hasAdditions = newlyAddedCourseIds.length > 0;
    const hasOtherChanges = detailsChanged || coursesRemoved;

    return {
      originalCourseIds,
      currentAssignedCourseIds,
      newlyAddedCourseIds,
      newlyAddedSet: new Set(newlyAddedCourseIds.map(String)),
      coursesRemoved,
      detailsChanged,
      hasAdditions,
      hasOtherChanges,
      hasAnyChanges: hasAdditions || hasOtherChanges,
    };
  }, [
    isBatchMatched,
    currentBatch,
    assignedCourses,
    formData,
    teachers,
    resolveInitialTeacherId,
  ]);

  // --- Memoized Event Handlers (useCallback) ---
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleSelectTeacher = useCallback((teacherId) => {
    setFormData((prev) => ({ ...prev, teacherId }));
    setSelectedNewCourse(""); // Reset course selection on teacher change
    setIsTeacherDropdownOpen(false);
    setTeacherSearch("");
  }, []);

  const handleAddCourse = useCallback(() => {
    if (!selectedNewCourse) return;
    const courseObj = mainClassesMap.get(String(selectedNewCourse));
    if (
      courseObj &&
      !assignedCourses.some(
        (c) => String(c._id || c) === String(selectedNewCourse)
      )
    ) {
      setAssignedCourses((prev) => [...prev, courseObj]);
      setSelectedNewCourse("");
    }
  }, [selectedNewCourse, mainClassesMap, assignedCourses]);

  const handleRemoveCourse = useCallback((courseId) => {
    setAssignedCourses((prev) =>
      prev.filter((c) => String(c._id || c) !== String(courseId))
    );
  }, []);

  const handleResetChanges = useCallback(() => {
    if (!currentBatch) return;
    setFormData({
      name: currentBatch.name || "",
      weekday: currentBatch.weekday || "Monday",
      startTime: currentBatch.startTime || "",
      endTime: currentBatch.endTime || "",
      teacherId: resolveInitialTeacherId(currentBatch, teachers),
    });
    setAssignedCourses(currentBatch.mainClasses || []);
    setSelectedNewCourse("");
    toast.success("Changes reset to original values");
  }, [currentBatch, teachers, resolveInitialTeacherId]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();

      const {
        newlyAddedCourseIds,
        currentAssignedCourseIds,
        hasAdditions,
        hasOtherChanges,
      } = changeState;

      if (!hasAdditions && !hasOtherChanges) {
        toast.success("No changes to save.");
        return navigate(-1);
      }

      setIsSubmitting(true);
      try {
        // Part A: Add all new courses one by one using the mainClassId endpoint.
        if (hasAdditions) {
          for (let i = 0; i < newlyAddedCourseIds.length; i++) {
            const mainClassId = newlyAddedCourseIds[i];
            const isLastUpdate =
              i === newlyAddedCourseIds.length - 1 && !hasOtherChanges;
            await updateBatch(
              id,
              { mainClassId },
              isLastUpdate ? navigate : undefined
            );
          }
        }

        // Part B: If other details changed or courses were removed, send one final update.
        if (hasOtherChanges) {
          const finalStatePayload = {
            name: formData.name,
            weekday: formData.weekday,
            startTime: formData.startTime,
            endTime: formData.endTime,
            teachers: formData.teacherId ? [formData.teacherId] : [],
            mainClasses: currentAssignedCourseIds,
          };
          await updateBatch(id, finalStatePayload, navigate);
        }
      } catch (error) {
        console.error("An error occurred during batch update:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [changeState, formData, id, navigate, updateBatch]
  );

  // Show skeleton while initial batch data is loading
  if (!id || (!isBatchMatched && isLoading) || !currentBatch) {
    return <EditBatchSkeleton />;
  }

  const isSaving = isLoading || isSubmitting;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8 max-w-3xl min-h-screen bg-background text-foreground transition-colors duration-300"
    >
      <Helmet>
        <title>{`IOK - Edit Batch | ${currentBatch.name || "Batch"}`}</title>
      </Helmet>

      {/* Top Navigation & Unsaved Status Bar */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <BackButton details="Return to batch details" />

        {changeState.hasAnyChanges && (
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles className="w-3.5 h-3.5" />
              Unsaved Changes
            </span>
            <button
              type="button"
              onClick={handleResetChanges}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-card hover:bg-muted text-muted-foreground hover:text-foreground border border-border transition-all shadow-sm"
              title="Revert all unsaved changes"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Main Form Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-card border border-border shadow-sm">
        {/* Card Header */}
        <div className="pb-6 mb-6 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold tracking-wide uppercase mb-2">
              <Calendar className="w-3.5 h-3.5" />
              Batch Configuration
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Edit Batch Details
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Update schedule timing, assigned instructor, or linked courses.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Batch Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
              Batch Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground shadow-sm"
              placeholder="e.g. Morning Batch A"
            />
          </div>

          {/* Weekday & Teacher Assignment */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Schedule Weekday
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  name="weekday"
                  value={formData.weekday}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm cursor-pointer"
                >
                  {WEEKDAYS.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Searchable Custom Teacher Dropdown */}
            <div ref={teacherDropdownRef} className="relative">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Assigned Instructor
              </label>

              <button
                type="button"
                onClick={() => setIsTeacherDropdownOpen((prev) => !prev)}
                className="w-full px-4 py-3 min-h-[50px] rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all cursor-pointer flex items-center justify-between shadow-sm text-left"
              >
                {selectedTeacher ? (
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-7 h-7 shrink-0 rounded-lg bg-primary/15 text-primary overflow-hidden flex items-center justify-center border border-primary/20">
                      {selectedTeacher.profilePic ||
                      selectedTeacher.profilePicture ? (
                        <img
                          src={
                            selectedTeacher.profilePic ||
                            selectedTeacher.profilePicture
                          }
                          alt={selectedTeacher.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-xs font-bold">
                          {(
                            selectedTeacher.name?.charAt(0) || "T"
                          ).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate text-sm text-foreground">
                        {selectedTeacher.name || "Unknown"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 opacity-70" />
                    Select a Teacher...
                  </span>
                )}
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform shrink-0 ${
                    isTeacherDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isTeacherDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15 }}
                    className="absolute z-50 w-full mt-2 bg-card rounded-2xl border border-border shadow-2xl overflow-hidden"
                  >
                    {/* Search Input Inside Teacher Dropdown */}
                    <div className="p-2.5 border-b border-border bg-muted/20">
                      <div className="relative flex items-center">
                        <Search className="absolute left-3 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <input
                          type="text"
                          value={teacherSearch}
                          onChange={(e) => setTeacherSearch(e.target.value)}
                          placeholder="Filter teachers by name or email..."
                          className="w-full pl-8 pr-8 py-2 rounded-xl border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        />
                        {teacherSearch && (
                          <button
                            type="button"
                            onClick={() => setTeacherSearch("")}
                            className="absolute right-2.5 text-muted-foreground hover:text-foreground"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="max-h-56 overflow-y-auto custom-scrollbar">
                      {filteredTeachers.length > 0 ? (
                        <ul className="py-1 divide-y divide-border/40">
                          {filteredTeachers.map((teacher) => (
                            <TeacherOptionItem
                              key={teacher._id}
                              teacher={teacher}
                              isSelected={
                                String(formData.teacherId) ===
                                String(teacher._id)
                              }
                              onSelect={handleSelectTeacher}
                            />
                          ))}
                        </ul>
                      ) : (
                        <div className="p-4 text-center text-xs text-muted-foreground">
                          {teachers?.length === 0
                            ? "No teachers available."
                            : "No teachers match your search."}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Start Time & End Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Start Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="time"
                  name="startTime"
                  required
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                End Time
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <input
                  type="time"
                  name="endTime"
                  required
                  value={formData.endTime}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-border bg-background text-foreground font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Assigned Courses & Add New Course Section */}
          <div className="pt-6 border-t border-border space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  Assigned Courses
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Manage courses linked to this batch. Changes apply on save.
                </p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                {assignedCourses.length} Linked
              </span>
            </div>

            {/* Assigned Courses List */}
            <div className="space-y-2.5">
              <AnimatePresence initial={false}>
                {assignedCourses.map((cls) => {
                  const cid = String(cls._id || cls);
                  const resolvedCourse =
                    typeof cls === "object" && cls?.name
                      ? cls
                      : mainClassesMap.get(cid) || cls;

                  return (
                    <AssignedCourseItem
                      key={cid}
                      course={resolvedCourse}
                      courseId={cls._id || cls}
                      isNewlyAdded={changeState.newlyAddedSet.has(cid)}
                      onRemove={handleRemoveCourse}
                    />
                  );
                })}
              </AnimatePresence>

              {assignedCourses.length === 0 && (
                <div className="text-sm text-muted-foreground p-6 text-center border border-dashed border-border rounded-2xl bg-muted/10">
                  No courses assigned to this batch yet. Select a course below
                  to link it.
                </div>
              )}
            </div>

            {/* Add New Course Selector */}
            <div className="p-4 rounded-2xl bg-muted/20 border border-border/60">
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Link Additional Course (Optional)
              </label>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <select
                  value={selectedNewCourse}
                  onChange={(e) => setSelectedNewCourse(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground font-medium focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50"
                  disabled={availableClassesToAdd.length === 0}
                >
                  <option value="">
                    {availableClassesToAdd.length === 0
                      ? "All available courses are already linked"
                      : "-- Select a course to add --"}
                  </option>
                  {availableClassesToAdd.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} {c.fees !== undefined ? `(₹${c.fees})` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleAddCourse}
                  disabled={!selectedNewCourse}
                  className="px-5 py-3 bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground disabled:opacity-40 disabled:pointer-events-none rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Course</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-border flex flex-col-reverse sm:flex-row gap-3.5">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => navigate(-1)}
              className="w-full py-3.5 bg-muted hover:bg-muted/80 text-foreground font-bold text-sm rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 bg-primary hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold text-sm rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default React.memo(EditBatch);