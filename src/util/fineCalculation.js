/**
 * Fine Calculation Utility
 *
 * Business Rules:
 * - Due date: 10th of every month
 * - Fine: ₹10 per day after due date
 * - Fine resets monthly
 * - Example: 11th → ₹10, 12th → ₹20, 13th → ₹30
 */

/**
 * Calculate fine for a single month
 * @param {Date|string} paymentDate - Date when payment is being made
 * @param {number} dueDay - Day of month when fee is due (default: 10)
 * @param {number} finePerDay - Fine amount per day (default: ₹10)
 * @returns {number} - Fine amount in rupees
 */
export const calculateFineForMonth = (
  paymentDate,
  dueDay = 10,
  finePerDay = 10,
) => {
  const date = new Date(paymentDate);
  const currentDay = date.getDate();

  // If payment is on or before due date, no fine
  if (currentDay <= dueDay) {
    return 0;
  }

  // Calculate days late
  const daysLate = currentDay - dueDay;
  return daysLate * finePerDay;
};

/**
 * Calculate fine for a specific month string (e.g., "January 2024")
 * @param {string} monthString - Month in format "January 2024" or "Jan 2024"
 * @param {number} dueDay - Day of month when fee is due (default: 10)
 * @param {number} finePerDay - Fine amount per day (default: ₹10)
 * @returns {number} - Fine amount
 */
export const calculateFineForMonthString = (
  monthString,
  dueDay = 10,
  finePerDay = 10,
) => {
  if (!monthString) return 0;

  try {
    // Parse month string (e.g., "January 2024" or "Jan 2024")
    const date = new Date(`${monthString} 15`); // Use mid-month to parse correctly

    if (isNaN(date.getTime())) {
      console.warn(`Invalid month string: ${monthString}`);
      return 0;
    }

    // If the month is in the future, no fine
    const today = new Date();
    if (
      date.getFullYear() > today.getFullYear() ||
      (date.getFullYear() === today.getFullYear() &&
        date.getMonth() > today.getMonth())
    ) {
      return 0;
    }

    // Set to last day of the month to calculate correct fine
    const lastDay = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0,
    ).getDate();
    const fineDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      Math.min(lastDay, today.getDate()),
    );

    return calculateFineForMonth(fineDate, dueDay, finePerDay);
  } catch (error) {
    console.error(`Error calculating fine for month: ${monthString}`, error);
    return 0;
  }
};

/**
 * Calculate total fine for multiple months
 * @param {string[]} monthStrings - Array of month strings (e.g., ["January 2024", "February 2024"])
 * @param {number} dueDay - Day of month when fee is due (default: 10)
 * @param {number} finePerDay - Fine amount per day (default: ₹10)
 * @returns {number} - Total fine amount
 */
export const calculateTotalFine = (
  monthStrings = [],
  dueDay = 10,
  finePerDay = 10,
) => {
  if (!Array.isArray(monthStrings) || monthStrings.length === 0) {
    return 0;
  }

  return monthStrings.reduce((total, monthString) => {
    return total + calculateFineForMonthString(monthString, dueDay, finePerDay);
  }, 0);
};

/**
 * Calculate fine breakdown by month
 * @param {string[]} monthStrings - Array of month strings
 * @param {number} dueDay - Day of month when fee is due (default: 10)
 * @param {number} finePerDay - Fine amount per day (default: ₹10)
 * @returns {Object[]} - Array of {month, fine} objects
 */
export const calculateFineBreakdown = (
  monthStrings = [],
  dueDay = 10,
  finePerDay = 10,
) => {
  return monthStrings.map((monthString) => ({
    month: monthString,
    fine: calculateFineForMonthString(monthString, dueDay, finePerDay),
  }));
};

/**
 * Get due date string for a month
 * @param {string} monthString - Month string (e.g., "January 2024")
 * @param {number} dueDay - Day of month (default: 10)
 * @returns {Date} - Due date
 */
export const getMonthDueDate = (monthString, dueDay = 10) => {
  const date = new Date(`${monthString} 1`);
  date.setDate(dueDay);
  return date;
};

/**
 * Check if a month has pending fine
 * @param {string} monthString - Month string
 * @param {number} dueDay - Day of month when fee is due (default: 10)
 * @returns {boolean} - True if fine is pending
 */
export const isMonthFinePending = (monthString, dueDay = 10) => {
  const fine = calculateFineForMonthString(monthString, dueDay);
  return fine > 0;
};

/**
 * Get formatted fine amount
 * @param {number} amount - Fine amount
 * @returns {string} - Formatted string (e.g., "₹50.00")
 */
export const formatFineAmount = (amount) => {
  return `₹${parseFloat(amount).toFixed(2)}`;
};

/**
 * Get fine percentage of base fee
 * @param {number} fine - Fine amount
 * @param {number} baseFee - Base monthly fee
 * @returns {number} - Percentage
 */
export const getFinePercentage = (fine, baseFee) => {
  if (baseFee === 0) return 0;
  return ((fine / baseFee) * 100).toFixed(1);
};
