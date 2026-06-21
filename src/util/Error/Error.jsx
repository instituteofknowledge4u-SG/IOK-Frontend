export const parseError = (errorMessage) => {
  const match = errorMessage.match(
    /student (\w+) is not enrolled in mainClass (\w+)/,
  );

  if (!match) return errorMessage;

  const studentId = match[1];
  const classId = match[2];

  return { studentId, classId };
};

export const getReadableError = (
  selectedStudents,
  selectedClasses,
  errorMessage,
) => {
  const parsed = parseError(errorMessage);

  if (typeof parsed === "string") return parsed;

  const student = selectedStudents.find((s) => s._id === parsed.studentId);
  const mainClass = selectedClasses.find((c) => c._id === parsed.classId);

  const studentName = student?.name || parsed.studentId;
  const className = mainClass?.name || parsed.classId;

  return `Student ${studentName} is not enrolled in ${className}. Please add the student to that class first.`;
};
