//this is for the days nobody works: weekends and these holidays (add the next year here when needed)
//Feb 25 2026 is a special working day, so it is not in the list
const HOLIDAYS = [
  "2026-01-01",
  "2026-02-17",
  "2026-03-20",
  "2026-04-02",
  "2026-04-03",
  "2026-04-04",
  "2026-04-09",
  "2026-05-01",
  "2026-06-12",
  "2026-08-21",
  "2026-08-31",
  "2026-11-01",
  "2026-11-02",
  "2026-11-30",
  "2026-12-08",
  "2026-12-24",
  "2026-12-25",
  "2026-12-30",
  "2026-12-31",
];

//this is for asking if a date text like 2026-10-28 is a working day
export function isWorkday(str) {
  const day = new Date(str + "T00:00:00").getDay();
  return day !== 0 && day !== 6 && !HOLIDAYS.includes(str);
}
