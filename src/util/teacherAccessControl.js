import useAuthStore from "../stores/useAuthStore";

/**
 * Check if a teacher can access a specific student
 * Teachers can only access students in their assigned batches
 */
export const canTeacherAccessStudent = (
  studentId,
  teacherBatches,
  userRole,
) => {
  if (userRole === "Admin") return true;
  if (userRole !== "Teacher") return false;

  // Check if student exists in any of teacher's batch students
  if (!teacherBatches || teacherBatches.length === 0) return false;

  return teacherBatches.some((batch) => {
    if (!batch) return false;

    // Check mainClassStudentPairs
    if (
      batch.mainClassStudentPairs &&
      Array.isArray(batch.mainClassStudentPairs)
    ) {
      return batch.mainClassStudentPairs.some(
        (pair) => pair.student && pair.student._id === studentId,
      );
    }

    // Fallback: check students array
    if (batch.students && Array.isArray(batch.students)) {
      return batch.students.some((s) => {
        if (typeof s === "string") return s === studentId;
        return s._id === studentId;
      });
    }

    return false;
  });
};

/**
 * Check if a teacher can access another teacher's profile
 * Teachers can only access their own profile
 */
export const canTeacherAccessTeacherProfile = (
  targetUserId,
  currentUserId,
  userRole,
) => {
  if (userRole === "Admin") return true;
  if (userRole !== "Teacher") return true; // Students can view teacher profiles

  // Teachers can only access their own profile
  return currentUserId === targetUserId;
};

/**
 * Check if a teacher can access a specific batch
 * Teachers can only access their assigned batches
 */
export const canTeacherAccessBatch = (
  batchId,
  teacherBatches,
  userRole,
  batchTeacherEmail = null,
  userEmail = null,
  batch = null,
  userId = null,
) => {
  if (userRole === "Admin") return true;
  if (userRole !== "Teacher") return true; // Students can view batches

  // Check 1: Match by teacher email (legacy)
  if (userEmail && batchTeacherEmail && userEmail === batchTeacherEmail)
    return true;

  // Check 2: Check if batch ID is in teacher's batches array
  if (!teacherBatches || teacherBatches.length === 0) {
    // If teacherBatches is empty, check the batch.teachers array
    if (batch && Array.isArray(batch.teachers)) {
      // Check by user ID
      if (
        userId &&
        batch.teachers.some((t) => String(t._id || t) === String(userId))
      ) {
        return true;
      }
      // Check by email
      if (userEmail && batch.teachers.some((t) => t.email === userEmail)) {
        return true;
      }
    }
    return false;
  }

  // Check 3: Check if batch is in teacher's batches list
  if (teacherBatches.some((batch) => batch._id === batchId)) {
    return true;
  }

  // Check 4: Check batch.teachers array if batch object is provided
  if (batch && Array.isArray(batch.teachers)) {
    // Check by user ID
    if (
      userId &&
      batch.teachers.some((t) => String(t._id || t) === String(userId))
    ) {
      return true;
    }
    // Check by email
    if (userEmail && batch.teachers.some((t) => t.email === userEmail)) {
      return true;
    }
  }

  return false;
};

/**
 * Filter students to only include those from teacher's batches
 */
export const filterStudentsForTeacher = (
  students,
  teacherBatches,
  userRole,
) => {
  if (userRole === "Admin") return students;
  if (userRole !== "Teacher") return [];

  if (!teacherBatches || teacherBatches.length === 0) return [];

  const allowedStudentIds = new Set();

  teacherBatches.forEach((batch) => {
    if (
      batch.mainClassStudentPairs &&
      Array.isArray(batch.mainClassStudentPairs)
    ) {
      batch.mainClassStudentPairs.forEach((pair) => {
        if (pair.student && pair.student._id) {
          allowedStudentIds.add(pair.student._id);
        }
      });
    }

    if (batch.students && Array.isArray(batch.students)) {
      batch.students.forEach((student) => {
        const studentId = typeof student === "string" ? student : student._id;
        if (studentId) allowedStudentIds.add(studentId);
      });
    }
  });

  return students.filter((student) => allowedStudentIds.has(student._id));
};

/**
 * Filter batches to only include teacher's assigned batches
 */
export const filterBatchesForTeacher = (
  batches,
  teacherBatches,
  userRole,
  userEmail = null,
  userId = null,
) => {
  if (userRole === "Admin") return batches;
  if (userRole !== "Teacher") return batches;

  const teacherBatchIds = new Set(
    (teacherBatches || []).map((b) => b._id || b),
  );

  return batches.filter((batch) => {
    // Check 1: Batch is in user's batches array
    if (teacherBatchIds.has(batch._id)) return true;

    // Check 2: Match by teacher email (if available in batch response)
    if (userEmail && batch.teacherEmail === userEmail) return true;

    // Check 3: Match by teacher ID in the populated teachers array
    if (Array.isArray(batch.teachers)) {
      const teacherIds = batch.teachers.map((t) => t._id || t).map(String);
      if (userId && teacherIds.includes(String(userId))) return true;

      // Also check by email in populated teachers
      if (userEmail && batch.teachers.some((t) => t.email === userEmail))
        return true;
    }

    return false;
  });
};

/**
 * Get teacher's assigned batches from user data
 * Handles both full batch objects and batch IDs
 */
export const getTeacherAssignedBatches = (userData) => {
  if (!userData || !userData.batches) return [];

  return Array.isArray(userData.batches)
    ? userData.batches
    : [userData.batches];
};
