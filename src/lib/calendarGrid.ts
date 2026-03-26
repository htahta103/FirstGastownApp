import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from 'date-fns'

export type CalendarGrain = 'month' | 'week'

const weekOptions = { weekStartsOn: 1 as const }

/** Visible grid + API date range (inclusive) for GET /tasks/calendar */
export function getCalendarGrid(cursor: Date, grain: CalendarGrain) {
  if (grain === 'week') {
    const start = startOfWeek(cursor, weekOptions)
    const end = endOfWeek(cursor, weekOptions)
    return {
      apiFrom: format(start, 'yyyy-MM-dd'),
      apiTo: format(end, 'yyyy-MM-dd'),
      days: eachDayOfInterval({ start, end }),
      focusMonth: cursor,
    }
  }
  const sm = startOfMonth(cursor)
  const em = endOfMonth(cursor)
  const gridStart = startOfWeek(sm, weekOptions)
  const gridEnd = endOfWeek(em, weekOptions)
  return {
    apiFrom: format(gridStart, 'yyyy-MM-dd'),
    apiTo: format(gridEnd, 'yyyy-MM-dd'),
    days: eachDayOfInterval({ start: gridStart, end: gridEnd }),
    focusMonth: sm,
  }
}
