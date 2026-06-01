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
    body: "Second Semester timetable is now live!",
    variant: "info",
    active: true,
  },
];
