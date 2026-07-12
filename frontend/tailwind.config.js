module.exports = {
  darkMode: "class", // lets us toggle dark/light later via a class on <html>
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        accent: "#d97706", // the orange from the mockup — swap/theme later
      },
    },
  },
  plugins: [],
};