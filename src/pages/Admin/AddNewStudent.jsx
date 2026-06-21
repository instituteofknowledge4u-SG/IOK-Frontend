import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserPlus,
  Calendar,
  BookOpen,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  ChevronDown,
  Users,
} from "lucide-react";
import { motion } from "framer-motion";
import useClassStore from "../../stores/useClassStore";
import useUserStore from "../../stores/useUserStore";
import toast from "react-hot-toast";
import BackButton from "../../components/UI/Button";

const AddNewStudent = () => {
  const navigate = useNavigate();

  const {
    allClass,
    getClasses,
    addStudentInClass,
    isLoading: isClassLoading,
  } = useClassStore();

  const {
    students,
    getStudents,
    isLoading: isStudentsLoading,
  } = useUserStore();

  const [formData, setFormData] = useState({
    mainClassId: "",
    studentEmail: "",
    admissionDate: new Date().toISOString().split("T")[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: null, message: "" });

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);

  const dropdownRef = useRef(null);

  useEffect(() => {
    getClasses();
    getStudents();
  }, [getClasses, getStudents]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (feedback.type === "error") setFeedback({ type: null, message: "" });
  };

  const handleStudentSelect = (student) => {
    setSelectedStudent(student);
    setFormData((prev) => ({ ...prev, studentEmail: student.email }));
    setIsDropdownOpen(false);
    setStudentSearchTerm("");
    if (feedback.type === "error") setFeedback({ type: null, message: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.mainClassId ||
      !formData.studentEmail ||
      !formData.admissionDate
    ) {
      setFeedback({
        type: "error",
        message: "Please fill in all required fields.",
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: null, message: "" });

    try {
      await addStudentInClass(formData);

      setFeedback({
        type: "success",
        message: "Student successfully enrolled in the course!",
      });

      setFormData((prev) => ({ ...prev, studentEmail: "", mainClassId: "" }));
      setSelectedStudent(null);
      toast.success("Student successfully enrolled in the course!");
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err.response?.data?.message ||
          "Failed to add student. Please try again.",
      });
      toast.error("Failed to add student. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const safeStudentsArray = Array.isArray(students)
    ? students
    : students?.data || [];

  const safeSearchTerm = (studentSearchTerm || "").toLowerCase();

  const filteredStudents = safeStudentsArray.filter((student) => {
    const safeName = (student?.name || "").toString().toLowerCase();
    const safeEmail = (student?.email || "").toString().toLowerCase();

    return (
      safeName.includes(safeSearchTerm) || safeEmail.includes(safeSearchTerm)
    );
  });

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  return (
    <>
      {isStudentsLoading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-300">
          <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-foreground font-medium animate-pulse">
            Loading students...
          </p>
        </div>
      )}

      <motion.div
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={{ duration: 0.3 }}
        className="min-h-screen bg-background p-6 md:p-8 flex flex-col items-center justify-center"
      >
        <div className="w-full max-w-xl">
          {/* Header */}
          <div className="mb-8">
            <BackButton details={`Assign an existing student to a course.`} />
          </div>

          {/* Main Form Card */}
          <div className="bg-card border border-border rounded-2xl shadow-sm p-6 md:p-8">
            {feedback.message && (
              <div
                className={`mb-6 p-4 rounded-xl flex items-start gap-3 border ${
                  feedback.type === "error"
                    ? "bg-destructive/10 border-destructive/20 text-destructive"
                    : "bg-success/10 border-success/20 text-success"
                }`}
              >
                {feedback.type === "error" ? (
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <p className="font-medium text-sm">{feedback.message}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Course Selection */}
              <div className="space-y-2">
                <label
                  htmlFor="mainClassId"
                  className="block text-sm font-semibold text-foreground"
                >
                  Select Course <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <BookOpen className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <select
                    id="mainClassId"
                    name="mainClassId"
                    value={formData.mainClassId}
                    onChange={handleChange}
                    disabled={isClassLoading}
                    className="block w-full pl-11 pr-10 py-3 bg-background border border-border rounded-xl text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>
                      Choose a course...
                    </option>
                    {allClass?.map((course) => (
                      <option key={course._id} value={course._id}>
                        {course.name} {course.isActive ? "" : "(Inactive)"}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {/* Custom Student Select Dropdown */}
              <div className="space-y-2" ref={dropdownRef}>
                <label className="block text-sm font-semibold text-foreground">
                  Select Student <span className="text-destructive">*</span>
                </label>

                <div className="relative">
                  {/* Custom Input Box */}
                  <div
                    onClick={() =>
                      !isStudentsLoading && setIsDropdownOpen(!isDropdownOpen)
                    }
                    className={`flex items-center justify-between w-full pl-3 pr-4 py-2.5 bg-background border rounded-xl transition-all shadow-sm ${
                      isDropdownOpen
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-border hover:border-primary/50"
                    } ${isStudentsLoading ? "opacity-70 cursor-wait" : "cursor-pointer"}`}
                  >
                    {selectedStudent ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            selectedStudent.profilePic ||
                            `https://ui-avatars.com/api/?name=${selectedStudent.name}&background=e0e7ff&color=4f46e5`
                          }
                          alt={selectedStudent.name}
                          className="w-7 h-7 rounded-full object-cover border border-border"
                        />
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-medium text-foreground leading-tight">
                            {selectedStudent.name}
                          </span>
                          <span className="text-xs text-muted-foreground leading-tight">
                            {selectedStudent.email}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground py-1">
                        {isStudentsLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Users className="w-5 h-5" />
                        )}
                        <span>
                          {isStudentsLoading
                            ? "Loading students..."
                            : "Search and select a student..."}
                        </span>
                      </div>
                    )}
                    <ChevronDown
                      className={`w-5 h-5 text-muted-foreground transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                  </div>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-xl z-20 overflow-hidden">
                      {/* Search Bar inside dropdown */}
                      <div className="p-2 border-b border-border bg-muted/30">
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder="Search by name or email..."
                            value={studentSearchTerm}
                            onChange={(e) =>
                              setStudentSearchTerm(e.target.value)
                            }
                            className="w-full pl-9 pr-3 py-2 text-sm bg-background text-foreground border border-border rounded-lg outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Student List */}
                      <div className="max-h-60 overflow-y-auto">
                        {filteredStudents.length > 0 ? (
                          filteredStudents.map((student) => (
                            <div
                              key={student._id}
                              onClick={() => handleStudentSelect(student)}
                              className="flex items-center gap-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors border-b border-border/50 last:border-0"
                            >
                              <img
                                src={
                                  student.profilePic ||
                                  `https://ui-avatars.com/api/?name=${student.name}&background=e0e7ff&color=4f46e5`
                                }
                                alt={student.name}
                                className="w-9 h-9 rounded-full object-cover border border-border"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-foreground">
                                  {student.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {student.email}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-muted-foreground">
                            No students found matching "{studentSearchTerm}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Admission Date */}
              <div className="space-y-2">
                <label
                  htmlFor="admissionDate"
                  className="block text-sm font-semibold text-foreground"
                >
                  Admission Date <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <input
                    type="date"
                    id="admissionDate"
                    name="admissionDate"
                    value={formData.admissionDate}
                    onChange={handleChange}
                    className="block w-full pl-11 pr-4 py-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-sm"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-border">
                <button
                  type="submit"
                  disabled={isSubmitting || isClassLoading || isStudentsLoading}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3.5 rounded-xl font-semibold transition-all shadow-sm shadow-primary/20 hover:opacity-90 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Enrolling Student...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Enroll Student
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default AddNewStudent;