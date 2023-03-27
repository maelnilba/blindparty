const speechLanguages = [
  "af",
  "eu",
  "bg",
  "ca",
  "ar - EG",
  "ar - JO",
  "ar - KW",
  "ar - LB",
  "ar - QA",
  "ar - AE",
  "ar - MA",
  "ar - IQ",
  "ar - DZ",
  "ar - BH",
  "ar - LY",
  "ar - OM",
  "ar - SA",
  "ar - TN",
  "ar - YE",
  "cs",
  "nl - NL",
  "en - AU",
  "en - CA",
  "en - IN",
  "en - NZ",
  "en - ZA",
  "en - GB",
  "en - US",
  "fi",
  "fr - FR",
  "gl",
  "de - DE",
  "el - GR",
  "he",
  "hu",
  "is",
  "it - IT",
  "id",
  "ja",
  "ko",
  "la",
  "zh - CN",
  "zh - TW",
  "zh - HK",
  "ms - MY",
  "no - NO",
  "pl",
  "xx - piglatin",
  "pt - PT",
  "pt - br",
  "ro - RO",
  "ru",
  "sr - SP",
  "sk",
  "es - AR",
  "es - BO",
  "es - CL",
  "es - CO",
  "es - CR",
  "es - DO",
  "es - EC",
  "es - SV",
  "es - GT",
  "es - HN",
  "es - MX",
  "es - NI",
  "es - PA",
  "es - PY",
  "es - PE",
  "es - PR",
  "es - ES",
  "es - US",
  "es - UY",
  "es - VE",
  "sv - SE",
  "tr",
  "zu",
] as const;
type SpeechLanguage = (typeof speechLanguages)[number];

export const parse = (acceptLanguage: string) =>
  acceptLanguage
    .split(",")
    .map((lang) => {
      const [language, priority = "q=1"] = lang.trim().split(";");
      const [languageCode, countryCode] = (language ?? "").trim().split("-");
      return {
        languageCode,
        countryCode,
        priority: parseFloat(priority.split("=")[1] ?? "0"),
      };
    })
    .sort((a, b) => b.priority - a.priority);

export const near = (
  languages: ReturnType<typeof parse>,
  fallback: SpeechLanguage
): SpeechLanguage => {
  for (const lang of languages) {
    if (!lang.languageCode) return fallback;
    if (!lang.countryCode) {
      if (speechLanguages.includes(lang.languageCode as SpeechLanguage)) {
        return lang.languageCode as SpeechLanguage;
      } else return fallback;
    }
    if (
      speechLanguages.includes(
        `${lang.languageCode!}-${lang.countryCode!}` as SpeechLanguage
      )
    ) {
      return `${lang.languageCode!}-${lang.countryCode!}` as SpeechLanguage;
    } else return fallback;
  }
  return fallback;
};
