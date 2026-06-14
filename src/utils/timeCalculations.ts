// Configuration interface matching the company's feature_toggles
export interface CompanyConfig {
  rounding?: boolean;
  auto_break?: boolean;
}

/**
 * Rounds a given Date to the nearest 15 minutes.
 * Examples: 08:07 -> 08:00, 08:08 -> 08:15
 */
export const roundToNearest15 = (date: Date): Date => {
  const ms = 1000 * 60 * 15; // 15 minutes in ms
  return new Date(Math.round(date.getTime() / ms) * ms);
};

/**
 * Validates and automatically deducts pauses according to German labor law (ArbZG).
 * - > 6h to 9h work: min 30 minutes pause
 * - > 9h work: min 45 minutes pause
 * 
 * @param grossMinutes Total elapsed work time (before any pause deductions)
 * @param trackedPauseMinutes Minutes the user explicitly took/entered as a pause
 * @returns The final pause minutes that should be deducted
 */
export const calculateRequiredPause = (grossMinutes: number, trackedPauseMinutes: number): number => {
  let requiredPause = 0;
  
  if (grossMinutes > 9 * 60) {
    requiredPause = 45;
  } else if (grossMinutes > 6 * 60) {
    requiredPause = 30;
  }
  
  return Math.max(requiredPause, trackedPauseMinutes);
};

/**
 * Calculates final totals for a time entry.
 */
export const calculateFinalTimes = (
  startTime: Date, 
  endTime: Date, 
  trackedPauseMinutes: number,
  config: CompanyConfig
) => {
  let finalStart = startTime;
  let finalEnd = endTime;

  if (config.rounding) {
    finalStart = roundToNearest15(startTime);
    finalEnd = roundToNearest15(endTime);
  }

  // Ensure end is not before start after rounding
  if (finalEnd < finalStart) {
    finalEnd = finalStart;
  }

  const grossMs = finalEnd.getTime() - finalStart.getTime();
  const grossMinutes = Math.floor(grossMs / 60000);

  let finalPauseMinutes = trackedPauseMinutes;
  if (config.auto_break) {
    finalPauseMinutes = calculateRequiredPause(grossMinutes, trackedPauseMinutes);
  }

  // Prevent pause from exceeding total work time
  finalPauseMinutes = Math.min(finalPauseMinutes, grossMinutes);
  
  const netMinutes = Math.max(0, grossMinutes - finalPauseMinutes);

  return {
    finalStart,
    finalEnd,
    grossMinutes,
    finalPauseMinutes,
    netMinutes
  };
};
