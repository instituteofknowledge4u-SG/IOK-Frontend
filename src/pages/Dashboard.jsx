import React, { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
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
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import useAuthStore from "../stores/useAuthStore";
import useUserStore from "../stores/useUserStore";
import useBatchStore from "../stores/useBatchStore";
import useClassStore from "../stores/useClassStore";
import { getStudentId } from "../util/getStudentId";
import { Helmet } from "react-helmet-async";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// A vibrant, mode-agnostic color palette (Tailwind 500 series)
// These look excellent on both Light (white) and Dark (dark gray/black) backgrounds
const CHART_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
];

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
            "Student ID",
            "Student Name",
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

const ChartSkeleton = () => (
  <div className="w-full h-[300px] flex items-center justify-center animate-pulse px-4 pb-4">
    <div className="h-40 w-40 rounded-full border-8 border-muted/50"></div>
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
  const recentStudents = recentEnrollments || [];

  // Generate Monthly Enrollment Data for the last 6 months
  const monthlyChartData = useMemo(() => {
    if (!students || students.length === 0) return { data: [], total: 0 };

    const monthsData = [];
    const today = new Date();
    let totalRecentEnrollments = 0; // BUG FIX: Track if we have > 0 total data to prevent Recharts crash

    // Initialize the last 6 months (including current)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthsData.push({
        name: d.toLocaleString("default", { month: "short" }),
        month: d.getMonth(),
        year: d.getFullYear(),
        Enrollments: 0,
      });
    }

    // Populate data
    students.forEach((student) => {
      if (!student.createdAt) return;
      const studentDate = new Date(student.createdAt);

      const mIndex = monthsData.findIndex(
        (m) =>
          m.month === studentDate.getMonth() &&
          m.year === studentDate.getFullYear(),
      );
      if (mIndex !== -1) {
        monthsData[mIndex].Enrollments += 1;
        totalRecentEnrollments += 1;
      }
    });

    return { data: monthsData, total: totalRecentEnrollments };
  }, [students]);

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
          trend={{ value: "All-time", label: "registered" }}
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
        {/* Table Widget - Takes up 2 columns out of 3 */}
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
                        Student ID
                      </th>
                      <th className="py-3 px-4 font-semibold whitespace-nowrap">
                        Student Name
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
                    {recentStudents.map((student) => (
                      <tr
                        key={student._id}
                        className="hover:bg-muted/30 transition-colors group"
                      >
                        <td className="py-3 px-4 text-muted-foreground font-mono whitespace-nowrap">
                          {getStudentId(student) || "-"}
                        </td>
                        <td className="py-3 px-4 text-foreground font-medium whitespace-nowrap">
                          {student.name}
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
                <div className="flex items-center justify-end border-t border-border/50 bg-muted/20 px-4 py-3">
                  <Link
                    to="/students"
                    className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-primary transition-all duration-200 hover:bg-primary/10 hover:text-primary"
                  >
                    See More
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="w-10 h-10 mb-3 opacity-20" />
                <p>No recent enrollments found.</p>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Chart Widget - Takes up remaining 1 column */}
        <div className="lg:col-span-1">
          <SectionCard title="Enrollment Trends Monthly" icon={TrendingUp}>
            {isLoading || isMetricsLoading ? (
              <ChartSkeleton />
            ) : monthlyChartData.total > 0 ? (
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthlyChartData.data}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="Enrollments"
                      nameKey="name"
                      stroke="hsl(var(--card))" // Seamlessly blends lines with the card background
                      strokeWidth={2}
                      animationDuration={1500}
                    >
                      {monthlyChartData.data.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--foreground))",
                        boxShadow:
                          "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
                      }}
                      itemStyle={{ fontWeight: 600 }} // Color naturally maps to the slice color
                    />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      formatter={(value) => (
                        <span className="text-muted-foreground text-sm font-medium ml-1">
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <TrendingUp className="w-10 h-10 mb-3 opacity-20" />
                <p>No data available yet.</p>
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </motion.div>
  );
};

const TeacherDashboard = ({ navigate, user, batches, isLoading }) => {
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
  const currentDate = new Date();
  const activeCoursesCount =
    user?.mainClasses?.filter((cls) => {
      if (!cls.startDate || !cls.endDate) return false;
      const start = new Date(cls.startDate);
      const end = new Date(cls.endDate);
      return currentDate >= start && currentDate <= end;
    }).length || 0;

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

          if (classIds.length === 0) return true;

          return classIds.some((classId) => {
            const key = `${student._id}_${classId}`;
            const progress = updatedProgress[key];

            const isCompleted =
              progress?.certificateIssued === true ||
              progress?.completed === true ||
              progress?.status?.toLowerCase() === "completed";

            return !isCompleted;
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

        const feesDueStudents = new Set();
        // Fees due block (currently commented out intentionally by user)
        // ...

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
      <Helmet>
        <title>IOK - Dashboard</title>
      </Helmet>
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
