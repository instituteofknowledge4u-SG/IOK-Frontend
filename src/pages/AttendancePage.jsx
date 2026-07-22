import React, { useState, useEffect, useMemo } from "react";
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
  Search,
  Filter,
  CalendarDays,
  Sunrise,
  Sun,
  Moon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import useAuthStore from "../stores/useAuthStore";
import useAttendanceStore from "../stores/useAttendanceStore";
import toast from "react-hot-toast";
import BackButton from "../components/UI/Button";
import { filterBatchesForTeacher } from "../util/teacherAccessControl";

// Utility to parse hour in 24h format for time-based filtering
const getBatchHour = (timeStr) => {
  if (!timeStr) return -1;
  const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM|am|pm)?/);
  if (!match) return -1;
  let h = parseInt(match[1], 10);
  const modifier = match[3]?.toLowerCase();
  if (modifier === "pm" && h < 12) h += 12;
  if (modifier === "am" && h === 12) h = 0;
  return h;
};

const DAYS = [
  "All",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const TIME_SLOTS = [
  { label: "All Times", value: "All", icon: Clock },
  { label: "Morning (< 12 PM)", value: "Morning", icon: Sunrise },
  { label: "Afternoon (12-5 PM)", value: "Afternoon", icon: Sun },
  { label: "Evening (> 5 PM)", value: "Evening", icon: Moon },
];

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showBatchSelection, setShowBatchSelection] = useState(true);

  // Student Search
  const [searchTerm, setSearchTerm] = useState("");

  // New Batch Filters
  const [batchSearchTerm, setBatchSearchTerm] = useState("");
  const [selectedDay, setSelectedDay] = useState("All");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("All");

  const [isTimeValid, setIsTimeValid] = useState(true);
  const [timeMessage, setTimeMessage] = useState("");

  const normalizedRole = userRole?.toLowerCase();
  const isAdmin = normalizedRole === "admin";
  const isTeacher = normalizedRole === "teacher";
  const getStudentId = (student) =>
    student?._id || student?.id || student?.studentId;

  // Load user and batches on mount
  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (userId && userRole) {
      getAllBatches();
    }
  }, [userId, userRole, getTeacherBatches, getAllBatches]);

  // Set default day to today's day on load
  useEffect(() => {
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    setSelectedDay(today);
  }, []);

  // Real-time Batch Schedule Validation for Teachers
  useEffect(() => {
    if (!selectedBatch || showBatchSelection) return;

    if (isAdmin) {
      setIsTimeValid(true);
      setTimeMessage("");
      return;
    }

    const checkBatchTime = () => {
      const now = new Date();
      const currentDayName = now.toLocaleDateString("en-US", {
        weekday: "long",
      });

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
  }, [selectedBatch, isAdmin, showBatchSelection]);

  const handleSelectBatch = async (batch) => {
    try {
      await selectBatch(batch);

      // Force lock attendance date to 'Today' for Teachers
      if (isTeacher) {
        setAttendanceDate(new Date().toISOString().split("T")[0]);
      }

      setShowBatchSelection(false);
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

  // Calculations & Filters
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

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      String(getStudentId(student) || "")
        .toLowerCase()
        .includes(searchLower)
    );
  });

  const displayedBatches = isAdmin
    ? batches
    : filterBatchesForTeacher(
        batches,
        userData?.batches || [],
        userRole,
        userData?.email,
        userData?._id,
      );

  // Apply User Selection Filters for Batches
  const filteredBatches = useMemo(() => {
    return displayedBatches.filter((batch) => {
      // Name Search Filter
      const matchName = batch.name
        ?.toLowerCase()
        .includes(batchSearchTerm.toLowerCase());

      // Weekday Filter
      const matchDay =
        selectedDay === "All" ||
        batch.weekday?.toLowerCase() === selectedDay.toLowerCase();

      // Time Filter
      let matchTime = true;
      if (selectedTimeSlot !== "All") {
        const hour = getBatchHour(batch.startTime);
        if (hour !== -1) {
          if (selectedTimeSlot === "Morning") matchTime = hour < 12;
          else if (selectedTimeSlot === "Afternoon")
            matchTime = hour >= 12 && hour < 17;
          else if (selectedTimeSlot === "Evening") matchTime = hour >= 17;
        }
      }
      return matchName && matchDay && matchTime;
    });
  }, [displayedBatches, batchSearchTerm, selectedDay, selectedTimeSlot]);

  // Animation Variants
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <BackButton details={`Track and manage your batch attendance`} />
        </div>

        {/* Global Alerts */}
        <AnimatePresence>
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

        {/* Main Content Loading State */}
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
            {/* View 1: BATCH SELECTION */}
            {showBatchSelection ? (
              <motion.div variants={itemVariants} className="space-y-6">
                {/* Filter Controls */}
                <div className="bg-card border border-border rounded-2xl shadow-sm p-4 md:p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Input */}
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search batches by name..."
                        value={batchSearchTerm}
                        onChange={(e) => setBatchSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>

                    {/* Weekday Filter */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <select
                          value={selectedDay}
                          onChange={(e) => setSelectedDay(e.target.value)}
                          className="appearance-none pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer min-w-[140px]"
                        >
                          {DAYS.map((day) => (
                            <option key={day} value={day}>
                              {day}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>

                    {/* Time Slot Filter */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <select
                          value={selectedTimeSlot}
                          onChange={(e) => setSelectedTimeSlot(e.target.value)}
                          className="appearance-none pl-10 pr-10 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer min-w-[170px]"
                        >
                          {TIME_SLOTS.map((slot) => (
                            <option key={slot.value} value={slot.value}>
                              {slot.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Filtered Batches Grid */}
                {filteredBatches.length === 0 ? (
                  <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <p className="text-muted-foreground font-medium">
                      No batches match your filters.
                    </p>
                    <button
                      onClick={() => {
                        setBatchSearchTerm("");
                        setSelectedDay("All");
                        setSelectedTimeSlot("All");
                      }}
                      className="mt-3 text-primary text-sm hover:underline"
                    >
                      Clear all filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredBatches.map((batch) => (
                      <motion.div
                        key={batch._id}
                        whileHover={{ y: -4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelectBatch(batch)}
                        className="bg-card border border-border rounded-2xl p-5 cursor-pointer shadow-sm hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between group"
                      >
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {batch.name}
                            </h3>
                            <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold whitespace-nowrap">
                              {batch.weekday}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mb-4">
                            <Clock className="w-4 h-4 mr-1.5 opacity-70" />
                            {batch.startTime} - {batch.endTime}
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-border">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="w-4 h-4 mr-1.5 opacity-70" />
                            {batch.students?.length || 0} Students
                          </div>
                          <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowLeft className="w-4 h-4 rotate-180" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            ) : (
              /* View 2: ATTENDANCE FORM (Batch is selected) */
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="space-y-6"
              >
                {/* Active Batch Summary Card */}
                <motion.div
                  variants={itemVariants}
                  className="bg-primary/5 border border-primary/20 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 text-primary rounded-xl hidden sm:block">
                      <Layers className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-foreground leading-tight">
                        {selectedBatch.name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />{" "}
                        {selectedBatch.weekday}
                        <span className="opacity-50">•</span>
                        <Clock className="w-4 h-4" /> {selectedBatch.startTime}{" "}
                        - {selectedBatch.endTime}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowBatchSelection(true)}
                    className="px-4 py-2 bg-background border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors whitespace-nowrap"
                  >
                    Change Batch
                  </button>
                </motion.div>

                {/* Attendance Interface */}
                {students.length > 0 ? (
                  <motion.div
                    variants={itemVariants}
                    className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8"
                  >
                    <h2 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-primary" /> Mark
                      Attendance
                    </h2>

                    {/* Schedule Access Warning */}
                    {timeMessage && (
                      <div className="mb-6 p-4 rounded-xl flex items-start gap-3 border bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400">
                        <Clock className="w-5 h-5 shrink-0 mt-0.5" />
                        <p className="font-medium text-sm">{timeMessage}</p>
                      </div>
                    )}

                    <form
                      onSubmit={handleSubmitAttendance}
                      className="space-y-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            disabled={isTeacher}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Student Search within Batch */}
                        <div className="space-y-2">
                          <label
                            htmlFor="searchStudents"
                            className="block text-sm font-semibold text-foreground"
                          >
                            Find Student
                          </label>
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              id="searchStudents"
                              placeholder="Search by name or email..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions */}
                      <div className="flex gap-3 pt-2">
                        <button
                          type="button"
                          onClick={markAllPresent}
                          disabled={!isTimeValid}
                          className="flex-1 px-4 py-2.5 rounded-lg bg-success/10 text-success border border-success/20 font-medium hover:bg-success/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          Mark All Present
                        </button>
                        <button
                          type="button"
                          onClick={markAllAbsent}
                          disabled={!isTimeValid}
                          className="flex-1 px-4 py-2.5 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 font-medium hover:bg-destructive/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                        >
                          Mark All Absent
                        </button>
                      </div>

                      {/* Students List */}
                      <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                        {filteredStudents.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8 border-2 border-dashed border-border rounded-xl">
                            No students found matching your search.
                          </p>
                        ) : (
                          filteredStudents.map((student) => {
                            const studentId = getStudentId(student);
                            const isPresent = checkIsPresent(
                              attendance[studentId],
                            );

                            return (
                              <motion.div
                                key={studentId}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                                  isTimeValid
                                    ? isPresent
                                      ? "border-success/50 bg-success/5 cursor-pointer"
                                      : "border-border hover:border-primary/50 hover:bg-muted/50 cursor-pointer"
                                    : "opacity-60 cursor-not-allowed border-border bg-muted/30"
                                }`}
                                onClick={() => {
                                  if (isTimeValid && studentId) {
                                    toggleAttendance(studentId);
                                  }
                                }}
                              >
                                <img
                                  src={
                                    student.profilePic ||
                                    `https://ui-avatars.com/api/?name=${student.name || student.email || "Student"}&background=e0e7ff&color=4f46e5`
                                  }
                                  alt={student.name || "Student"}
                                  className="w-10 h-10 rounded-full object-cover border border-border"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-foreground truncate">
                                    {student.name || "Unknown Student"}
                                  </p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {student.email || "No email available"}
                                  </p>
                                </div>
                                <div className="shrink-0">
                                  <motion.div
                                    whileHover={
                                      isTimeValid ? { scale: 1.1 } : {}
                                    }
                                    whileTap={
                                      isTimeValid ? { scale: 0.95 } : {}
                                    }
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                                      isPresent
                                        ? "bg-success text-white shadow-sm shadow-success/30"
                                        : "bg-muted text-muted-foreground"
                                    }`}
                                  >
                                    {isPresent ? (
                                      <Check className="w-5 h-5" />
                                    ) : (
                                      <X className="w-5 h-5" />
                                    )}
                                  </motion.div>
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>

                      {/* Submit Button */}
                      <button
                        type="submit"
                        disabled={
                          isSubmitting || students.length === 0 || !isTimeValid
                        }
                        className="w-full py-3.5 px-6 bg-primary hover:opacity-90 text-primary-foreground font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm shadow-primary/20 text-lg"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />{" "}
                            Submitting...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" /> Submit
                            Attendance
                          </>
                        )}
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <div className="bg-card border border-border rounded-2xl p-12 text-center">
                    <Users className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg text-foreground">
                      No Students Found
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      This batch currently has no enrolled students.
                    </p>
                  </div>
                )}

                {/* Statistics Footer */}
                {students.length > 0 && (
                  <motion.div
                    variants={itemVariants}
                    className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-10"
                  >
                    <motion.div
                      whileHover={{ y: -3 }}
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

                    <motion.div
                      whileHover={{ y: -3 }}
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

                    <motion.div
                      whileHover={{ y: -3 }}
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
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AttendancePage;