/**
 * Checks if a user is 18 or older based on a birthday string in 'YYYY-MM-DD' format.
 * Handles leap years correctly and validates format.
 * 
 * @param {string} birthday - Birthday string in 'YYYY-MM-DD' format.
 * @returns {boolean} - Returns true if the user is 18 or older, false otherwise.
 */
export function isOver18(birthday) {
    if (!birthday) return false;

    // Validate format YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthday)) {
        console.warn("Invalid date format. Expected YYYY-MM-DD:", birthday);
        return false;
    }

    try {
        const birthDate = new Date(birthday);

        // Ensure it's a valid date object (e.g. not 2023-02-31)
        if (isNaN(birthDate.getTime())) return false;

        const today = new Date();

        // Calculate age
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();

        // Leap year and month/day correction
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }

        return age >= 18;
    } catch (e) {
        console.error("Error calculating age:", e);
        return false;
    }
}

/**
 * Validates if the date string is a plausible birth date (not in future, not > 120 years ago).
 * @param {string} dateStr 
 * @returns {boolean}
 */
export function isValidBirthDate(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;

    const today = new Date();
    if (date > today) return false; // In future

    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 120);
    if (date < minDate) return false; // Too old

    return true;
}
