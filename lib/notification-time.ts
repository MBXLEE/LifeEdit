// Convert wall-clock reminders using the subscribing device's IANA time zone.
export function dateInZone(at: number, timeZone?: string) {
  if (!timeZone) { const d = new Date(at); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; }
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(at);
  const value = (type: string) => parts.find(p => p.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}
export function addDateDays(day: string, count: number) {
  const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate()+count); return d.toISOString().slice(0,10);
}
export function wallTime(day: string, time: string, timeZone?: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return NaN;
  const target = Date.parse(`${day}T${time}:00Z`);
  if (!Number.isFinite(target) || new Date(target).toISOString().slice(0,10) !== day) return NaN;
  if (!timeZone) return new Date(`${day}T${time}:00`).getTime();
  const formatter = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" });
  let guess = target;
  for (let i = 0; i < 3; i++) {
    const parts = formatter.formatToParts(guess);
    const v = (type: string) => parts.find(p => p.type === type)?.value;
    const represented = Date.parse(`${v("year")}-${v("month")}-${v("day")}T${v("hour")}:${v("minute")}:${v("second")}Z`);
    guess += target - represented;
  }
  const finalParts = formatter.formatToParts(guess);
  const value = (type: string) => finalParts.find(p => p.type === type)?.value;
  // A wall-clock time skipped by daylight saving has no scheduled occurrence.
  return `${value("year")}-${value("month")}-${value("day")}T${value("hour")}:${value("minute")}` === `${day}T${time}` ? guess : NaN;
}
