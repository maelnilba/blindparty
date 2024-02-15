const svgToDataUri = require("mini-svg-data-uri");
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      maxHeight: {
        contain: "calc(100vh - 8rem)",
      },
      transitionProperty: {
        width: "width",
        "width-opacity": "opacity, width",
        "height-opacity": "opacity, height",
        "size-opacity": "opacity, width, height",
        "colors-padding":
          "color, background-color, border-color, text-decoration-color, fill, stroke, padding",
      },
      zIndex: {
        100: "100",
        200: "200",
        navigation: "250",
        300: "300",
        max: "9999",
      },
      animation: {
        "fill-dash": "dash-twice 2s infinite 0s forwards",
      },
      keyframes: {
        // Keyframes look like bug so I added them in globals.css too
        "dash-twice": {
          "50%": {
            "stroke-dashoffset": 0,
          },
          "100%": {
            "stroke-dashoffset": "calc(400% * -1)",
          },
        },
        dash: {
          "100%": {
            "stroke-dashoffset": 0,
          },
        },
      },
    },
  },
  plugins: [
    addVariablesForColors,
    function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "bg-grid": (value) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          "bg-grid-small": (value) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="8" height="8" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
            )}")`,
          }),
          "bg-dot": (value) => ({
            backgroundImage: `url("${svgToDataUri(
              `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" id="pattern-circle" cx="10" cy="10" r="1.6257413380501518"></circle></svg>`
            )}")`,
          }),
        },
        { values: flattenColorPalette(theme("backgroundColor")), type: "color" }
      );
    },
  ],
};

function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}
