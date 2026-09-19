/**
 * Business Hours & Real-Time Schedule Engine for A-ONE Restaurant.
 * Handles Pakistan standard timezone (Asia/Karachi), daily opening/closing schedules,
 * temporary closure flags with reasons, and order cutoff times.
 */

export interface DaySchedule {
  open: string; // "09:00" or "11:00" in 24h HH:mm
  close: string; // "23:00" or "01:00" in 24h HH:mm (can be past midnight e.g. "01:00" or "02:00")
  isOpen: boolean;
  cutoffMinutes?: number; // Minutes before closing when new orders stop
}

export interface TemporaryClosure {
  isClosed: boolean;
  reason?: string; // "Private Event", "Maintenance", "Holiday", "Kitchen Overload", "Emergency", "Other"
  closedUntil?: string; // ISO date string or description
}

export interface BusinessHoursConfig {
  timezone: string;
  openingHours: Record<string, DaySchedule>;
  temporaryClosure?: TemporaryClosure;
  defaultCutoffMinutes: number;
}

export interface BusinessHoursStatus {
  isOpen: boolean;
  status: "OPEN" | "CLOSED" | "TEMPORARILY_CLOSED";
  message: string;
  urduMessage: string;
  romanUrduMessage: string;
  todayDay: string;
  todaySchedule: DaySchedule;
  currentTimeStr: string;
  reason?: string;
}

export const DEFAULT_BUSINESS_HOURS: Record<string, DaySchedule> = {
  monday: { open: "11:00", close: "01:00", isOpen: true, cutoffMinutes: 20 },
  tuesday: { open: "11:00", close: "01:00", isOpen: true, cutoffMinutes: 20 },
  wednesday: { open: "11:00", close: "01:00", isOpen: true, cutoffMinutes: 20 },
  thursday: { open: "11:00", close: "01:00", isOpen: true, cutoffMinutes: 20 },
  friday: { open: "14:00", close: "02:00", isOpen: true, cutoffMinutes: 20 },
  saturday: { open: "11:00", close: "02:00", isOpen: true, cutoffMinutes: 20 },
  sunday: { open: "11:00", close: "01:00", isOpen: true, cutoffMinutes: 20 },
};

/** Get current Date in Pakistan (Asia/Karachi) timezone */
export function getPakistanTime(date: Date = new Date()): {
  dayOfWeek: string;
  hours: number;
  minutes: number;
  totalMinutes: number;
  timeString12h: string;
  dateString: string;
} {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Karachi",
    weekday: "long",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("en-US", options);
  const parts = formatter.formatToParts(date);
  
  let weekday = "Monday";
  let hour = 0;
  let minute = 0;

  for (const part of parts) {
    if (part.type === "weekday") weekday = part.value;
    if (part.type === "hour") hour = parseInt(part.value, 10);
    if (part.type === "minute") minute = parseInt(part.value, 10);
  }

  // Convert 24h to 12h display string
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  const timeString12h = `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;

  return {
    dayOfWeek: weekday.toLowerCase(),
    hours: hour,
    minutes: minute,
    totalMinutes: hour * 60 + minute,
    timeString12h,
    dateString: date.toLocaleDateString("en-US", { timeZone: "Asia/Karachi" }),
  };
}

/** Convert "HH:mm" string to minutes from midnight */
export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10) || 0);
  return h * 60 + m;
}

/** Format "HH:mm" to "11:00 AM" */
export function formatTime12h(timeStr: string): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":").map((v) => parseInt(v, 10) || 0);
  const period = h >= 12 ? "PM" : "AM";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${m.toString().padStart(2, "0")} ${period}`;
}

/**
 * Check if the restaurant is open right now based on stored settings.
 */
