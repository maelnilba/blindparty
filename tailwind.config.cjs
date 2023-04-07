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
  plugins: [],
};
