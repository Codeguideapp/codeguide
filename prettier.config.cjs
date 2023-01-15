/** @type {import("prettier").Config} */
module.exports = {
  printWidth: 80,
  tabWidth: 2,
  singleQuote: true,
  semi: true,
  plugins: [require.resolve('prettier-plugin-tailwindcss')],
};
