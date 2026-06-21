import React, { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import useFeesStore from "../stores/useFeesStore";
import useUserStore from "../stores/useUserStore";
import FilterPanel from "../components/UI/FilterPanel";
import StudentRow from "../components/UI/StudentRow";
import DashboardCards from "../components/UI/DashboardCards";
import StudentSearch from "../components/UI/StudentSearch";
import DiscountToggleButton from "../components/UI/DiscountToggleButton";
import useAuthStore from "../stores/useAuthStore";
import { api } from "../api/api";
import {
  filterBatchesForTeacher,
  filterStudentsForTeacher,
} from "../util/teacherAccessControl";

const Fees = () => {
  const {
    students,
    mainClasses,
    batches,
    selectedMainClass,
    selectedBatch,
    isLoading,
    fetchMainClasses,
    fetchBatches,
    fetchStudentsForBatch,
    setSelectedMainClass,
    setSelectedBatch,
  } = useFeesStore();

  const [classFeesAmount, setClassFeesAmount] = useState(0);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [showDiscountFields, setShowDiscountFields] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const userRole = useAuthStore((state) => state.userRole);
  const userData = useAuthStore((state) => state.user);
  const isTeacher = userRole === "Teacher";

  // For Global Search
  const { students: allStudents, getStudents } = useUserStore();
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [pendingCurrentMonth, setPendingCurrentMonth] = useState(0);
  const [pendingPreviousMonth, setPendingPreviousMonth] = useState(0);
  const [pendingLoading, setPendingLoading] = useState(false);

  // BUG FIX: Prevent re-fetching if data already exists in Zustand to retain state on tab switch
  useEffect(() => {
    const loadInitialData = async () => {
      if (!mainClasses || mainClasses.length === 0) await fetchMainClasses();
      if (!batches || batches.length === 0) await fetchBatches();
      if (getStudents && (!allStudents || allStudents.length === 0))
        getStudents();
    };
    loadInitialData();
  }, []); // Empty dependency array prevents infinite loops on mount

  const teacherBatches = useMemo(() => {
    if (!isTeacher) return batches || [];

    return filterBatchesForTeacher(
      batches || [],
      userData?.batches || [],
      userRole,
      userData?.email,
      userData?._id,
    );
  }, [batches, isTeacher, userRole, userData]);

  const teacherCourseIds = useMemo(() => {
    const courseIds = new Set(
      (userData?.mainClasses || []).map((course) =>
        String(course?._id || course),
      ),
    );

    teacherBatches.forEach((batch) => {
      batch.mainClasses?.forEach((course) => {
        const courseId = course?._id || course;
        if (courseId) courseIds.add(String(courseId));
      });

      batch.mainClassStudentPairs?.forEach((pair) => {
        const courseId = pair.mainClass?._id || pair.mainClass;
        if (courseId) courseIds.add(String(courseId));
      });
    });

    return courseIds;
  }, [teacherBatches, userData]);

  // Memoized Main Classes to filter out unassigned courses for students/teachers
  const displayedMainClasses = useMemo(() => {
    if (!mainClasses) return [];
    if (userRole === "Student") {
      const studentClassIds = (userData?.mainClasses || []).map(
        (c) => String(c._id || c),
      );
      return mainClasses.filter((mc) =>
        studentClassIds.includes(String(mc._id)),
      );
    }
    if (isTeacher) {
      return mainClasses.filter((mc) => {
        if (teacherCourseIds.has(String(mc._id))) return true;
        if (userData?.email && mc.teacherEmail === userData.email) return true;
        if (Array.isArray(mc.teachers)) {
          const teacherIds = mc.teachers.map((t) => String(t._id || t));
          if (userData?._id && teacherIds.includes(String(userData._id))) {
            return true;
          }
          if (
            userData?.email &&
            mc.teachers.some((t) => t.email === userData.email)
          ) {
            return true;
          }
        }
        return false;
      });
    }
    return mainClasses;
  }, [mainClasses, userRole, userData, isTeacher, teacherCourseIds]);

  const displayedCourseIds = useMemo(
    () => new Set(displayedMainClasses.map((course) => String(course._id))),
    [displayedMainClasses],
  );

  const searchableStudents = useMemo(() => {
    const studentList = allStudents || [];
    if (isTeacher) {
      return filterStudentsForTeacher(studentList, teacherBatches, userRole);
    }
    return studentList;
  }, [allStudents, isTeacher, teacherBatches, userRole]);

  useEffect(() => {
    if (!selectedMainClass || !mainClasses?.length) return;
    if (!displayedCourseIds.has(String(selectedMainClass))) {
      setSelectedMainClass(null);
      setSelectedBatch(null);
    }
  }, [
    selectedMainClass,
    mainClasses?.length,
    displayedCourseIds,
    setSelectedMainClass,
    setSelectedBatch,
  ]);

  // Fetch students when main class is selected
  useEffect(() => {
    if (selectedMainClass) {
      const selectedClass = mainClasses?.find(
        (mc) => mc._id === selectedMainClass,
      );
      if (selectedClass) {
        setClassFeesAmount(selectedClass.fees);
      }

      let relevantBatches =
        batches?.filter((batch) =>
          batch.mainClasses?.some(
            (mc) => mc._id === selectedMainClass || mc === selectedMainClass,
          ),
        ) || [];

      if (isTeacher) {
        relevantBatches = filterBatchesForTeacher(
          relevantBatches,
          userData?.batches || [],
          userRole,
          userData?.email,
          userData?._id,
        );
      } else if (userRole === "Student") {
        relevantBatches = relevantBatches.filter((batch) => {
          const inStudents = batch.students?.some(
            (s) => (s._id || s) === userData?._id,
          );
          const inPairs = batch.mainClassStudentPairs?.some(
            (p) => (p.student?._id || p.student) === userData?._id,
          );
          return inStudents || inPairs;
        });
      }

      setFilteredBatches(relevantBatches);
    } else {
      setFilteredBatches([]);
    }
  }, [selectedMainClass, mainClasses, batches, userRole, userData, isTeacher]);

  useEffect(() => {
    if (!selectedBatch || !selectedMainClass) return;
    if (!filteredBatches.some((batch) => batch._id === selectedBatch)) {
      setSelectedBatch(null);
    }
  }, [selectedBatch, selectedMainClass, filteredBatches, setSelectedBatch]);

  // Fetch students when batch is selected
  useEffect(() => {
    if (selectedBatch) {
      fetchStudentsForBatch(selectedBatch);
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [selectedBatch, fetchStudentsForBatch]);

  const handleSearch = (results) => {
    setSearchResults(results);
    setIsSearching(results.length > 0 || results.length === 0);
  };

  // BUG FIX: Fallback to empty array to prevent mapping crashes and restrict for students
  const displayedStudents = useMemo(() => {
    let result = isSearching ? searchResults : students || [];
    if (userRole === "Student") {
      result = result.filter(
        (s) => (s._id || s.id || s.studentId) === userData?._id,
      );
    }
    return result;
  }, [isSearching, searchResults, students, userRole, userData]);

  const getMonthLabel = (date) =>
    date.toLocaleString("default", { month: "long", year: "numeric" });

  // BUG FIX: Optimized the N+1 API problem using concurrent Promise execution
  useEffect(() => {
    if (!searchableStudents?.length) return;

    let isMounted = true;
    const loadPendingCounts = async () => {
      setPendingLoading(true);
      const currentMonthLabel = getMonthLabel(new Date());
      const previousMonthDate = new Date();
      previousMonthDate.setMonth(previousMonthDate.getMonth() - 1);
      const previousMonthLabel = getMonthLabel(previousMonthDate);

      const pendingCurrent = new Set();
      const pendingPrevious = new Set();

      // Collect all API requests into an array to fire concurrently
      const promises = [];

      for (const student of searchableStudents) {
        const studentId = student._id;
        let classIds = (student.mainClasses || []).map((cls) => cls._id || cls);
        if (isTeacher) {
          classIds = classIds.filter((classId) =>
            displayedCourseIds.has(String(classId)),
          );
        }

        for (const classId of classIds) {
          const request = api
            .get(`/fees/history/${classId}/${studentId}`)
            .then((response) => {
              const history = response.data?.history || [];
              const paidCurrent = history.some(
                (record) =>
                  String(record.month || "")
                    .trim()
                    .toLowerCase() === currentMonthLabel.toLowerCase(),
              );
              const paidPrevious = history.some(
                (record) =>
                  String(record.month || "")
                    .trim()
                    .toLowerCase() === previousMonthLabel.toLowerCase(),
              );

              if (!paidCurrent) pendingCurrent.add(studentId);
              if (!paidPrevious) pendingPrevious.add(studentId);
            })
            .catch((error) => {
              if (error.response?.status !== 404) {
                pendingCurrent.add(studentId);
                pendingPrevious.add(studentId);
              }
            });

          promises.push(request);
        }
      }

      // Execute all API calls concurrently
      await Promise.all(promises);

      if (isMounted) {
        setPendingCurrentMonth(pendingCurrent.size);
        setPendingPreviousMonth(pendingPrevious.size);
        setPendingLoading(false);
      }
    };

    loadPendingCounts();

    return () => {
      isMounted = false;
    };
  }, [searchableStudents, isTeacher, displayedCourseIds]);

  const handleMainClassChange = (mainClassId) => {
    setSelectedMainClass(mainClassId);
    setSelectedBatch(null);
  };

  const handleBatchChange = (batchId) => {
    setSelectedBatch(batchId);
  };

  const handlePaymentSuccess = () => {
    if (selectedBatch) {
      fetchStudentsForBatch(selectedBatch);
    }
    toast.success("Payment processed successfully!");
  };

  const handleAutoSelectStudent = (student) => {
    let foundBatch = null;
    let foundMainClassId = null;

    const selectableBatches = isTeacher ? teacherBatches : batches || [];

    for (const batch of selectableBatches) {
      const hasStudent =
        batch.students?.some(
          (s) => s === student._id || s._id === student._id,
        ) ||
        batch.mainClassStudentPairs?.some(
          (pair) =>
            pair.student === student._id || pair.student?._id === student._id,
        );

      if (hasStudent) {
        foundBatch = batch;
        const pair = batch.mainClassStudentPairs?.find(
          (p) => p.student === student._id || p.student?._id === student._id,
        );
        if (pair) {
          foundMainClassId = pair.mainClass?._id || pair.mainClass;
        } else if (batch.mainClasses?.length > 0) {
          foundMainClassId = batch.mainClasses[0]?._id || batch.mainClasses[0];
        }
        break;
      }
    }

    if (foundBatch && foundMainClassId) {
      handleMainClassChange(foundMainClassId);
      setTimeout(() => handleBatchChange(foundBatch._id), 100);
      setGlobalSearchResults([]);
      toast.success(`Found and selected ${student.name}'s batch`);
    } else if (student.mainClasses?.length > 0) {
      const allowedMainClass = student.mainClasses.find((mainClass) =>
        displayedCourseIds.has(String(mainClass?._id || mainClass)),
      );
      const fallbackMainClass = isTeacher
        ? allowedMainClass
        : student.mainClasses[0];
      if (!fallbackMainClass) {
        toast.error("Student is not assigned to your batches or courses.");
        return;
      }
      handleMainClassChange(fallbackMainClass?._id || fallbackMainClass);
      toast.success(
        `Selected main class for ${student.name}. Please select a batch manually.`,
      );
      setGlobalSearchResults([]);
    } else {
      toast.error("Student is not assigned to any batch or class.");
    }
  };

  const selectedBatchObj = batches?.find((b) => b._id === selectedBatch);
  const selectedMainClassObj = mainClasses?.find(
    (mc) => mc._id === selectedMainClass,
  );
  const batchName = selectedBatchObj
    ? `${selectedBatchObj.name} (${selectedBatchObj.startTime} - ${selectedBatchObj.endTime})`
    : "";

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8 transition-colors duration-300">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Fees Management
        </h1>
        <p className="text-muted-foreground">
          Manage student fees, calculate fines, apply discounts, and process
          payments
        </p>
      </div>

      <DashboardCards
        totalStudents={displayedStudents.length}
        pendingCurrentMonth={pendingCurrentMonth}
        pendingPreviousMonth={pendingPreviousMonth}
        isLoading={isLoading || pendingLoading}
      />

      {userRole !== "Student" && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4">
            Global Student Search
          </h2>
          <StudentSearch
            students={searchableStudents || []}
            onSearch={(results) => setGlobalSearchResults(results)}
            debounceMs={300}
          />
          {globalSearchResults.length > 0 && (
            <div className="mt-4 border border-border rounded-xl overflow-hidden divide-y divide-border/50 max-h-60 overflow-y-auto">
              {globalSearchResults.map((student) => (
                <div
                  key={student._id}
                  className="flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <p className="font-semibold text-foreground">
                      {student.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Phone: {student.phone} | Email: {student.email}
                    </p>
                  </div>
                  <button
                    onClick={() => handleAutoSelectStudent(student)}
                    className="bg-primary hover:opacity-90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    Locate & Select
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <FilterPanel
          mainClasses={displayedMainClasses || []}
          batches={filteredBatches || []}
          selectedMainClass={selectedMainClass}
          selectedBatch={selectedBatch}
          onMainClassChange={handleMainClassChange}
          onBatchChange={handleBatchChange}
          isLoading={isLoading}
          hideCourseFees={isTeacher}
        />
      </div>

      {selectedMainClass && selectedBatch && (
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden transition-colors">
          <div className="p-6 border-b border-border">
            <StudentSearch
              students={students || []}
              onSearch={handleSearch}
              debounceMs={500}
            />
            {isSearching && searchResults.length > 0 && (
              <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary">
                Showing {searchResults.length} search result
                {searchResults.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="w-full p-6 space-y-4">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-4 animate-pulse"
                >
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-1/3"></div>
                    <div className="h-3 bg-muted rounded w-1/4"></div>
                  </div>
                  <div className="hidden md:block h-8 w-20 bg-muted rounded"></div>
                  <div className="hidden md:block h-8 w-20 bg-muted rounded"></div>
                  <div className="h-8 w-20 bg-muted rounded"></div>
                  <div className="h-8 w-24 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : displayedStudents.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-lg">
                {isSearching
                  ? "No students found matching your search."
                  : selectedBatch
                    ? "No students found for this batch."
                    : "Please select both a class and batch to view students."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted/50 border-b border-border sticky top-0">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Photo
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Student Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Phone
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Month
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Monthly Fee
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Fine
                    </th>
                    {showDiscountFields && (
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                        Conscession
                      </th>
                    )}
                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Total Payable
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {displayedStudents.map((student) => (
                    <StudentRow
                      key={student._id}
                      student={student}
                      mainClassId={selectedMainClass}
                      classFees={classFeesAmount}
                      batchName={batchName}
                      courseName={selectedMainClassObj?.name || "N/A"}
                      onPaymentSuccess={handlePaymentSuccess}
                      showDiscount={showDiscountFields}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {displayedStudents.length > 0 && (
            <div className="bg-muted/30 border-t border-border px-6 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Students:</span>
                  <p className="font-bold text-lg text-primary">
                    {displayedStudents.length}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Course:</span>
                  <p className="font-bold text-primary">
                    {selectedMainClassObj?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Batch:</span>
                  <p className="font-bold text-primary">
                    {selectedBatchObj?.name || "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">
                    Fee per Student:
                  </span>
                  <p className="font-bold text-primary">₹{classFeesAmount}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-primary/10 border border-primary/20 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-primary mb-2">
            📅 Fine Calculation
          </h3>
          <p className="text-sm text-foreground/80">
            ₹10 per day after the 10th of every month. Select a payment date and
            click "Calculate Fine" to determine the applicable fine amount.
          </p>
        </div>
        <div className="bg-success/10 border border-success/20 rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-success mb-2">Cons Option</h3>
          <p className="text-sm text-foreground/80">
            Click the floating button at the bottom-right to show/hide discount
            fields for all students. Apply fixed amount discounts as needed.
          </p>
        </div>
        <div className="bg-muted/50 border border-border rounded-xl p-5 shadow-sm">
          <h3 className="font-semibold text-foreground mb-2">
            ✓ Payment Validation
          </h3>
          <p className="text-sm text-muted-foreground">
            The Process button only enables when the paid amount exactly matches
            the calculated total (fees + fine - discount).
          </p>
        </div>
      </div>

      <DiscountToggleButton
        isVisible={showDiscountFields}
        onToggle={() => setShowDiscountFields(!showDiscountFields)}
      />

      <div className="mt-8 bg-info/10 border border-info/30 rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-bold text-info mb-2">
          💡 Tips for Managing Fees
        </h3>
        <ul className="text-sm text-foreground/80 space-y-2">
          <li>
            • Use the search bar to quickly find students by name, ID, or phone
            number
          </li>
          <li>
            • Fine is calculated as ₹10 per day after the 10th of the month
          </li>
          <li>
            • Students can pay multiple months together; fines apply to each
            month separately
          </li>
          <li>
            • Discounts only reduce the payable amount; fines are not reduced
          </li>
          <li>• Payment must exactly match the total amount to process</li>
        </ul>
      </div>
    </div>
  );
};

export default Fees;
