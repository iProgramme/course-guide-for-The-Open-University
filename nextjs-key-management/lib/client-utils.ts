// Generate a unique identifier string for the current device/client
export const generateOriginalStr = (): string => {
  // Create a string based on various browser/environment properties
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown';
  const platform = typeof navigator !== 'undefined' ? navigator.platform : 'unknown';
  const time = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 10);
  
  // Create a simple hash-like identifier
  return `${userAgent}_${platform}_${time}_${random}`;
};

// Get originalStr from localStorage if available, otherwise generate a new one
export const getOriginalStr = (): string => {
  if (typeof window !== 'undefined') {
    // Try to get from localStorage first
    const storedOriginalStr = localStorage.getItem('originalStr');
    if (storedOriginalStr) {
      return storedOriginalStr;
    }
    
    // Generate a new one and store it
    const newOriginalStr = generateOriginalStr();
    localStorage.setItem('originalStr', newOriginalStr);
    return newOriginalStr;
  }
  
  // For server-side rendering, return a default value
  return 'server-side';
};