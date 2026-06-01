import { useState, useEffect } from "react";
import { announcements, type Announcement } from "../config/announcements";
import { X } from "lucide-react";

function activeAnnouncements(announcements: Announcement[]): Announcement | null {
  return announcements.find((a) => a.active) ?? null;
}

const STORAGE_KEY_PREFIX = "dismissed_announcement_";

export default function AnnouncementBanner() {
  const announcement = activeAnnouncements(announcements);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!announcement) return;
    const dismissed = localStorage.getItem(STORAGE_KEY_PREFIX + announcement.id);
    if (!dismissed) setVisible(true);
  }, [announcement]);

  if (!announcement || !visible) return null;

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY_PREFIX + announcement.id, "1");
  };

  const variantClasses: Record<string, string> = {
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200",
    success:
      "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200",
    warning:
      "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-200",
  };

  return (
    <div className={`px-4 py-3 border-b ${variantClasses[announcement.variant]}`}>
      <div className="max-w-4xl mx-auto flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{announcement.title}</p>
          <p className="text-sm opacity-90 mt-0.5">{announcement.body}</p>
          {announcement.link && (
            <a
              href={announcement.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium underline underline-offset-2 mt-1 inline-block opacity-80 hover:opacity-100"
            >
              {announcement.link.label}
            </a>
          )}
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 p-1 rounded-md hover:opacity-70 transition-opacity"
          aria-label="Dismiss announcement"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
