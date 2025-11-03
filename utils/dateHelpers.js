// ============================================
// FILE: utils/dateHelpers.js
// Date and Time Helper Functions
// ============================================

/**
 * Format date to readable string
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date (e.g., "Jan 15, 2025")
 */
export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

/**
 * Format time to readable string
 * @param {string|Date} time - Time to format
 * @returns {string} Formatted time (e.g., "2:30 PM")
 */
export function formatTime(time) {
  if (!time) return '';
  const t = new Date(`2000-01-01T${time}`);
  return t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Format date and time together
 * @param {string|Date} date - Date
 * @param {string} time - Time
 * @returns {string} Formatted datetime
 */
export function formatDateTime(date, time) {
  if (!date) return '';
  const dateStr = formatDate(date);
  const timeStr = time ? formatTime(time) : '';
  return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
}

/**
 * Get relative time (e.g., "2 hours ago")
 * @param {string|Date} date - Date to compare
 * @returns {string} Relative time string
 */
export function getRelativeTime(date) {
  if (!date) return '';

  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return formatDate(date);
}

/**
 * Check if date is today
 * @param {string|Date} date - Date to check
 * @returns {boolean} Is today
 */
export function isToday(date) {
  if (!date) return false;
  const d = new Date(date);
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} Is in past
 */
export function isPast(date) {
  if (!date) return false;
  return new Date(date) < new Date();
}

/**
 * Check if date is in the future
 * @param {string|Date} date - Date to check
 * @returns {boolean} Is in future
 */
export function isFuture(date) {
  if (!date) return false;
  return new Date(date) > new Date();
}

/**
 * Get date range string
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date
 * @returns {string} Date range (e.g., "Jan 1 - Jan 31, 2025")
 */
export function getDateRange(startDate, endDate) {
  if (!startDate || !endDate) return '';

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      // Same month
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${end.getFullYear()}`;
    } else {
      // Different months, same year
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${end.getFullYear()}`;
    }
  } else {
    // Different years
    return `${formatDate(start)} - ${formatDate(end)}`;
  }
}

/**
 * Convert date to YYYY-MM-DD format
 * @param {Date} date - Date object
 * @returns {string} YYYY-MM-DD string
 */
export function toDateString(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

/**
 * Convert time to HH:MM format
 * @param {Date} date - Date object with time
 * @returns {string} HH:MM string
 */
export function toTimeString(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toTimeString().split(' ')[0].substring(0, 5);
}
