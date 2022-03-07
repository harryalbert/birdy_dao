/* tailwind.config.js */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    colors: {
      "main": "#1FB611",
      "black": "#212130",
      "grey-black": "#767676",
      "grey": "#ADB5BD",
      "light": "#F2F2F6",
      "white": "#FFFFFF",
    },
    fontFamily: {
      main: ["Rubik", "sans-serif"],
    },
  },
  plugins: [],
}