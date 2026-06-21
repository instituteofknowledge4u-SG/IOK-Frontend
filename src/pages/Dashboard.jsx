import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Users,
  GraduationCap,
  Layers,
  IndianRupee,
  UserPlus,
  BookOpen,
  Calendar,
  Clock,
  ClipboardCheck,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Bell,
  Download,
} from "lucide-react";
import useAuthStore from "../stores/useAuthStore";
import useUserStore from "../stores/useUserStore";
import useBatchStore from "../stores/useBatchStore";
import useClassStore from "../stores/useClassStore";
import { getStudentId } from "../util/getStudentId";
import { api } from "../api/api";

// ==========================================
// REUSABLE UI COMPONENTS (CARDS & SKELETONS)
// ==========================================

const KpiCard = ({
  title,
  value,
  icon: Icon,
  trend,
  colorType = "primary",
  isLoading,
}) => {
  const colorStyles = {
    primary: {
      bg: "bg-primary/10",
      text: "text-primary",
      border: "border-primary/20",
    },
    success: {
      bg: "bg-success/10",
      text: "text-success",
      border: "border-success/20",
    },
    warning: {
      bg: "bg-warning/10",
      text: "text-warning",
      border: "border-warning/20",
    },
    destructive: {
      bg: "bg-destructive/10",
      text: "text-destructive",
      border: "border-destructive/20",
    },
  };

  const style = colorStyles[colorType] || colorStyles.primary;

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col justify-between transition-all duration-300"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {title}
          </p>
          {isLoading ? (
            <div className="h-8 w-20 bg-muted animate-pulse rounded-md mt-1"></div>
          ) : (
            <h3 className="text-3xl font-bold text-foreground">{value}</h3>
          )}
        </div>
        <div
          className={`p-3 rounded-xl border ${style.bg} ${style.border} ${style.text}`}
        >
          <Icon size={24} />
        </div>
      </div>
      {trend && !isLoading && (
        <div className="flex items-center gap-2 text-sm">
          <TrendingUp size={16} className="text-success" />
          <span className="text-success font-medium">{trend.value}</span>
          <span className="text-muted-foreground">{trend.label}</span>
        </div>
      )}
    </motion.div>
  );
};

const SectionCard = ({ title, icon: Icon, children, action }) => (
  <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col h-full transition-colors duration-300">
    <div className="p-5 border-b border-border flex justify-between items-center bg-muted/30">
      <div className="flex items-center gap-2">
        {Icon && <Icon size={18} className="text-primary" />}
        <h2 className="text-lg font-bold text-foreground">{title}</h2>
      </div>
      {action && action}
    </div>
    <div className="p-5 flex-1 overflow-auto custom-scrollbar">{children}</div>
  </div>
);

// --- Skeleton Loaders ---

const TableSkeleton = () => (
  <div className="overflow-x-auto rounded-md border border-border/50">
    <table className="w-full text-sm text-left border-collapse">
      <thead className="text-muted-foreground bg-muted/30 border-b border-border/50">
        <tr>
          {[
            "#",
            "Student Name",
            "Student ID",
            "Address",
            "Course",
            "Admission Date",
          ].map((th) => (
            <th key={th} className="py-3 px-4 font-semibold whitespace-nowrap">
              {th}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border/50">
        {[1, 2, 3, 4, 5].map((i) => (
          <tr key={i} className="animate-pulse">
            <td className="py-3 px-4">
              <div className="h-4 w-4 bg-muted rounded"></div>
            </td>
            <td className="py-3 px-4">
              <div className="h-4 w-32 bg-muted rounded"></div>
            </td>
            <td className="py-3 px-4">
              <div className="h-4 w-20 bg-muted rounded"></div>
            </td>
            <td className="py-3 px-4">
              <div className="h-4 w-40 bg-muted rounded"></div>
            </td>
            <td className="py-3 px-4">
              <div className="h-4 w-24 bg-muted rounded"></div>
            </td>
            <td className="py-3 px-4">
              <div className="h-4 w-24 bg-muted rounded"></div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TeacherBatchSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="p-4 border border-border rounded-xl shadow-sm animate-pulse"
      >
        <div className="flex justify-between items-start mb-2">
          <div className="flex flex-col gap-2">
            <div className="h-5 w-32 bg-muted rounded"></div>
            <div className="h-3 w-40 bg-muted/70 rounded"></div>
          </div>
          <div className="h-6 w-20 bg-muted rounded-md shrink-0"></div>
        </div>
      </div>
    ))}
  </div>
);

const StudentScheduleSkeleton = () => (
  <div className="space-y-3">
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 border border-border rounded-xl shadow-sm animate-pulse"
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-lg bg-muted border border-border/50 shrink-0"></div>
          <div className="flex flex-col gap-2">
            <div className="h-5 w-40 bg-muted rounded"></div>
            <div className="h-3 w-32 bg-muted/70 rounded"></div>
          </div>
        </div>
        <div className="mt-3 sm:mt-0 h-6 w-32 bg-muted rounded-lg shrink-0"></div>
      </div>
    ))}
  </div>
);

