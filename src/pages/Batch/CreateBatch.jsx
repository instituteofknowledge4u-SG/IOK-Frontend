import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ChevronDown,
  Check,
  X,
  BookOpen,
  User,
  Calendar,
  Clock,
  Users,
  Briefcase,
  Plus,
  Trash2,
} from "lucide-react";
import useBatchStore from "../../stores/useBatchStore";
import useUserStore from "../../stores/useUserStore";
import useClassStore from "../../stores/useClassStore";
import toast from "react-hot-toast";
import BackButton from "../../components/UI/Button";
import { TRADES } from "../../constants/trades";
import useTradeStore from "../../stores/useTradeStore";

const CreateBatch = () => {
  const navigate = useNavigate();
  const { createBatch, isLoading } = useBatchStore();

  // Store connections
  const { teachers, getTeachers } = useUserStore();
  const { allClass: mainClasses = [], getClasses } = useClassStore();

  // Core Form State
  const [name, setName] = useState("");
  const [weekday, setWeekday] = useState("Monday");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedTradeId, setSelectedTradeId] = useState("");
  const [teacherId, setTeacherId] = useState("");

  // Relational Data State
  const assignTradeToBatch = useTradeStore((state) => state.assignTradeToBatch);

  // Classes State: [{ id, mainClass }]
  const [selectedClasses, setSelectedClasses] = useState([
    { id: Date.now(), mainClass: null },
  ]);

  // UI / Search State
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [searchQueries, setSearchQueries] = useState({
    class: "",
  });

  useEffect(() => {
    getTeachers();
    getClasses();
  }, [getTeachers, getClasses]);

  // Handle clicking outside to close active dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown && !event.target.closest(".dropdown-container")) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeDropdown]);

  // Class Management Functions
  const addClass = () => {
    setSelectedClasses([
      ...selectedClasses,
      { id: Date.now(), mainClass: null },
    ]);
  };

  const removeClass = (id) => {
    if (selectedClasses.length > 1) {
      setSelectedClasses(selectedClasses.filter((c) => c.id !== id));
    }
  };

  const updateClass = (id, cls) => {
    setSelectedClasses(
      selectedClasses.map((c) => (c.id === id ? { ...c, mainClass: cls } : c)),
    );
    setActiveDropdown(null);
    setSearchQueries({ class: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validClasses = selectedClasses.filter((c) => c.mainClass);

    if (validClasses.length === 0) {
      toast.error("Please add at least one course.");
      return;
    }

    // Extract unique classes
    const mainClassesSet = new Set(validClasses.map((c) => c.mainClass._id));

    const payload = {
      name,
      weekday,
      startTime,
      endTime,
      teachers: teacherId ? [teacherId] : [],
      mainClasses: Array.from(mainClassesSet),
      students: [],
      mainClassStudentPairs: [],
      tradeId: selectedTradeId || undefined,
    };

    try {
      const createdBatch = await createBatch(
        payload,
        navigate,
        selectedTradeId,
      );
      if (createdBatch?._id && selectedTradeId) {
        assignTradeToBatch(createdBatch._id, selectedTradeId);
      }
    } catch (err) {
      console.error("Failed to create batch:", err);
    }
  };

  // --- Helpers & Derivations ---

  const getInitials = (nameStr) =>
    nameStr ? nameStr.charAt(0).toUpperCase() : "U";

  const Avatar = ({
    src,
    name,
    icon: Icon = User,
    bgColor = "bg-primary",
    textColor = "text-primary-foreground",
  }) => (
    <div
      className={`w-8 h-8 rounded-full ${bgColor} ${textColor} flex items-center justify-center font-bold shrink-0 overflow-hidden shadow-inner`}
    >
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : name ? (
        <span className="text-xs">{getInitials(name)}</span>
      ) : (
        <Icon size={14} />
      )}
    </div>
  );

  const handleSearchChange = (field, value, activeKey) => {
    setSearchQueries((prev) => ({ ...prev, [field]: value }));
    setActiveDropdown(activeKey);
  };

  const getAvailableClasses = () => {
    return mainClasses;
  };

  const availableClasses = getAvailableClasses();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl"
    >
      <div className="p-5 sm:p-8 rounded-3xl bg-card border border-border shadow-2xl transition-colors duration-300">
        <BackButton
          details={`Set up core details, schedule, and assign courses to provision a
            new learning batch.`}
        />
        <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 mt-6">
          {/* SECTION 1: Core Details */}
          <div className="bg-muted/30 p-5 sm:p-6 rounded-2xl border border-border/50 space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <Briefcase size={20} className="text-primary" />
              Core Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Batch Name */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Batch Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm placeholder:text-muted-foreground"
                  placeholder="e.g. Morning Physics A"
                />
              </div>

              {/* Trade Selection */}
              <div className="md:col-span-1">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Trade
                </label>
                <div className="relative">
                  <select
                    value={selectedTradeId}
                    onChange={(event) => setSelectedTradeId(event.target.value)}
                    className="w-full px-4 py-3 appearance-none rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                  >
                    <option value="">Unassigned</option>
                    {TRADES.map((trade) => (
                      <option key={trade.id} value={trade.id}>
                        {trade.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-3.5 text-muted-foreground pointer-events-none"
                    size={18}
                  />
                </div>
              </div>

              {/* Teacher Selection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Assign Teacher
                </label>
                <div className="relative">
                  <select
                    value={teacherId}
                    onChange={(event) => setTeacherId(event.target.value)}
                    className="w-full px-4 py-3 appearance-none rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                  >
                    <option value="">Unassigned</option>
                    {teachers?.map((teacher) => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name} ({teacher.email})
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-4 top-3.5 text-muted-foreground pointer-events-none"
                    size={18}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Schedule */}
          <div className="bg-muted/30 p-5 sm:p-6 rounded-2xl border border-border/50 space-y-6">
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-primary" />
              Schedule Timing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Weekday
                </label>
                <div className="relative">
                  <select
                    value={weekday}
                    onChange={(e) => setWeekday(e.target.value)}
                    className="w-full px-4 py-3 appearance-none rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
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
                  <ChevronDown
                    className="absolute right-4 top-3.5 text-muted-foreground pointer-events-none"
                    size={18}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" /> Start
                  Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Clock size={14} className="text-muted-foreground" /> End Time
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Assigned Courses */}
          <div className="bg-muted/30 p-5 sm:p-6 rounded-2xl border border-border/50 space-y-6 transition-opacity opacity-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                <BookOpen size={20} className="text-primary" />
                Assigned Courses
              </h2>
            </div>

            <div className="space-y-4">
              <AnimatePresence>
                {selectedClasses.map((selectedClass, index) => (
                  <motion.div
                    key={selectedClass.id}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-col sm:flex-row gap-4 items-start"
                  >
                    {/* Course Selection */}
                    <div className="relative dropdown-container flex-1 w-full">
                      <div
                        className="relative flex items-center w-full min-h-[50px] px-4 py-2 rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm cursor-text"
                        onClick={() =>
                          setActiveDropdown(`class-${selectedClass.id}`)
                        }
                      >
                        {selectedClass.mainClass ? (
                          <div className="flex items-center gap-2 bg-primary/10 px-2 py-1.5 rounded-lg w-full">
                            <Avatar
                              icon={BookOpen}
                              bgColor="bg-primary/20"
                              textColor="text-primary"
                            />
                            <span className="text-sm font-medium text-primary truncate flex-1">
                              {selectedClass.mainClass.name}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateClass(selectedClass.id, null);
                              }}
                              className="text-primary/70 hover:text-primary ml-1 p-1 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <>
                            <Search
                              size={16}
                              className="text-muted-foreground mr-2 shrink-0"
                            />
                            <input
                              type="text"
                              placeholder="Select Course..."
                              value={
                                activeDropdown === `class-${selectedClass.id}`
                                  ? searchQueries.class
                                  : ""
                              }
                              onChange={(e) =>
                                handleSearchChange(
                                  "class",
                                  e.target.value,
                                  `class-${selectedClass.id}`,
                                )
                              }
                              className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:text-muted-foreground text-sm w-full truncate"
                            />
                          </>
                        )}
                        {!selectedClass.mainClass && (
                          <ChevronDown
                            className="absolute right-4 text-muted-foreground pointer-events-none"
                            size={18}
                          />
                        )}
                      </div>

                      <AnimatePresence>
                        {activeDropdown === `class-${selectedClass.id}` &&
                          !selectedClass.mainClass && (
                            <motion.div
                              initial={{ opacity: 0, y: -5 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -5 }}
                              className="absolute z-50 w-full mt-2 bg-card border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar"
                            >
                              {availableClasses
                                .filter((c) =>
                                  c.name
                                    ?.toLowerCase()
                                    .includes(
                                      searchQueries.class.toLowerCase(),
                                    ),
                                )
                                .map((cls) => (
                                  <div
                                    key={cls._id}
                                    onClick={() =>
                                      updateClass(selectedClass.id, cls)
                                    }
                                    className="px-4 py-3 hover:bg-muted/50 cursor-pointer flex items-center gap-3 transition-colors border-b last:border-0 border-border/50"
                                  >
                                    <Avatar
                                      icon={BookOpen}
                                      bgColor="bg-primary/20"
                                      textColor="text-primary"
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-foreground">
                                        {cls.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {cls.code}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              {availableClasses.length === 0 && (
                                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                  No matching classes found.
                                </div>
                              )}
                            </motion.div>
                          )}
                      </AnimatePresence>
                    </div>

                    {/* Remove Course Button */}
                    <button
                      type="button"
                      onClick={() => removeClass(selectedClass.id)}
                      disabled={selectedClasses.length === 1}
                      className="mt-1 sm:mt-0 p-3.5 rounded-xl border border-border bg-background text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center shrink-0 w-full sm:w-auto h-[50px]"
                    >
                      <Trash2 size={18} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <button
              type="button"
              onClick={addClass}
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
            >
              <Plus size={16} /> Add More
            </button>
          </div>

          <div className="pt-4 sm:pt-6 border-t border-border">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-primary hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-lg font-bold rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.99] flex justify-center items-center gap-2"
            >
              {isLoading ? (
                "Provisioning Batch..."
              ) : (
                <>
                  <Check size={22} />
                  Finalize & Create Batch
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
};

export default CreateBatch;
