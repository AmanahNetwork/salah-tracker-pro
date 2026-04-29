// client/src/utils/timeHelpers.js

export const calculateDuration = (from, to) => {
  const parseTime = (t) => {
    let [h, m] = [parseInt(t.hour), parseInt(t.minute)];
    if (t.ampm === 'PM' && h !== 12) h += 12;
    if (t.ampm === 'AM' && h === 12) h = 0;
    return h * 60 + m; // Total minutes
  };

  let diff = parseTime(to) - parseTime(from);
  // This logic is crucial for hostellers who might sleep at 1 AM and wake at 8 AM
  if (diff < 0) diff += 24 * 60; 
  
  return (diff / 60).toFixed(1); // Returns a string like "7.5"
};