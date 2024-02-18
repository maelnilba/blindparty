export function formatPosition(position: number, locale?: string) {
  const formatter = new Intl.NumberFormat(locale, { minimumFractionDigits: 0 });
  const suffix = (num: number) => {
    switch (locale) {
      case "en":
        if (num === 1) return "st";
        if (num === 2) return "nd";
        if (num === 3) return "rd";
        return "th";
      default:
        if (num === 1) return "er";
        return "ème";
    }
  };

  return formatter.format(position) + suffix(position);
}