// ==========================================
// ROLE-SPECIFIC DASHBOARDS
// ==========================================

const AdminDashboard = ({
  navigate,
  students,
  batches,
  isLoading,
  currentStudentsCount,
  feesDueCount,
  recentEnrollments,
  isMetricsLoading,
}) => {
  // Get recent students
  const recentStudents = recentEnrollments || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KpiCard
          isLoading={isLoading}
          title="Total Students"
          value={students?.length || 0}
          icon={GraduationCap}
          colorType="primary"
          trend={{ value: "Active", label: "currently enrolled" }}
        />
        <KpiCard
          isLoading={isMetricsLoading}
          title="Current Students"
          value={currentStudentsCount}
          icon={Users}
          colorType="success"
        />
        <KpiCard
          isLoading={isMetricsLoading}
          title="Fees Due Students"
          value={feesDueCount}
          icon={Layers}
          colorType="warning"
        />
        {/* <KpiCard
          isLoading={isLoading}
          title="Est. Revenue"
          value="₹ --"
          icon={IndianRupee}
          colorType="success"
        /> */}
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate("/registeruser")}
          className="flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-5 py-2.5 rounded-xl font-semibold shadow-sm shadow-primary/20 transition-all active:scale-95"
        >
          <UserPlus size={18} /> Register New User
        </button>
        <button
          onClick={() => navigate("/batches/create")}
          className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground border border-border px-5 py-2.5 rounded-xl font-semibold transition-all active:scale-95"
        >
          <Layers size={18} /> Create Batch
        </button>
        <button
          onClick={() => navigate("/fees")}
          className="flex items-center gap-2 bg-muted hover:bg-muted/80 text-foreground border border-border px-5 py-2.5 rounded-xl font-semibold transition-all active:scale-95"
        >
          <IndianRupee size={18} /> Process Fees
        </button>
      </div>

      {/* Data Widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard title="Recent Enrollments" icon={Users}>
            {isLoading || isMetricsLoading ? (
              <TableSkeleton />
            ) : recentStudents.length > 0 ? (
              <div className="overflow-x-auto rounded-md border border-border/50">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="text-muted-foreground bg-muted/30 border-b border-border/50">
                    <tr>
                      <th className="py-3 px-4 font-semibold whitespace-nowrap">
                        #
                      </th>
                      <th className="py-3 px-4 font-semibold whitespace-nowrap">
                        Student Name
                      </th>
                      <th className="py-3 px-4 font-semibold whitespace-nowrap">
                        Student ID
                      </th>
                      <th className="py-3 px-4 font-semibold whitespace-nowrap">
                        Address
                      </th>
                      <th className="py-3 px-4 font-semibold whitespace-nowrap">
                        Course
                      </th>
                      <th className="py-3 px-4 font-semibold whitespace-nowrap">
                        Admission Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {recentStudents.map((student, index) => (
                      <tr
                        key={student._id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {index + 1}
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium whitespace-nowrap">
                          {student.name}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground font-mono whitespace-nowrap">
                          {getStudentId(student) || "-"}
                        </td>
                        <td
                          className="py-3 px-4 text-muted-foreground max-w-[200px] truncate"
                          title={student.address}
                        >
                          {student.address || "-"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {student.courses || "-"}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                          {student.admissionDate || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mb-3 opacity-20" />
                <p>No recent enrollments found.</p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </motion.div>
  );
};

const TeacherDashboard = ({ navigate, user, batches, isLoading }) => {
  // Filter batches for this teacher
  const myBatches =
    batches?.filter((b) => b.teacherEmail === user?.email) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <KpiCard
          isLoading={isLoading}
          title="My Active Batches"
          value={myBatches.length}
          icon={Layers}
          colorType="primary"
        />
        <KpiCard
          isLoading={isLoading}
          title="Total Students"
          value={myBatches.reduce(
            (acc, curr) => acc + (curr.students?.length || 0),
            0,
          )}
          icon={Users}
          colorType="success"
        />
        {/* <KpiCard
          isLoading={isLoading}
          title="Pending Actions"
          value="0"
          icon={AlertCircle}
          colorType="warning"
        /> */}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => navigate("/attendance")}
          className="flex items-center gap-2 bg-primary hover:opacity-90 text-primary-foreground px-5 py-2.5 rounded-xl font-semibold shadow-sm transition-all active:scale-95"
        >
          <ClipboardCheck size={18} /> Mark Attendance
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Quick Batch Access" icon={BookOpen}>
          {isLoading ? (
            <TeacherBatchSkeleton />
          ) : myBatches.length > 0 ? (
            <div className="space-y-3">
              {myBatches.map((batch) => (
                <div
                  key={batch._id}
                  onClick={() =>
                    navigate(`/batches/${batch._id}`, {
                      state: { batchId: batch._id },
                    })
                  }
                  className="p-4 border border-border rounded-xl hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {batch.name}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Clock size={12} /> {batch.weekday} • {batch.startTime}{" "}
                        - {batch.endTime}
                      </p>
                    </div>
                    <span className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-md border border-primary/20 shrink-0">
                      {batch.students?.length || 0} Students
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No assigned batches found.
            </div>
          )}
        </SectionCard>
      </div>
    </motion.div>
  );
};

const StudentDashboard = ({ navigate, user, isLoading }) => {
  // Calculate active courses by checking if today's date falls between startDate and endDate
  const currentDate = new Date();
  const activeCoursesCount =
    user?.mainClasses?.filter((cls) => {
      if (!cls.startDate || !cls.endDate) return false;
      const start = new Date(cls.startDate);
      const end = new Date(cls.endDate);
      return currentDate >= start && currentDate <= end;
    }).length || 0;

  // Extract batches directly from the authenticated student payload
  const myBatches = user?.batches || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <KpiCard
          isLoading={isLoading}
          title="Active Courses"
          value={activeCoursesCount}
          icon={BookOpen}
          colorType="primary"
        />
        {/* <KpiCard
          isLoading={isLoading}
          title="Overall Attendance"
          value="--%"
          icon={CheckCircle2}
          colorType="success"
        />
        <KpiCard
          isLoading={isLoading}
          title="Fee Status"
          value="Active"
          icon={IndianRupee}
          colorType="success"
        /> */}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionCard title="My Class Schedule" icon={Calendar}>
            {isLoading ? (
              <StudentScheduleSkeleton />
            ) : myBatches.length > 0 ? (
              <div className="space-y-3">
                {myBatches.map((batch) => (
                  <div
                    key={batch._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-muted/30 border border-border rounded-xl shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-primary/10 text-primary flex flex-col items-center justify-center font-bold border border-primary/20 shrink-0">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-foreground">
                          {batch.name}
                        </h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock size={12} /> {batch.weekday} •{" "}
                          {batch.startTime} - {batch.endTime}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                You are not enrolled in any upcoming classes.
              </div>
            )}
          </SectionCard>
        </div>

        {/* <div className="lg:col-span-1">
          <SectionCard title="Notice Board" icon={Bell}>
            <div className="space-y-4">
              <div className="p-3 bg-muted/30 border border-border rounded-xl">
                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md mb-2 inline-block border border-primary/20">
                  WELCOME
                </span>
                <h4 className="text-sm font-bold text-foreground mb-1">
                  Welcome to the Portal
                </h4>
                <p className="text-xs text-muted-foreground">
                  Keep an eye on this board for official announcements and
                  updates.
                </p>
              </div>
            </div>
          </SectionCard>
        </div> */}
      </div>
    </motion.div>
  );
};

// ==========================================
// MAIN DASHBOARD WRAPPER
// ==========================================

export default function Dashboard() {
  const navigate = useNavigate();

  // Stores
  const user = useAuthStore((state) => state.user);
  const role = user?.role || "Student";

  const { students, getStudents, isLoading: userLoading } = useUserStore();
  const { batches, fetchBatches, isLoading: batchLoading } = useBatchStore();
  const { allClass, getClasses, isLoading: classLoading } = useClassStore();

  const studentProgress = useUserStore((state) => state.studentProgress);
  const getStudentProgress = useUserStore((state) => state.getStudentProgress);

  const [currentStudentsCount, setCurrentStudentsCount] = useState(0);
  const [feesDueCount, setFeesDueCount] = useState(0);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(false);

  const isLoading = userLoading || batchLoading;

  // Fetch critical dashboard data on mount
  useEffect(() => {
    if (role === "Admin") {
      getStudents();
      getClasses();
    }
    fetchBatches();
  }, [role, getStudents, getClasses, fetchBatches]);

  useEffect(() => {
    if (role !== "Admin" || !students?.length) return;

    let isMounted = true;
    const fetchMetrics = async () => {
      setMetricsLoading(true);
      try {
        const allMainClasses = allClass || [];
        const mainClassMap = new Map(
          allMainClasses.map((cls) => [cls._id, cls.name]),
        );

        const progressFetches = [];
        students.forEach((student) => {
          const studentId = student._id;
          const classIds = (student.mainClasses || []).map(
            (cls) => cls._id || cls,
          );

          classIds.forEach((classId) => {
            const key = `${studentId}_${classId}`;
            if (!studentProgress[key]) {
              progressFetches.push(getStudentProgress(studentId, classId));
            }
          });
        });

        await Promise.all(progressFetches);

        const updatedProgress = useUserStore.getState().studentProgress;

        const activeStudents = students.filter((student) => {
          const classIds = (student.mainClasses || []).map(
            (cls) => cls._id || cls,
          );

          return !classIds.some((classId) => {
            const key = `${student._id}_${classId}`;
            return updatedProgress[key]?.certificateIssued;
          });
        });

        const recent = [...students]
          .sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() -
              new Date(a.createdAt || 0).getTime(),
          )
          .slice(0, 6)
          .map((student) => {
            const classLabels = (student.mainClasses || [])
              .map((cls) => mainClassMap.get(cls._id || cls))
              .filter(Boolean)
              .join(", ");

            return {
              ...student,
              courses: classLabels,
              admissionDate: student.createdAt
                ? new Date(student.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "-",
            };
          });

        const currentMonthLabel = new Date().toLocaleString("default", {
          month: "long",
          year: "numeric",
        });

        const feesDueStudents = new Set();

        // for (const student of students) {
        //   const studentId = student._id;
        //   const classIds = (student.mainClasses || []).map(
        //     (cls) => cls._id || cls,
        //   );

        //   for (const classId of classIds) {
        //     try {
        //       const response = await api.get(
        //         `/fees/history/${classId}/${studentId}`,
        //       );
        //       const history = response.data?.history || [];
        //       const paid = history.some((record) => {
        //         const label = String(record.month || "")
        //           .trim()
        //           .toLowerCase();
        //         return label === currentMonthLabel.toLowerCase();
        //       });
        //       if (!paid) {
        //         feesDueStudents.add(studentId);
        //       }
        //     } catch (err) {
        //       // Silently skip 404s (endpoint not ready yet)
        //       if (err.response?.status !== 404) {
        //         feesDueStudents.add(studentId);
        //       }
        //     }
        //   }
        // }

        if (isMounted) {
          setCurrentStudentsCount(activeStudents.length);
          setRecentEnrollments(recent);
          setFeesDueCount(feesDueStudents.size);
        }
      } finally {
        if (isMounted) {
          setMetricsLoading(false);
        }
      }
    };

    fetchMetrics();

    return () => {
      isMounted = false;
    };
  }, [role, students, allClass, getStudentProgress, studentProgress]);

  // Page entry animations
  const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
      className="min-h-screen bg-background text-foreground p-4 md:p-8 transition-colors duration-300"
    >
      {/* Dynamic Header based on Role */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground mb-2 capitalize">
          Welcome back, {user?.name || "User"} 👋
        </h1>
        <p className="text-muted-foreground font-medium">
          Here is what's happening in your {role.toLowerCase()} portal today.
        </p>
      </div>

      {/* Conditional Rendering based on Role */}
      {role === "Admin" && (
        <AdminDashboard
          navigate={navigate}
          students={students}
          batches={batches}
          isLoading={isLoading}
          currentStudentsCount={currentStudentsCount}
          feesDueCount={feesDueCount}
          recentEnrollments={recentEnrollments}
          isMetricsLoading={metricsLoading || classLoading}
        />
      )}
      {role === "Teacher" && (
        <TeacherDashboard
          navigate={navigate}
          user={user}
          batches={batches}
          isLoading={isLoading}
        />
      )}
      {role === "Student" && (
        <StudentDashboard
          navigate={navigate}
          user={user}
          isLoading={isLoading}
        />
      )}
    </motion.div>
  );
}