/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
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
