package model

import "sort"

// BuildTaskCalendar groups tasks by due_date (YYYY-MM-DD). Days are sorted ascending.
// Tasks within each day keep their input order (caller should sort by position/due_date).
func BuildTaskCalendar(from, to string, tasks []Task) TaskCalendarResult {
	byDay := make(map[string][]Task)
	for _, t := range tasks {
		if t.DueDate == nil || *t.DueDate == "" {
			continue
		}
		d := *t.DueDate
		byDay[d] = append(byDay[d], t)
	}
	dates := make([]string, 0, len(byDay))
	for d := range byDay {
		dates = append(dates, d)
	}
	sort.Strings(dates)
	days := make([]TaskCalendarDay, 0, len(dates))
	total := 0
	for _, d := range dates {
		list := byDay[d]
		total += len(list)
		days = append(days, TaskCalendarDay{Date: d, Tasks: list})
	}
	return TaskCalendarResult{From: from, To: to, Days: days, Total: total}
}
