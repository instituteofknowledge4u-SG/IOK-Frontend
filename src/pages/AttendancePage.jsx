import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Layers,
  Clock,
  Users,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Check,
  X,
  Calendar,
  BarChart3,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../stores/useAuthStore";
import useAttendanceStore from "../stores/useAttendanceStore";
import toast from "react-hot-toast";
import BackButton from "../components/UI/Button";
import { filterBatchesForTeacher } from "../util/teacherAccessControl";

const AttendancePage = () => {
  const navigate = useNavigate();

  const userData = useAuthStore((state) => state.user);
  const loadUser = useAuthStore((state) => state.loadUser);
  const userId = useAuthStore((state) => state.id);
  const userRole = useAuthStore((state) => state.userRole);

  const {
    batches,
    selectedBatch,
    students,
    attendance,
    attendanceDate,
    isLoading,
    error,
    success,
    getTeacherBatches,
    getAllBatches,
    selectBatch,
    toggleAttendance,
    markAllPresent,
    markAllAbsent,
    submitAttendance,
    setAttendanceDate,
    resetStore,
    clearError,
  } = useAttendanceStore();

  const [isBatchDropdownOpen, setIsBatchDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBatchSelection, setShowBatchSelection] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isTimeValid, setIsTimeValid] = useState(true);
  const [timeMessage, setTimeMessage] = useState("");

  // Load user and batches on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (userId && userRole) {
      getAllBatches();
    }
  }, [userId, userRole, getTeacherBatches, getAllBatches]);

  // Real-time Batch Schedule Validation for Teachers
  useEffect(() => {
    if (!selectedBatch) return;

    if (userRole === "Admin") {
      setIsTimeValid(true);
      setTimeMessage("");
      return;
    }

    const checkBatchTime = () => {
      const now = new Date();
      const days = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const currentDayName = days[now.getDay()];

      // Check Day
      if (
        selectedBatch.weekday &&
        currentDayName.toLowerCase() !== selectedBatch.weekday.toLowerCase()
      ) {
        setIsTimeValid(false);
        setTimeMessage(
          `This batch runs on ${selectedBatch.weekday}s. Today is ${currentDayName}, attendance is locked.`,
        );
        return;
      }

      // Parse and Check Time
      const parseTime = (t) => {
        if (!t) return null;
        const match = t.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);
        if (!match) return null;
        let [_, h, m, modifier] = match;
        h = parseInt(h, 10);
        m = parseInt(m, 10);
        if (modifier) {
          modifier = modifier.toLowerCase();
          if (modifier === "pm" && h < 12) h += 12;
          if (modifier === "am" && h === 12) h = 0;
        }
        const d = new Date();
        d.setHours(h, m, 0, 0);
        return d;
      };

      const startTime = parseTime(selectedBatch.startTime);
      const endTime = parseTime(selectedBatch.endTime);

      if (startTime && endTime) {
        if (now >= startTime && now <= endTime) {
          setIsTimeValid(true);
          setTimeMessage("");
        } else {
          setIsTimeValid(false);
          setTimeMessage(
            `Attendance can only be modified during batch hours (${selectedBatch.startTime} - ${selectedBatch.endTime}).`,
          );
        }
      } else {
        setIsTimeValid(true);
        setTimeMessage("");
      }
    };

    checkBatchTime();
    const interval = setInterval(checkBatchTime, 60000); // Re-check every minute
    return () => clearInterval(interval);
  }, [selectedBatch, userRole]);

  const handleSelectBatch = async (batch) => {
    try {
      await selectBatch(batch);

      // Force lock attendance date to 'Today' for Teachers
      if (userRole === "Teacher") {
        setAttendanceDate(new Date().toISOString().split("T")[0]);
      }

      setShowBatchSelection(false);
      setIsBatchDropdownOpen(false);
      toast.success(`Batch "${batch.name}" selected`);
    } catch (err) {
      toast.error("Failed to select batch");
    }
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();

    if (!selectedBatch) {
      toast.error("Please select a batch first");
      return;
    }

    if (students.length === 0) {
      toast.error("No students in this batch");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAttendance();
      toast.success("Attendance submitted successfully!");
      resetStore();
      setShowBatchSelection(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit attendance");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate statistics
  const totalStudents = students.length;
  const checkIsPresent = (val) => {
    if (!val) return false;
    if (val === true) return true;
    if (typeof val === "string" && val.toLowerCase() === "present") return true;
    if (val.status && val.status.toLowerCase() === "present") return true;
    return false;
  };
  const presentCount = Object.values(attendance).filter(checkIsPresent).length;
  const absentCount = totalStudents - presentCount;

  // Filter students by search term
  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower)
    );
  });

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  const displayedBatches = filterBatchesForTeacher(
    batches,
    userData?.batches || [],
    userRole,
    userData?.email,
    userData?._id,
  );

  if (!userData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="font-medium">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-background text-foreground p-6 md:p-8 transition-colors duration-300"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <BackButton details={`Track and manage your batch attendance`} />
        </div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-xl flex items-start gap-3 border bg-destructive/10 border-destructive/20 text-destructive"
          >
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">{error}</p>
              <button
                onClick={clearError}
                className="text-xs mt-1 text-destructive hover:opacity-80 underline"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}

        {/* Success Alert */}
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 p-4 rounded-xl flex items-start gap-3 border bg-success/10 border-success/20 text-success"
            >
              <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-medium">Attendance submitted successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        {isLoading && displayedBatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground font-medium">
              Loading your batches...
            </p>
          </div>
        ) : displayedBatches.length === 0 ? (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="bg-card border border-border rounded-2xl shadow-sm p-8 text-center"
          >
            <Layers className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">
              No Batches Assigned
            </h2>
            <p className="text-muted-foreground">
              You don't have any batches assigned yet. Contact your admin to
              assign you a batch.
            </p>
          </motion.div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Batch Selection Card */}
            <motion.div
              variants={itemVariants}
              className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8"
            >
              <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Select Your Batch
              </h2>

              {/* Batch Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsBatchDropdownOpen(!isBatchDropdownOpen)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    isBatchDropdownOpen
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  {selectedBatch ? (
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/20 text-primary rounded-lg">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground">
                          {selectedBatch.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedBatch.weekday} • {selectedBatch.startTime} -{" "}
                          {selectedBatch.endTime}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">
                      Click to select a batch...
                    </span>
                  )}
                  <ChevronDown
                    className={`w-5 h-5 text-muted-foreground transition-transform ${
                      isBatchDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                <AnimatePresence>
                  {isBatchDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden"
                    >
                      {displayedBatches.map((batch) => (
                        <button
                          key={batch._id}
                          onClick={() => handleSelectBatch(batch)}
                          className="w-full text-left p-4 border-b border-border/50 hover:bg-muted/50 transition-colors last:border-b-0"
                        >
                          <p className="font-semibold text-foreground">
                            {batch.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {batch.weekday} • {batch.startTime} -{" "}
                            {batch.endTime}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            {batch.students?.length || 0} students
                          </p>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>

            {/* Attendance Form */}
            {selectedBatch && students.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8"
              >
                <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Mark Attendance
                </h2>

                {/* Schedule Access Warning */}
                {timeMessage && (
                  <div className="mb-6 p-4 rounded-xl flex items-start gap-3 border bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400">
                    <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="font-medium text-sm">{timeMessage}</p>
                  </div>
                )}

                <form onSubmit={handleSubmitAttendance} className="space-y-6">
                  {/* Date Selection */}
                  <div className="space-y-2">
                    <label
                      htmlFor="attendanceDate"
                      className="block text-sm font-semibold text-foreground"
                    >
                      Attendance Date{" "}
                      <span className="text-destructive">*</span>
                    </label>
                    <input
                      type="date"
                      id="attendanceDate"
                      value={attendanceDate}
                      disabled={userRole === "Teacher"}
                      onChange={(e) => setAttendanceDate(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Student Search */}
                  <div className="space-y-2">
                    <label
                      htmlFor="searchStudents"
                      className="block text-sm font-semibold text-foreground"
                    >
                      Search Students
                    </label>
                    <input
                      type="text"
                      id="searchStudents"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={markAllPresent}
                      disabled={!isTimeValid}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-success/20 text-success font-medium hover:bg-success/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark All Present
                    </button>
                    <button
                      type="button"
                      onClick={markAllAbsent}
                      disabled={!isTimeValid}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-destructive/20 text-destructive font-medium hover:bg-destructive/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Mark All Absent
                    </button>
                  </div>

                  {/* Students List */}
                  <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                    {filteredStudents.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No students found matching your search
                      </p>
                    ) : (
                      filteredStudents.map((student) => (
                        <motion.div
                          key={student._id}
                          className={`flex items-center gap-4 p-4 rounded-xl border border-border transition-all ${isTimeValid ? "hover:border-primary/50 hover:bg-muted/50 cursor-pointer" : "opacity-60 cursor-not-allowed"}`}
                          onClick={() => {
                            if (isTimeValid) toggleAttendance(student._id);
                          }}
                        >
                          <img
                            src={
                              student.profilePic ||
                              `https://ui-avatars.com/api/?name=${student.name}&background=e0e7ff&color=4f46e5`
                            }
                            alt={student.name}
                            className="w-10 h-10 rounded-full object-cover border border-border"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">
                              {student.name}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {student.email}
                            </p>
                          </div>
                          <div className="shrink-0">
                            <motion.div
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                checkIsPresent(attendance[student._id])
                                  ? "bg-success text-success-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {checkIsPresent(attendance[student._id]) ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <X className="w-5 h-5" />
                              )}
                            </motion.div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={
                      isSubmitting || students.length === 0 || !isTimeValid
                    }
                    className="w-full py-3 px-6 bg-primary hover:opacity-90 text-primary-foreground font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-primary/20"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Submit Attendance
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* Statistics Footer */}
            {selectedBatch && students.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
              >
                {/* Total Students */}
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-primary/10 border border-primary/20 rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-primary mb-1">
                        Total Students
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {totalStudents}
                      </p>
                    </div>
                    <div className="p-3 bg-primary/20 text-primary rounded-lg">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </motion.div>

                {/* Present */}
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-success/10 border border-success/20 rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-success mb-1">
                        Present
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {presentCount}
                      </p>
                      <p className="text-xs text-success mt-1">
                        {((presentCount / totalStudents) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 bg-success/20 text-success rounded-lg">
                      <Check className="w-6 h-6" />
                    </div>
                  </div>
                </motion.div>

                {/* Absent */}
                <motion.div
                  whileHover={{ y: -5 }}
                  className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-destructive mb-1">
                        Absent
                      </p>
                      <p className="text-3xl font-bold text-foreground">
                        {absentCount}
                      </p>
                      <p className="text-xs text-destructive mt-1">
                        {((absentCount / totalStudents) * 100).toFixed(1)}%
                      </p>
                    </div>
                    <div className="p-3 bg-destructive/20 text-destructive rounded-lg">
                      <X className="w-6 h-6" />
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AttendancePage;
