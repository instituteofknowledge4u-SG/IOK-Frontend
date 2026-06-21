import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  Loader2,
  Users,
  BookOpen,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import useAttendanceStore from "../stores/useAttendanceStore";
import useAuthStore from "../stores/useAuthStore";
import { api } from "../api/api";
import BackButton from "../components/UI/Button";
import { filterBatchesForTeacher } from "../util/teacherAccessControl";

const formatDateLocal = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getMonthRange = (monthValue) => {
  const [year, month] = monthValue.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return {
    startDate: formatDateLocal(start),
    endDate: formatDateLocal(end),
  };
};

const AttendanceStatus = () => {
  const userId = useAuthStore((state) => state.id);
  const userRole = useAuthStore((state) => state.userRole);
  const userData = useAuthStore((state) => state.user);
  const loadUser = useAuthStore((state) => state.loadUser);

  const {
    batches,
    getAllBatches,
    getTeacherBatches,
    isLoading: isBatchLoading,
  } = useAttendanceStore();

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [batchStudents, setBatchStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (!userRole || !userId) return;
    getAllBatches();
  }, [userRole, userId, getAllBatches, getTeacherBatches]);

  // Filter batches appropriately based on the user role
  const displayedBatches = useMemo(() => {
    if (!batches) return [];
    if (userRole === "Admin") return batches;
    if (userRole === "Teacher") {
      return filterBatchesForTeacher(
        batches,
        userData?.batches || [],
        userRole,
        userData?.email,
        userData?._id,
      );
    }
    if (userRole === "Student") {
      return batches.filter((batch) => {
        const inStudents = batch.students?.some((s) => (s._id || s) === userId);
        const inPairs = batch.mainClassStudentPairs?.some(
          (p) => (p.student?._id || p.student) === userId,
        );
        return inStudents || inPairs;
      });
    }
    return [];
  }, [batches, userRole, userData, userId]);

  // Enforce student selection constraints
  useEffect(() => {
    if (userRole === "Student" && (userData?._id || userId)) {
      setSelectedStudentId(userData?._id || userId);
    }
  }, [userRole, userId, userData]);

  useEffect(() => {
    if (userRole !== "Student" && batchStudents.length > 0) {
      if (
        !selectedStudentId ||
        !batchStudents.some(
          (s) => (s._id || s.id || s.studentId) === selectedStudentId,
        )
      ) {
        setSelectedStudentId(
          batchStudents[0]._id ||
            batchStudents[0].id ||
            batchStudents[0].studentId,
        );
      }
    }
  }, [batchStudents, userRole, selectedStudentId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedBatchId || !selectedMonth) return;
      setIsLoading(true);
      setError("");

      try {
        // 1. Fetch batch information to get the student list
        const batchResponse = await api.get(`/batch/show/${selectedBatchId}`);
        const batchData = batchResponse.data || batchResponse.data?.data;
        const pairs = batchData?.mainClassStudentPairs || [];

        const studentMap = new Map();
        pairs.forEach((pair) => {
          if (pair?.student?._id) {
            studentMap.set(pair.student._id, pair.student);
          }
        });

        const studentsList =
          studentMap.size > 0
            ? Array.from(studentMap.values())
            : batchData?.students || [];

        setBatchStudents(studentsList);

        // 2. Fetch the attendance records
        const { startDate, endDate } = getMonthRange(selectedMonth);
        const attendanceResponse = await api.get(
          `/attendence/by-date-range/${selectedBatchId}`,
          {
            params: { startDate, endDate },
          },
        );

        const records =
          attendanceResponse.data?.data || attendanceResponse.data || [];

        setAttendanceRecords(records);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load attendance");
        setBatchStudents([]);
        setAttendanceRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedBatchId, selectedMonth]);

  const calendarData = useMemo(() => {
    if (!selectedMonth || !selectedStudentId) return null;

    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOffset = new Date(year, month - 1, 1).getDay();

    const attMap = {};
    let presentCount = 0;
    let absentCount = 0;
    let totalClassCount = attendanceRecords.length;

    attendanceRecords.forEach((record) => {
      if (!record.date) return;
      const dateStr = record.date.split("T")[0]; // YYYY-MM-DD local

      const isPresent = record.Present_students?.some(
        (s) => (s._id || s.id || s) === selectedStudentId,
      );
      const isAbsent = record.Absent_students?.some(
        (s) => (s._id || s.id || s) === selectedStudentId,
      );

      if (isPresent) {
        attMap[dateStr] = "present";
        presentCount++;
      } else if (isAbsent) {
        attMap[dateStr] = "absent";
        absentCount++;
      } else {
        attMap[dateStr] = "none";
      }
    });

    return {
      year,
      month,
      daysInMonth,
      firstDayOffset,
      attMap,
      presentCount,
      absentCount,
      totalClassCount,
    };
  }, [selectedMonth, selectedStudentId, attendanceRecords]);

  const StatCard = ({ title, value, icon: Icon, colorClass }) => (
    <div
      className={`p-4 rounded-xl border flex items-center justify-between shadow-sm transition-transform hover:-translate-y-1 ${colorClass}`}
    >
      <div>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
      </div>
      <Icon size={32} className="opacity-80" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background p-6 md:p-8 transition-colors duration-300"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <BackButton details="Track individual student attendance by batch and month." />

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4`}>
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Batch
              </label>
              <select
                value={selectedBatchId}
                onChange={(event) => setSelectedBatchId(event.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                disabled={isBatchLoading}
              >
                <option value="" disabled>
                  Select a batch...
                </option>
                {displayedBatches.map((batch) => (
                  <option key={batch._id} value={batch._id}>
                    {batch.name} ({batch.startTime} - {batch.endTime})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Month
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>

            {userRole !== "Student" && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Select Student
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    disabled={!selectedBatchId || batchStudents.length === 0}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                  >
                    <option value="" disabled>
                      Select a student...
                    </option>
                    {batchStudents.map((student) => (
                      <option
                        key={student._id || student.id}
                        value={student._id || student.id}
                      >
                        {student.name || student.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-xl p-4">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mr-3" /> Loading
            calendar...
          </div>
        ) : selectedBatchId && selectedStudentId && calendarData ? (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <StatCard
                title="Total Classes"
                value={calendarData.totalClassCount}
                icon={BookOpen}
                colorClass="bg-primary/10 border-primary/20 text-primary"
              />
              <StatCard
                title="Present"
                value={calendarData.presentCount}
                icon={CheckCircle2}
                colorClass="bg-success/10 border-success/20 text-success"
              />
              <StatCard
                title="Absent"
                value={calendarData.absentCount}
                icon={XCircle}
                colorClass="bg-destructive/10 border-destructive/20 text-destructive"
              />
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 md:gap-4">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="text-center font-bold text-muted-foreground text-sm py-2 bg-muted/30 rounded-lg"
                >
                  {day}
                </div>
              ))}

              {/* Empty Offsets */}
              {Array.from({ length: calendarData.firstDayOffset }).map(
                (_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ),
              )}

              {/* Calendar Days */}
              {Array.from({ length: calendarData.daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${calendarData.year}-${String(calendarData.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const status = calendarData.attMap[dateStr];

                let bgClass =
                  "bg-muted/20 border-border/50 text-muted-foreground opacity-60"; // Grey (Class didn't happen)
                let icon = (
                  <MinusCircle size={16} className="mt-1 opacity-40" />
                );
                let statusText = "No Class";

                if (status === "present") {
                  bgClass =
                    "bg-success/20 border-success/30 text-success shadow-sm";
                  icon = <CheckCircle2 size={16} className="mt-1" />;
                  statusText = "Present";
                } else if (status === "absent") {
                  bgClass =
                    "bg-destructive/20 border-destructive/30 text-destructive shadow-sm";
                  icon = <XCircle size={16} className="mt-1" />;
                  statusText = "Absent";
                } else if (status === "none") {
                  bgClass = "bg-muted/40 border-border text-muted-foreground";
                  icon = <MinusCircle size={16} className="mt-1 opacity-50" />;
                  statusText = "Not Marked";
                }

                return (
                  <motion.div
                    key={day}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className={`flex flex-col items-center justify-center py-2 sm:py-4 px-0.5 sm:px-1 rounded-xl border transition-all ${bgClass}`}
                  >
                    <span className="text-sm sm:text-lg font-bold">{day}</span>
                    {icon}
                    <span className="text-[9px] sm:text-[10px] font-semibold mt-1 block text-center leading-tight">
                      {statusText}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-8 text-center text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-3 text-muted-foreground/60" />
            Select a batch, month, and student to view their attendance
            calendar.
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default AttendanceStatus;
