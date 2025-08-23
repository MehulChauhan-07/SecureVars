/**
 * Custom XSS protection middleware
 * A lightweight version that doesn't modify request objects directly
 * Compatible with Express 5's read-only query property
 */

import { stripHtml } from "string-strip-html";

/**
 * Clean a value from potential XSS attacks
 * @param {any} value - The value to clean
 * @returns {any} - The cleaned value
 */
const cleanXSS = (value) => {
  if (typeof value === "string") {
    // Clean strings (remove HTML tags, scripts, etc.)
    return stripHtml(value, {
      skipHtmlDecoding: false,
    }).result;
  }

  if (Array.isArray(value)) {
    // Clean arrays recursively
    return value.map((item) => cleanXSS(item));
  }

  if (value && typeof value === "object") {
    // Clean objects recursively
    const cleanedObj = {};
    for (const [key, val] of Object.entries(value)) {
      cleanedObj[key] = cleanXSS(val);
    }
    return cleanedObj;
  }

  // Return other types as is (numbers, booleans, etc.)
  return value;
};

/**
 * Check if an object contains potential XSS attacks
 * @param {Object} obj - The object to check
 * @returns {boolean} - True if the object contains potential XSS attacks
 */
export const containsXSS = (obj) => {
  if (!obj) return false;

  // Check if it's a string with potential XSS
  if (typeof obj === "string") {
    const cleaned = stripHtml(obj, { skipHtmlDecoding: false }).result;
    return cleaned !== obj;
  }

  // Check arrays recursively
  if (Array.isArray(obj)) {
    return obj.some((item) => containsXSS(item));
  }

  // Check objects recursively
  if (typeof obj === "object") {
    return Object.values(obj).some((val) => containsXSS(val));
  }

  return false;
};

/**
 * Create clean copies of request objects without modifying the originals
 * @param {Object} req - Express request object
 * @returns {Object} - Object with clean copies of body, query, and params
 */
export const getCleanRequestData = (req) => {
  return {
    body: req.body ? cleanXSS(req.body) : undefined,
    query: req.query ? cleanXSS(req.query) : undefined,
    params: req.params ? cleanXSS(req.params) : undefined,
  };
};

export default { containsXSS, getCleanRequestData };