export function evaluateBusinessHours(
  settingsSchedule?: Record<string, any> | null,
  temporaryClosure?: TemporaryClosure | null,
  now: Date = new Date()
): BusinessHoursStatus {
  // 1. Check Temporary Closure
  if (temporaryClosure?.isClosed) {
    const reason = temporaryClosure.reason || "Temporary Maintenance";
    return {
      isOpen: false,
      status: "TEMPORARILY_CLOSED",
      message: `A-ONE Restaurant is temporarily closed (${reason}). We will resume service soon.`,
      urduMessage: `اے ون ریسٹورنٹ اس وقت عارضی طور پر بند ہے (${reason})۔ ہم جلد دوبارہ سروس شروع کریں گے۔`,
      romanUrduMessage: `A-ONE Restaurant is waqt aarzi tor par closed hai (${reason}). Hum jald dobara service shuru karenge.`,
      todayDay: getPakistanTime(now).dayOfWeek,
      todaySchedule: DEFAULT_BUSINESS_HOURS.monday,
      currentTimeStr: getPakistanTime(now).timeString12h,
      reason,
    };
  }

  const { dayOfWeek, totalMinutes, timeString12h } = getPakistanTime(now);
  const scheduleMap = settingsSchedule || DEFAULT_BUSINESS_HOURS;
  const todaySchedule: DaySchedule = scheduleMap[dayOfWeek] || DEFAULT_BUSINESS_HOURS[dayOfWeek] || {
    open: "11:00",
    close: "01:00",
    isOpen: true,
    cutoffMinutes: 20,
  };

  // 2. Check if day is marked closed
  if (!todaySchedule.isOpen) {
    return {
      isOpen: false,
      status: "CLOSED",
      message: `A-ONE Restaurant is closed on ${dayOfWeek.toUpperCase()}s.`,
      urduMessage: `اے ون ریسٹورنٹ آج (${dayOfWeek.toUpperCase()}) کو بند ہے۔`,
      romanUrduMessage: `A-ONE Restaurant aaj ${dayOfWeek.toUpperCase()} ko band hai.`,
      todayDay: dayOfWeek,
      todaySchedule,
      currentTimeStr: timeString12h,
    };
  }

  // 3. Time comparison (handling overnight schedules like 11:00 to 01:00 past midnight)
  const openMins = parseTimeToMinutes(todaySchedule.open);
  let closeMins = parseTimeToMinutes(todaySchedule.close);
  const cutoff = todaySchedule.cutoffMinutes || 20;

  let isCurrentlyOpen = false;

  if (closeMins <= openMins) {
    // Overnight schedule (e.g. 11:00 AM -> 01:00 AM next day)
    // Open if totalMinutes >= openMins OR totalMinutes <= (closeMins - cutoff)
    if (totalMinutes >= openMins) {
      isCurrentlyOpen = true;
    } else if (totalMinutes < closeMins - cutoff) {
      isCurrentlyOpen = true;
    }
  } else {
    // Normal same-day schedule (e.g. 09:00 AM -> 10:00 PM)
    if (totalMinutes >= openMins && totalMinutes < closeMins - cutoff) {
      isCurrentlyOpen = true;
    }
  }

  const openDisplay = formatTime12h(todaySchedule.open);
  const closeDisplay = formatTime12h(todaySchedule.close);

  if (isCurrentlyOpen) {
    return {
      isOpen: true,
      status: "OPEN",
      message: `A-ONE Restaurant is currently OPEN (${openDisplay} – ${closeDisplay}).`,
      urduMessage: `اے ون ریسٹورنٹ اس وقت کھلا ہے (${openDisplay} تا ${closeDisplay})۔`,
      romanUrduMessage: `A-ONE Restaurant is waqt OPEN hai (${openDisplay} se ${closeDisplay}).`,
      todayDay: dayOfWeek,
      todaySchedule,
      currentTimeStr: timeString12h,
    };
  } else {
    return {
      isOpen: false,
      status: "CLOSED",
      message: `A-ONE Restaurant is currently closed. Today's ordering hours are ${openDisplay} to ${closeDisplay}.`,
      urduMessage: `اے ون ریسٹورنٹ اس وقت بند ہے۔ ہماری اوقاتِ کار ${openDisplay} سے ${closeDisplay} تک ہیں۔`,
      romanUrduMessage: `A-ONE Restaurant is waqt closed hai. Hamari ordering timings ${openDisplay} se ${closeDisplay} tak hain.`,
      todayDay: dayOfWeek,
      todaySchedule,
      currentTimeStr: timeString12h,
    };
  }
}
