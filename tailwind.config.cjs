/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      maxHeight: {
        contain: "calc(100vh - 8rem)",
      },
    },
  },
  plugins: [],
};
