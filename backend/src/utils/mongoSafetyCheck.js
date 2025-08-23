/**
 * Utility function to safely check for MongoDB operators in objects
 * Used as a replacement for express-mongo-sanitize in Express 5+
 */

/**
 * Check if an object contains MongoDB operators
 * @param {Object} obj - Object to check
 * @returns {boolean} - True if the object contains MongoDB operators
 */
export const containsOperators = (obj) => {
  if (!obj || typeof obj !== "object") return false;

  // Check for operators in keys
  const hasOperatorKeys = Object.keys(obj).some(
    (key) => key.startsWith("$") || key.includes(".")
  );

  if (hasOperatorKeys) return true;

  // Recursively check nested objects and arrays
  return Object.values(obj).some((value) => {
    if (Array.isArray(value)) {
      return value.some((item) => containsOperators(item));
    }

    if (value && typeof value === "object") {
      return containsOperators(value);
    }

    return false;
  });
};

export default containsOperators;
