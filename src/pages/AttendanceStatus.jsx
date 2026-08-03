import React, { useEffect, useMemo, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MinusCircle,
  Users,
  XCircle,
} from "lucide-react";
import { motion as Motion } from "framer-motion";
import useAttendanceStore from "../stores/useAttendanceStore";
import useAuthStore from "../stores/useAuthStore";
import useUserStore from "../stores/useUserStore";
import { api } from "../api/api";
import BackButton from "../components/UI/Button";
import { filterBatchesForTeacher } from "../util/teacherAccessControl";
import { Helmet } from "react-helmet-async";

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

const getEntityId = (entity) => {
  if (!entity) return "";
  if (typeof entity === "string") return entity;
  return entity._id || entity.id || entity.studentId || "";
};

const idsMatch = (left, right) =>
  Boolean(getEntityId(left) && getEntityId(right)) &&
  String(getEntityId(left)) === String(getEntityId(right));

const getCourseLabel = (course) => course?.name || course?.title || "Course";

const getBatchCourseIds = (batch) => {
  const courseIds = new Set();

  batch?.mainClasses?.forEach((course) => {
    const courseId = getEntityId(course);
    if (courseId) courseIds.add(String(courseId));
  });

  batch?.mainClassStudentPairs?.forEach((pair) => {
    const courseId = getEntityId(pair?.mainClass);
    if (courseId) courseIds.add(String(courseId));
  });

  return courseIds;
};

const batchHasStudent = (batch, studentId) => {
  const inStudents = batch?.students?.some((student) =>
    idsMatch(student, studentId),
  );
  const inPairs = batch?.mainClassStudentPairs?.some((pair) =>
    idsMatch(pair?.student, studentId),
  );
  return inStudents || inPairs;
};

const getRecordStudents = (record, keys) => {
  for (const key of keys) {
    if (Array.isArray(record?.[key])) return record[key];
  }
  return [];
};

const getRecordDate = (record) => {
  if (!record?.date) return "";
  return String(record.date).split("T")[0];
};

