import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Trash2,
  AlertTriangle,
  BookOpen,
  Clock,
  User,
} from "lucide-react";
import useBatchStore from "../../stores/useBatchStore";
import useAuthStore from "../../stores/useAuthStore";
import useTradeStore from "../../stores/useTradeStore";
import { generateSlug } from "../../util/generateSlug";
import { TRADES, getTradeLabel } from "../../constants/trades";
import { filterBatchesForTeacher } from "../../util/teacherAccessControl";

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
                className="px-4 py-2 rounded-xl bg-destructive hover:opacity-90 text-destructive-foreground transition-all font-medium flex items-center gap-2 shadow-sm shadow-destructive/20 hover:-translate-y-0.5"
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

const BatchList = () => {
  const { batches, fetchBatches, isLoading } = useBatchStore();
  const { user } = useAuthStore();
  const userRole = useAuthStore((state) => state.userRole);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTradeId, setSelectedTradeId] = useState("");
  const batchTradeMap = useTradeStore((state) => state.batchTradeMap);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  // Filter batches for teachers/students
  const batchesForUser = useMemo(() => {
    if (userRole === "Admin") return batches;
    if (userRole === "Teacher") {
      return filterBatchesForTeacher(
        batches,
        user?.batches || [],
        userRole,
        user?.email,
        user?._id,
      );
    }
    if (userRole === "Student") {
      return batches.filter((batch) => {
        const inStudents = batch.students?.some(
          (s) => (s._id || s) === user?._id,
        );
        const inPairs = batch.mainClassStudentPairs?.some(
          (p) => (p.student?._id || p.student) === user?._id,
        );
        return inStudents || inPairs;
      });
    }
    return batches;
  }, [batches, userRole, user]);

  const filteredBatches = batchesForUser.filter((batch) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      batch.name?.toLowerCase().includes(query) ||
      batch.weekday?.toLowerCase().includes(query) ||
      batch.teacherEmail?.toLowerCase().includes(query) ||
      (Array.isArray(batch.teachers) &&
        batch.teachers.some(
          (t) =>
            t.name?.toLowerCase().includes(query) ||
            t.email?.toLowerCase().includes(query),
        ));

    const tradeId = batchTradeMap[batch._id] || "";
    const matchesTrade =
      selectedTradeId === ""
        ? true
        : selectedTradeId === "unassigned"
          ? !tradeId
          : tradeId === selectedTradeId;

    return matchesSearch && matchesTrade;
  });

  const getHeaderContent = (role) => {
    switch (role) {
      case "Teacher":
        return {
          title: "Assigned Batches",
          description:
            "Overview of your assigned classes, course details, and enrolled students. Track your daily schedules and manage your teaching itinerary effectively.",
        };
      case "Student":
        return {
          title: "My Batches",
          description:
            "Access your enrolled batches, course details, and upcoming class schedules. Stay updated on your learning journey and upcoming sessions.",
        };
      case "Admin":
      default:
        return {
          title: "Batch Management",
          description:
            "Overview of all active batches, assigned courses, fees, and student allocations. Manage, create, and organize your institution's educational schedules effectively.",
        };
    }
  };

  const { title, description } = getHeaderContent(userRole);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="container mx-auto px-4 py-8 max-w-7xl transition-colors duration-300"
    >
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          <p className="text-muted-foreground mt-1">{description}</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto shrink-0">
          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <input
              type="text"
              placeholder="Search batches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background/60 backdrop-blur-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all shadow-sm"
            />
          </div>

          <div className="w-full sm:w-56">
            <select
              value={selectedTradeId}
              onChange={(e) => setSelectedTradeId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background/60 backdrop-blur-xl text-foreground focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all shadow-sm appearance-none cursor-pointer"
            >
              <option value="">All Trades</option>
              <option value="unassigned">Unassigned</option>
              {TRADES.map((trade) => (
                <option key={trade.id} value={trade.id}>
                  {trade.name}
                </option>
              ))}
            </select>
          </div>

          {/* Create Batch Button (Admin Only) */}
          {user?.role === "Admin" && (
            <Link
              to="/batches/create"
              className="whitespace-nowrap px-6 py-2.5 bg-primary hover:opacity-90 text-primary-foreground font-medium rounded-xl transition-all shadow-lg shadow-primary/30 active:scale-95 flex items-center justify-center"
            >
              + Create Batch
            </Link>
          )}
        </div>
      </div>

      {/* Content Section (Localized Loading) */}
      {isLoading ? (
        // Skeleton Loader grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((skeleton) => (
            <div
              key={skeleton}
              className="h-32 p-6 rounded-2xl bg-card/40 backdrop-blur-xl border border-border shadow-sm animate-pulse"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="h-6 bg-muted rounded w-1/2"></div>
                <div className="h-6 bg-muted rounded-full w-20"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredBatches.length === 0 ? (
        // Empty State
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-card/40 backdrop-blur-sm rounded-2xl border border-dashed border-border"
        >
          <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-muted flex items-center justify-center">
            <Search className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">
            No batches found
          </h3>
          <p className="text-muted-foreground">
            {searchQuery
              ? "Try adjusting your search terms."
              : "There are currently no batches available."}
          </p>
        </motion.div>
      ) : (
        // Data Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBatches.map((batch, index) => (
            <motion.div
              key={batch._id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/batches/${generateSlug(batch.name)}`}
                state={{
                  batchId: batch._id,
                  batchName: batch.name?.trim(),
                }}
                className="block h-full"
              >
                <div className="h-full p-6 rounded-2xl bg-card/60 backdrop-blur-xl border border-border shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 group">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate pr-2">
                      {batch.name?.trim()}
                    </h2>
                    <span className="px-3 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary shrink-0">
                      {batch.weekday}
                    </span>
                  </div>

                  <div className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-primary/10 text-primary border border-primary/20 mb-3">
                    {getTradeLabel(batchTradeMap[batch._id])}
                  </div>

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p className="flex items-center gap-2">
                      <Clock className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                      {batch.startTime} - {batch.endTime}
                    </p>
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4 shrink-0 text-muted-foreground/70" />
                      <span className="truncate">
                        {Array.isArray(batch.teachers) &&
                        batch.teachers.length > 0
                          ? batch.teachers
                              .map((t) => t.name || t.email || "Unknown")
                              .join(", ")
                          : batch.teacherEmail || "TBA"}
                      </span>
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default BatchList;
