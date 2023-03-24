/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      maxHeight: {
        contain: "calc(100vh - 8rem)",
      },
      zIndex: {
        100: "100",
        200: "200",
        navigation: "250",
        300: "300",
        max: "9999",
      },
    },
  },
  plugins: [],
};
