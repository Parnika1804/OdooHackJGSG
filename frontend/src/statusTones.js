// Single source of truth for what color tone a given status word maps to,
// across vehicles, trips, maintenance, and fuel/expense records. Centralizing
// this stops each page from defining its own statusStyles object with
// slightly different colors for the same concept (e.g. "Completed" showing
// green in one table and a different green in another).
//
// Tones map to Badge's TONE_CLASSES — see components/ui/Badge.js.
export const STATUS_TONES = {
  // Vehicles
  Available: "success",
  "On Trip": "transit",
  "In Shop": "signal",
  Retired: "alert",

  // Trips
  Draft: "neutral",
  Dispatched: "transit",
  Completed: "success",
  Cancelled: "alert",

  // Maintenance
  Scheduled: "signal",
  "In Progress": "transit",
  Done: "success",

  // Drivers / generic
  Active: "success",
  Inactive: "neutral",
  "Off Duty": "signal",
  Suspended: "alert",
};

export function toneForStatus(status) {
  return STATUS_TONES[status] || "neutral";
}