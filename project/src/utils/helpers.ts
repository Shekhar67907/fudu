/**
 * Generates a unique prescription number in the format PYYMM-DDRRRR
 * Where:
 * P: Literal 'P' prefix
 * YY: Last two digits of current year
 * MM: Month (01-12)
 * DD: Day of month (01-31)
 * RRRR: 4 random digits (0000-9999)
 */
export const generatePrescriptionNo = (): string => {
  const now = new Date();
  
  // Get date components
  const year = String(now.getFullYear()).slice(-2);  // Last 2 digits of year
  const month = String(now.getMonth() + 1).padStart(2, '0');  // Month (01-12)
  const day = String(now.getDate()).padStart(2, '0');  // Day (01-31)
  
  // Generate 4 random digits
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  
  // Format: PYYMM-DDRRRR
  return `P${year}${month}-${day}${randomDigits}`;
};

/**
 * Calculates IPD from RPD and LPD values
 */
export const calculateIPD = (rpd: string, lpd: string): string => {
  const rpdValue = parseFloat(rpd || '0');
  const lpdValue = parseFloat(lpd || '0');
  
  if (isNaN(rpdValue) || isNaN(lpdValue)) {
    return '';
  }
  
  return (rpdValue + lpdValue).toFixed(1);
};

/**
 * Formats a numeric input to ensure it has a '+' prefix if positive
 */
export const formatNumericInput = (value: string): string => {
  if (!value) return '';
  
  // Allow negative sign to be entered and maintained
  if (value === '-' || value.startsWith('-')) {
    return value;
  }

  const numericValue = parseFloat(value);
  
  if (isNaN(numericValue)) return '';
  
  // Add '+' only if the value is positive and doesn't start with '+'.
  // The check for '-' is already handled above.
  if (numericValue > 0 && !value.startsWith('+')) {
    return `+${numericValue}`;
  }
  
  return value;
};

/**
 * Returns today's date in YYYY-MM-DD format
 */
export const getTodayDate = (): string => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Returns date one month from today in YYYY-MM-DD format
 */
export const getNextMonthDate = (): string => {
  const today = new Date();
  today.setMonth(today.getMonth() + 1);
  return today.toISOString().split('T')[0];
};

export const titleOptions: Array<{ label: string, value: string }> = [
  { label: 'Mr.', value: 'Mr.' },
  { label: 'Ms.', value: 'Ms.' },
  { label: 'Mrs.', value: 'Mrs.' },
  { label: 'Dr.', value: 'Dr.' }
];

export const classOptions: Array<{ label: string, value: string }> = [
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'Business', value: 'Business' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
  { label: 'Dr', value: 'Dr' },
  { label: 'Rajness', value: 'Rajness' },
  { label: 'Gold', value: 'Gold' }
];

export const prescribedByOptions: Array<{ label: string, value: string }> = [
  { label: 'Self', value: 'Self' },
  { label: 'Doctor', value: 'Doctor' },
  { label: 'Optometrist', value: 'Optometrist' }
];