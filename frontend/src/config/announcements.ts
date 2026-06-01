export interface Announcement {
  id: string;
  title: string;
  body: string;
  link?: { href: string; label: string };
  variant: "info" | "success" | "warning";
  active: boolean;
}

export const announcements: Announcement[] = [
  {
    id: "second-semester-timetable",
    title: "New Timetable Available",
    body: "The Second Semester timetable is now live! Select your department and year to view your updated schedule.",
    variant: "info",
    active: true,
  },
];
