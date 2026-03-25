package model

import (
	"testing"

	"github.com/google/uuid"
)

func TestBuildTaskCalendar_groupsAndSortsDays(t *testing.T) {
	d1 := "2026-03-10"
	d2 := "2026-03-05"
	t1 := Task{ID: uuid.MustParse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"), Title: "Later", DueDate: &d1}
	t2 := Task{ID: uuid.MustParse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"), Title: "Earlier", DueDate: &d2}
	t3 := Task{ID: uuid.MustParse("cccccccc-cccc-cccc-cccc-cccccccccccc"), Title: "Same day", DueDate: &d2}

	got := BuildTaskCalendar("2026-03-01", "2026-03-31", []Task{t1, t2, t3})
	if got.From != "2026-03-01" || got.To != "2026-03-31" || got.Total != 3 {
		t.Fatalf("meta: %+v", got)
	}
	if len(got.Days) != 2 {
		t.Fatalf("days len = %d", len(got.Days))
	}
	if got.Days[0].Date != d2 || len(got.Days[0].Tasks) != 2 {
		t.Fatalf("first day: %+v", got.Days[0])
	}
	if got.Days[1].Date != d1 || len(got.Days[1].Tasks) != 1 {
		t.Fatalf("second day: %+v", got.Days[1])
	}
}

func TestBuildTaskCalendar_skipsNilDue(t *testing.T) {
	got := BuildTaskCalendar("2026-03-01", "2026-03-31", []Task{{Title: "No due"}})
	if len(got.Days) != 0 || got.Total != 0 {
		t.Fatalf("got %+v", got)
	}
}
