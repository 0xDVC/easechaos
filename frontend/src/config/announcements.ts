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
    body: "Final timetable is now available!",
    variant: "info",
    active: true,
  },
];
