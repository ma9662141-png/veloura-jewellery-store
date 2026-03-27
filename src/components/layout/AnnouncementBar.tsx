import { STORE_SETTINGS } from '@/data/mock';

export function AnnouncementBar() {
  if (!STORE_SETTINGS.announcement_active || !STORE_SETTINGS.announcement_text) return null;

  return (
    <div className="announcement-shimmer bg-primary py-2.5 text-center font-body text-xs font-semibold tracking-wide text-primary-foreground md:text-sm">
      {STORE_SETTINGS.announcement_text}
    </div>
  );
}
