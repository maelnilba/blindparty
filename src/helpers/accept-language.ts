const speechLanguages = [
  "af",
  "eu",
  "bg",
  "ca",
  "ar-EG",
  "ar-JO",
  "ar-KW",
  "ar-LB",
  "ar-QA",
  "ar-AE",
  "ar-MA",
  "ar-IQ",
  "ar-DZ",
  "ar-BH",
  "ar-LY",
  "ar-OM",
  "ar-SA",
  "ar-TN",
  "ar-YE",
  "cs",
  "nl-NL",
  "en-AU",
  "en-CA",
  "en-IN",
  "en-NZ",
  "en-ZA",
  "en-GB",
  "en-US",
  "fi",
  "fr-FR",
  "gl",
  "de-DE",
  "el-GR",
  "he",
  "hu",
  "is",
  "it-IT",
  "id",
  "ja",
  "ko",
  "la",
  "zh-CN",
  "zh-TW",
  "zh-HK",
  "ms-MY",
  "no-NO",
  "pl",
  "xx-piglatin",
  "pt-PT",
  "pt-br",
  "ro-RO",
  "ru",
  "sr-SP",
  "sk",
  "es-AR",
  "es-BO",
  "es-CL",
  "es-CO",
  "es-CR",
  "es-DO",
  "es-EC",
  "es-SV",
  "es-GT",
  "es-HN",
  "es-MX",
  "es-NI",
  "es-PA",
  "es-PY",
  "es-PE",
  "es-PR",
  "es-ES",
  "es-US",
  "es-UY",
  "es-VE",
  "sv-SE",
  "tr",
  "zu",
];
export type SpeechLanguage = (typeof speechLanguages)[number];

export const getAcceptLanguage = (acceptLanguage: string = "") => {
  return acceptLanguage
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
    .sort((a, b) => b.priority - a.priority)
    .map((language) => {
      if (!language) return;
      if (!language.countryCode && !language.languageCode) return;
      if (!language.countryCode) return language.languageCode!;
      return `${language.languageCode!}-${language.countryCode!}`;
    });
};

export const getLanguage = (language: string) => {
  if (speechLanguages.includes(language)) {
    return language;
  } else if (
    speechLanguages.includes(
      `${language.toLowerCase()}-${language.toUpperCase()}`
    )
  ) {
    return `${language.toLowerCase()}-${language.toUpperCase()}`;
  }
};