const getStudentPhoto = (student) => {
  const photo =
    student?.profilePic ||
    student?.profilePicture ||
    student?.profile_picture ||
    student?.photo ||
    student?.image;

  if (photo) return photo;

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    student?.name || student?.email || "Student",
  )}&background=e0e7ff&color=4f46e5`;
};

const AttendanceStatus = () => {
  const userId = useAuthStore((state) => state.id);
  const userRole = useAuthStore((state) => state.userRole);
  const userData = useAuthStore((state) => state.user);
  const loadUser = useAuthStore((state) => state.loadUser);

  const {
    batches,
    getAllBatches,
    isLoading: isBatchLoading,
  } = useAttendanceStore();

  const { students: allStudents, getStudents: getAllStudents } = useUserStore();

  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedMainClassId, setSelectedMainClassId] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [batchStudents, setBatchStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [mainClasses, setMainClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (getAllStudents && (!allStudents || allStudents.length === 0)) {
      getAllStudents();
    }
  }, [getAllStudents, allStudents]);

  useEffect(() => {
    if (!userRole || !userId) return;
    getAllBatches();
  }, [userRole, userId, getAllBatches]);

  useEffect(() => {
    const fetchMainClasses = async () => {
      try {
        const response = await api.get("/mainclass");
        const data = response.data?.data || response.data || [];
        setMainClasses(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Failed to load course names for attendance status.", err);
      }
    };

    fetchMainClasses();
  }, []);

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
      return batches.filter((batch) => batchHasStudent(batch, userId));
    }
    return [];
  }, [batches, userRole, userData, userId]);

  const courseLookup = useMemo(() => {
    const lookup = new Map();
    mainClasses.forEach((course) => {
      const courseId = getEntityId(course);
      if (courseId) lookup.set(String(courseId), course);
    });
    return lookup;
  }, [mainClasses]);

  const studentLookup = useMemo(() => {
    const lookup = new Map();
    (allStudents || []).forEach((student) => {
      [student?._id, student?.id, student?.studentId]
        .filter(Boolean)
        .forEach((id) => lookup.set(String(id), student));
    });
    return lookup;
  }, [allStudents]);

  const hydratedStudents = useMemo(() => {
    return (batchStudents || []).map((student) => {
      const studentId = getEntityId(student);
      const fullStudent = studentLookup.get(String(studentId));
      // Ensure the original student ID from the batch context is preserved
      return fullStudent
        ? { ...fullStudent, ...student, _id: studentId }
        : student;
    });
  }, [batchStudents, studentLookup]);

  const displayedMainClasses = useMemo(() => {
    const classMap = new Map();

    userData?.mainClasses?.forEach((course) => {
      const courseId = getEntityId(course);
      if (courseId) {
        const fullCourse = courseLookup.get(String(courseId)) || course;
        classMap.set(String(courseId), {
          _id: courseId,
          name: getCourseLabel(fullCourse),
        });
      }
    });

    displayedBatches.forEach((batch) => {
      batch?.mainClasses?.forEach((course) => {
        const courseId = getEntityId(course);
        if (courseId && !classMap.has(String(courseId))) {
          const fullCourse = courseLookup.get(String(courseId)) || course;
          classMap.set(String(courseId), {
            _id: courseId,
            name: getCourseLabel(fullCourse),
          });
        }
      });

      batch?.mainClassStudentPairs?.forEach((pair) => {
        if (userRole === "Student" && !idsMatch(pair?.student, userId)) return;
        const courseId = getEntityId(pair?.mainClass);
        if (courseId && !classMap.has(String(courseId))) {
          const fullCourse =
            courseLookup.get(String(courseId)) || pair?.mainClass;
          classMap.set(String(courseId), {
            _id: courseId,
            name: getCourseLabel(fullCourse),
          });
        }
      });
    });

    return Array.from(classMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [displayedBatches, userRole, userData, userId, courseLookup]);

  const selectableBatches = useMemo(() => {
    if (!selectedMainClassId) return [];
    return displayedBatches.filter((batch) =>
      getBatchCourseIds(batch).has(String(selectedMainClassId)),
    );
  }, [displayedBatches, selectedMainClassId]);

  const selectedBatch = useMemo(
    () =>
      selectableBatches.find((batch) => idsMatch(batch, selectedBatchId)) ||
      null,
    [selectableBatches, selectedBatchId],
  );

  const selectedBatchWeekday = selectedBatch?.weekday
    ? selectedBatch.weekday.slice(0, 3).toLowerCase()
    : "";

  useEffect(() => {
    if (selectedMainClassId || displayedMainClasses.length === 0) return;
    setSelectedMainClassId(String(displayedMainClasses[0]._id));
  }, [displayedMainClasses, selectedMainClassId]);

  useEffect(() => {
    if (!selectedBatchId) return;
    if (!selectableBatches.some((batch) => idsMatch(batch, selectedBatchId))) {
      setSelectedBatchId("");
    }
  }, [selectableBatches, selectedBatchId]);

  useEffect(() => {
    if (selectedBatchId || selectableBatches.length === 0) return;
    setSelectedBatchId(getEntityId(selectableBatches[0]));
  }, [selectableBatches, selectedBatchId]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedBatchId || !selectedMainClassId || !selectedMonth) return;
      setIsLoading(true);
      setError("");

      try {
        const batchResponse = await api.get(`/batch/show/${selectedBatchId}`);
        const batchData = batchResponse.data?.data || batchResponse.data;
        const pairs = batchData?.mainClassStudentPairs || [];
        const studentMap = new Map();

        pairs.forEach((pair) => {
          const pairCourseId = getEntityId(pair?.mainClass);
          const studentId = getEntityId(pair?.student);
          if (String(pairCourseId) !== String(selectedMainClassId)) return;
          if (userRole === "Student" && !idsMatch(pair?.student, userId))
            return;
          if (studentId && typeof pair?.student === "object") {
            studentMap.set(String(studentId), pair.student);
          }
        });

        if (studentMap.size === 0) {
          (batchData?.students || []).forEach((student) => {
            const studentId = getEntityId(student);
            if (!studentId || typeof student !== "object") return;
            if (userRole === "Student" && !idsMatch(student, userId)) return;
            studentMap.set(String(studentId), student);
          });
        }

        if (studentMap.size === 0) {
          const studentsResponse = await api.get(
            `/batch/students/${selectedBatchId}`,
          );
          const studentsList =
            studentsResponse.data?.data || studentsResponse.data || [];
          if (Array.isArray(studentsList)) {
            studentsList.forEach((student) => {
              const studentId = getEntityId(student);
              if (!studentId || typeof student !== "object") return;
              if (userRole === "Student" && !idsMatch(student, userId)) return;
              studentMap.set(String(studentId), student);
            });
          }
        }

        setBatchStudents(Array.from(studentMap.values()));

        const { startDate, endDate } = getMonthRange(selectedMonth);
        const attendanceResponse = await api.get(
          `/attendence/by-date-range/${selectedBatchId}`,
          {
            params: { startDate, endDate },
          },
        );

        const records =
          attendanceResponse.data?.data || attendanceResponse.data || [];

        setAttendanceRecords(Array.isArray(records) ? records : []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load attendance");
        setBatchStudents([]);
        setAttendanceRecords([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedBatchId, selectedMainClassId, selectedMonth, userRole, userId]);

  const monthData = useMemo(() => {
    if (!selectedMonth) return null;

    const [yearStr, monthStr] = selectedMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();
    const attendanceByStudent = {};

    hydratedStudents.forEach((student) => {
      const studentId = getEntityId(student);
      if (studentId) attendanceByStudent[String(studentId)] = {};
    });

    attendanceRecords.forEach((record) => {
      const dateStr = getRecordDate(record);
      if (!dateStr) return;

      const presentStudents = getRecordStudents(record, [
        "Present_students",
        "presentStudents",
        "presentStudentIds",
        "present",
      ]);
      const absentStudents = getRecordStudents(record, [
        "Absent_students",
        "absentStudents",
        "absentStudentIds",
        "absent",
      ]);

      hydratedStudents.forEach((student) => {
        const studentId = getEntityId(student);
        if (!studentId) return;

        if (presentStudents.some((item) => idsMatch(item, studentId))) {
          attendanceByStudent[String(studentId)][dateStr] = "present";
        } else if (absentStudents.some((item) => idsMatch(item, studentId))) {
          attendanceByStudent[String(studentId)][dateStr] = "absent";
        } else if (presentStudents.length || absentStudents.length) {
          attendanceByStudent[String(studentId)][dateStr] = "none";
        }
      });
    });

    const days = Array.from({ length: 31 }, (_, index) => {
      const day = index + 1;
      const isInMonth = day <= daysInMonth;
      const date = isInMonth ? new Date(year, month - 1, day) : null;
      return {
        day,
        isInMonth,
        dateStr: isInMonth
          ? `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`
          : "",
        weekday: isInMonth
          ? date.toLocaleDateString("en-US", { weekday: "short" })
          : "",
      };
    });

    let presentCount = 0;
    let absentCount = 0;
    Object.values(attendanceByStudent).forEach((studentDays) => {
      Object.values(studentDays).forEach((status) => {
        if (status === "present") presentCount++;
        if (status === "absent") absentCount++;
      });
    });

    return {
      days,
      attendanceByStudent,
      presentCount,
      absentCount,
      totalClasses: attendanceRecords.length,
    };
  }, [selectedMonth, hydratedStudents, attendanceRecords]);

  const StatCard = ({ title, value, icon, colorClass }) => (
    <div
      className={`rounded-xl border p-4 shadow-sm flex items-center justify-between ${colorClass}`}
    >
      <div>
        <p className="text-sm font-medium opacity-80">{title}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </div>
      {icon}
    </div>
  );

  const getStatusCell = (status) => {
    if (status === "present") {
      return {
        label: "P",
        title: "Present",
        className: "bg-success/10 text-success border-success/30",
      };
    }
    if (status === "absent") {
      return {
        label: "A",
        title: "Absent",
        className: "bg-destructive/10 text-destructive border-destructive/30",
      };
    }
    if (status === "none") {
      return {
        label: "-",
        title: "Not marked",
        className: "bg-muted/40 text-muted-foreground border-border",
      };
    }
    return {
      label: "",
      title: "No class",
      className: "bg-background text-muted-foreground border-border/60",
    };
  };

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-background p-6 md:p-8 transition-colors duration-300"
    >
      <Helmet>
        <title>IOK - Attendance status</title>
      </Helmet>
      <div className="max-w-7xl mx-auto space-y-6">
        <BackButton details="Track batch attendance by course, batch, month, and year." />

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Course
              </label>
              <div className="relative">
                <select
                  value={selectedMainClassId}
                  onChange={(event) => {
                    setSelectedMainClassId(event.target.value);
                    setSelectedBatchId("");
                  }}
                  disabled={isBatchLoading || displayedMainClasses.length === 0}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                >
                  <option value="" disabled>
                    Select a course...
                  </option>
                  {displayedMainClasses.map((course) => (
                    <option key={course._id} value={course._id}>
                      {course.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Batch
              </label>
              <div className="relative">
                <select
                  value={selectedBatchId}
                  onChange={(event) => setSelectedBatchId(event.target.value)}
                  disabled={
                    isBatchLoading ||
                    !selectedMainClassId ||
                    selectableBatches.length === 0
                  }
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50"
                >
                  <option value="" disabled>
                    Select a batch...
                  </option>
                  {selectableBatches.map((batch) => (
                    <option key={batch._id} value={batch._id}>
                      {batch.name} ({batch.startTime} - {batch.endTime})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Month & Year
              </label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
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
            attendance...
          </div>
        ) : selectedBatchId && monthData ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                title="Students"
                value={hydratedStudents.length}
                icon={<Users size={28} className="opacity-80" />}
                colorClass="bg-primary/10 border-primary/20 text-primary"
              />
              <StatCard
                title="Class Days"
                value={monthData.totalClasses}
                icon={<Calendar size={28} className="opacity-80" />}
                colorClass="bg-muted/40 border-border text-foreground"
              />
              <StatCard
                title="Present Marks"
                value={monthData.presentCount}
                icon={<CheckCircle2 size={28} className="opacity-80" />}
                colorClass="bg-success/10 border-success/20 text-success"
              />
              <StatCard
                title="Absent Marks"
                value={monthData.absentCount}
                icon={<XCircle size={28} className="opacity-80" />}
                colorClass="bg-destructive/10 border-destructive/20 text-destructive"
              />
            </div>

            <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
              <div className="max-h-[72vh] overflow-auto custom-scrollbar">
                <table className="w-full min-w-[1480px] border-collapse text-sm">
                  <thead>
                    <tr>
                      <th className="sticky left-0 top-0 z-40 w-64 bg-card border-b border-r border-border px-4 py-3 text-left font-semibold text-foreground">
                        Student
                      </th>
                      {monthData.days.map((day) => {
                        const isBatchDay =
                          day.weekday.toLowerCase() === selectedBatchWeekday;
                        return (
                          <th
                            key={`day-${day.day}`}
                            className={`sticky top-0 z-30 w-10 border-b border-border px-1 py-2 text-center font-bold ${
                              !day.isInMonth
                                ? "bg-muted/20 text-muted-foreground/40"
                                : isBatchDay
                                  ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/25"
                                  : "bg-card text-foreground"
                            }`}
                          >
                            {day.day}
                          </th>
                        );
                      })}
                    </tr>
                    <tr>
                      <th className="sticky left-0 top-[45px] z-40 w-64 bg-card border-b border-r border-border px-4 py-2 text-left text-xs font-semibold text-muted-foreground">
                        Name / ID
                      </th>
                      {monthData.days.map((day) => (
                        <th
                          key={`weekday-${day.day}`}
                          className={`sticky top-[45px] z-30 w-10 border-b border-border px-1 py-2 text-center text-[10px] font-bold ${
                            !day.isInMonth
                              ? "bg-muted/20 text-muted-foreground/30"
                              : day.weekday.toLowerCase() ===
                                  selectedBatchWeekday
                                ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/25"
                                : "bg-muted/30 text-muted-foreground"
                          }`}
                        >
                          {day.weekday}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {hydratedStudents.length === 0 ? (
                      <tr>
                        <td
                          colSpan={32}
                          className="px-4 py-10 text-center text-muted-foreground"
                        >
                          No students found for this course and batch.
                        </td>
                      </tr>
                    ) : (
                      hydratedStudents.map((student) => {
                        const studentId = getEntityId(student);
                        const studentDays =
                          monthData.attendanceByStudent[String(studentId)] ||
                          {};

                        return (
                          <tr
                            key={studentId}
                            className="border-b border-border/70 hover:bg-muted/20"
                          >
                            <td className="sticky left-0 z-20 bg-card border-r border-border px-4 py-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <img
                                  src={getStudentPhoto(student)}
                                  alt={student.name || "Student"}
                                  className="h-10 w-10 shrink-0 rounded-full border border-border bg-muted object-cover"
                                  onError={(event) => {
                                    event.currentTarget.onerror = null;
                                    event.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                      student?.name ||
                                        student?.email ||
                                        "Student",
                                    )}&background=e0e7ff&color=4f46e5`;
                                  }}
                                />
                                <div className="min-w-0">
                                  <div className="font-semibold text-foreground truncate">
                                    {student.name || "Unknown Student"}
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {student.studentId ||
                                      student.email ||
                                      studentId}
                                  </div>
                                </div>
                              </div>
                            </td>
                            {monthData.days.map((day) => {
                              const cell = getStatusCell(
                                day.isInMonth ? studentDays[day.dateStr] : "",
                              );
                              const isBatchDay =
                                day.weekday.toLowerCase() ===
                                selectedBatchWeekday;

                              return (
                                <td
                                  key={`${studentId}-${day.day}`}
                                  title={`${student.name || "Student"} - ${day.isInMonth ? `${day.weekday} ${day.day}: ${cell.title}` : "Outside selected month"}`}
                                  className={`h-10 w-10 border border-border/60 text-center align-middle text-xs font-bold ${
                                    day.isInMonth && isBatchDay
                                      ? `${cell.className} ring-1 ring-inset ring-primary/20`
                                      : day.isInMonth
                                        ? cell.className
                                        : "bg-muted/10 text-muted-foreground/30"
                                  }`}
                                >
                                  {day.isInMonth && cell.label ? (
                                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-md">
                                      {cell.label}
                                    </span>
                                  ) : null}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" /> P = Present
              </span>
              <span className="inline-flex items-center gap-2">
                <XCircle className="h-4 w-4 text-destructive" /> A = Absent
              </span>
              <span className="inline-flex items-center gap-2">
                <MinusCircle className="h-4 w-4" /> - = Not marked
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl shadow-sm p-8 text-center text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-3 text-muted-foreground/60" />
            Select a course, batch, and month to view attendance.
          </div>
        )}
      </div>
    </Motion.div>
  );
};

export default AttendanceStatus;
