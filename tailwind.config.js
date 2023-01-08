/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        catamaran: ['"Catamaran"'],
        roboto: ['"Roboto"'],
        inconsola: ['"Inconsolata"'],
      },
    },
  },
  plugins: [],
};
