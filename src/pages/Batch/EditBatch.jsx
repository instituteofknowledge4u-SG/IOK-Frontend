import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, BookOpen, Trash2, Plus } from "lucide-react";
import toast from "react-hot-toast";
import useBatchStore from "../../stores/useBatchStore";
import useUserStore from "../../stores/useUserStore";
import useClassStore from "../../stores/useClassStore";
import BackButton from "../../components/UI/Button";

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

  // Custom Dropdown State for Teacher
  const [isTeacherDropdownOpen, setIsTeacherDropdownOpen] = useState(false);
  const teacherDropdownRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchBatchById(id);
    } else {
      navigate("/batches");
    }
    getTeachers();
    getClasses();
  }, [id, fetchBatchById, getTeachers, getClasses, navigate]);

  useEffect(() => {
    if (currentBatch && teachers?.length > 0) {
      let initialTeacherId = "";

      if (currentBatch.teachers && currentBatch.teachers.length > 0) {
        initialTeacherId =
          currentBatch.teachers[0]._id || currentBatch.teachers[0];
      } else if (currentBatch.teacherEmail) {
        const found = teachers.find(
          (t) => t.email === currentBatch.teacherEmail,
        );
        if (found) initialTeacherId = found._id;
      }

      setFormData({
        name: currentBatch.name || "",
        weekday: currentBatch.weekday || "Monday",
        startTime: currentBatch.startTime || "",
        endTime: currentBatch.endTime || "",
        teacherId: initialTeacherId,
      });
      setAssignedCourses(currentBatch.mainClasses || []);
    }
  }, [currentBatch, teachers]);

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

  const handleAddCourse = () => {
    if (!selectedNewCourse) return;
    const courseObj = mainClasses.find((c) => c._id === selectedNewCourse);
    if (
      courseObj &&
      !assignedCourses.some((c) => c._id === selectedNewCourse)
    ) {
      setAssignedCourses([...assignedCourses, courseObj]);
      setSelectedNewCourse("");
    }
  };

  const handleRemoveCourse = (courseId) => {
    setAssignedCourses(
      assignedCourses.filter((c) => (c._id || c) !== courseId),
    );
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --- 1. Identify all changes ---
    const originalCourseIds =
      currentBatch.mainClasses?.map((c) => c._id || c) || [];
    const currentAssignedCourseIds = assignedCourses.map((c) => c._id || c);

    const newlyAddedCourseIds = currentAssignedCourseIds.filter(
      (id) => !originalCourseIds.includes(id),
    );
    const coursesRemoved = originalCourseIds.some(
      (id) => !currentAssignedCourseIds.includes(id),
    );
    const teacherIdChanged =
      (currentBatch.teachers?.[0]?._id || currentBatch.teachers?.[0] || "") !==
      formData.teacherId;
    const detailsChanged =
      currentBatch.name !== formData.name ||
      currentBatch.weekday !== formData.weekday ||
      currentBatch.startTime !== formData.startTime ||
      currentBatch.endTime !== formData.endTime ||
      teacherIdChanged;

    const hasAdditions = newlyAddedCourseIds.length > 0;
    const hasOtherChanges = detailsChanged || coursesRemoved;

    if (!hasAdditions && !hasOtherChanges) {
      toast.success("No changes to save.");
      return navigate(-1);
    }

    // --- 2. Perform updates sequentially ---
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
            isLastUpdate ? navigate : undefined,
          );
        }
      }

      // Part B: If other details changed or courses were removed, send one final update.
      // This sets the final state for batch details and the course list.
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
      // The store likely handles toasts, but we can log here.
      console.error("An error occurred during batch update:", error);
    }
  };

  const selectedTeacher = teachers?.find((t) => t._id === formData.teacherId);

  // Available courses to add
  const availableClassesToAdd = (mainClasses || []).filter((cls) => {
    const batchHasClass = assignedCourses.some(
      (bc) => (bc._id || bc) === cls._id,
    );
    return !batchHasClass;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-8 max-w-2xl"
    >
      <div className="p-8 rounded-3xl bg-card/60 backdrop-blur-2xl border border-border shadow-2xl">
        <div className="pb-5">
          <BackButton />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-8">Edit Batch</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Batch Name
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all placeholder:text-muted-foreground"
              placeholder="e.g. Morning Batch A"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Weekday
              </label>
              <select
                name="weekday"
                value={formData.weekday}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              >
                {[
                  "Monday",
                  "Tuesday",
                  "Wednesday",
                  "Thursday",
                  "Friday",
                  "Saturday",
                  "Sunday",
                ].map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Teacher Dropdown */}
            <div ref={teacherDropdownRef} className="relative">
              <label className="block text-sm font-medium text-foreground mb-2">
                Assign Teacher
              </label>

              <div
                onClick={() => setIsTeacherDropdownOpen(!isTeacherDropdownOpen)}
                className="w-full px-4 py-3 min-h-[50px] rounded-xl border border-border bg-background text-foreground focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary outline-none transition-all cursor-pointer flex items-center justify-between shadow-sm"
              >
                {selectedTeacher ? (
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-6 h-6 shrink-0 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center border border-border">
                      {selectedTeacher.profilePic ||
                      selectedTeacher.profilePicture ? (
                        <img
                          src={
                            selectedTeacher.profilePic ||
                            selectedTeacher.profilePicture
                          }
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-primary">
                          {(
                            selectedTeacher.name?.charAt(0) || "T"
                          ).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className="font-medium truncate text-sm">
                      {selectedTeacher.name || "Unknown"}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    Select a Teacher...
                  </span>
                )}
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${isTeacherDropdownOpen ? "rotate-180" : ""}`}
                />
              </div>

              <AnimatePresence>
                {isTeacherDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute z-50 w-full mt-2 bg-card rounded-xl border border-border shadow-2xl max-h-60 overflow-y-auto custom-scrollbar"
                  >
                    {teachers?.length > 0 ? (
                      <ul className="py-2">
                        {teachers.map((teacher) => (
                          <li
                            key={teacher._id}
                            onClick={() => {
                              setFormData({
                                ...formData,
                                teacherId: teacher._id,
                              });
                              setSelectedNewCourse(""); // Reset course selection on teacher change
                              setIsTeacherDropdownOpen(false);
                            }}
                            className={`px-4 py-3 flex items-center gap-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                              formData.teacherId === teacher._id
                                ? "bg-primary/5"
                                : ""
                            }`}
                          >
                            <div className="w-8 h-8 shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs overflow-hidden shadow-inner">
                              {teacher.profilePic || teacher.profilePicture ? (
                                <img
                                  src={
                                    teacher.profilePic || teacher.profilePicture
                                  }
                                  alt="pic"
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                (
                                  teacher.name?.charAt(0) ||
                                  teacher.email?.charAt(0) ||
                                  "T"
                                ).toUpperCase()
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
                            {formData.teacherId === teacher._id && (
                              <Check className="w-4 h-4 text-primary shrink-0 ml-2" />
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-4 text-center text-sm text-muted-foreground">
                        No teachers available.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Start Time
              </label>
              <input
                type="time"
                name="startTime"
                required
                value={formData.startTime}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                End Time
              </label>
              <input
                type="time"
                name="endTime"
                required
                value={formData.endTime}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>

          {/* Assigned Courses / Add Course */}
          <div className="pt-4 border-t border-border">
            <label className="block text-sm font-medium text-foreground mb-3">
              Assigned Courses
            </label>
            <div className="space-y-2 mb-4">
              {assignedCourses.map((cls) => (
                <div
                  key={cls._id || cls}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border group"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground text-sm">
                      {cls.name || "Unknown Course"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveCourse(cls._id || cls)}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {assignedCourses.length === 0 && (
                <div className="text-sm text-muted-foreground p-3 border border-dashed border-border rounded-xl">
                  No courses assigned yet.
                </div>
              )}
            </div>

            <label className="block text-sm font-medium text-foreground mb-2">
              Add New Course (Optional)
            </label>
            <div className="flex gap-2">
              <select
                value={selectedNewCourse}
                onChange={(e) => setSelectedNewCourse(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                disabled={availableClassesToAdd.length === 0}
              >
                <option value="">
                  {availableClassesToAdd.length === 0
                    ? "No available courses to add"
                    : "-- Select a course to add --"}
                </option>
                {availableClassesToAdd.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddCourse}
                disabled={!selectedNewCourse}
                className="px-4 py-3 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 rounded-xl font-medium transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              You can add or remove courses. Changes apply when you save.
            </p>
          </div>

          <div className="pt-6 flex gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full py-3.5 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/30 active:scale-[0.98]"
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default EditBatch;
