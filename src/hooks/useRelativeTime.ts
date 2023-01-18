import { useMemo } from "react";

export function useRelativeTime(date: Date, locale: "fr" | "en" = "fr") {
  const relativeTime = useMemo(() => {
    const relativeFormatter = new Intl.RelativeTimeFormat(locale, {
      numeric: "always",
    });
    const diff = date.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const diffWeek = Math.ceil(diff / (1000 * 60 * 60 * 24 * 7));
    const diffMonth = Math.ceil(diff / (1000 * 60 * 60 * 24 * 7 * 4));
    const diffYear = Math.ceil(diff / (1000 * 60 * 60 * 24 * 7 * 4 * 12));
    const diffHours = Math.ceil(diff / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diff / (1000 * 60));
    const diffSeconds = Math.ceil(diff / 1000);

    if (diffSeconds > -60) {
      return relativeFormatter.format(diffSeconds, "seconds");
    } else if (diffMinutes > -60) {
      return relativeFormatter.format(diffMinutes, "minutes");
    } else if (diffHours > -24) {
      return relativeFormatter.format(diffHours, "hours");
    } else if (diffDays > -7) {
      return relativeFormatter.format(diffDays, "days");
    } else if (diffWeek > -4) {
      return relativeFormatter.format(diffWeek, "weeks");
    } else if (diffMonth > -12) {
      return relativeFormatter.format(diffMonth, "months");
    } else {
      return relativeFormatter.format(diffYear, "years");
    }
  }, []);

  return relativeTime;
}
