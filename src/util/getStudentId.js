/**
 * Generate Student ID in format: IKMMYYxxx
 * MM = Month (01-12)
 * YY = Last 2 digits of year
 * xxx = 3-digit hash derived directly from the user's unique _id
 */
export const getStudentId = (user) => {
  if (!user) return "N/A";

  // 1. If they already have a generated studentId, return it immediately.
  // We do this FIRST so it doesn't fail if _id happens to be missing.
  if (user.studentId) return user.studentId;

  // 2. Safely grab the ID, checking both _id (MongoDB default) and id (common frontend mapping)
  const baseId = user._id || user.id;
  if (!baseId) return "N/A";

  // 3. Generate the hash
  const createdDate = new Date(user.createdAt || Date.now());
  const month = String(createdDate.getMonth() + 1).padStart(2, "0");
  const year = String(createdDate.getFullYear()).slice(-2);
  const prefix = `IK${month}${year}`;

  const idStr = String(baseId);

  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }

  const uniqueNum = Math.abs(hash) % 1000;
  const uniqueSuffix = String(uniqueNum).padStart(3, "0");

  return `${prefix}${uniqueSuffix}`;
};
