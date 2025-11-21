/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: "class", // 👈 ACTIVAR
    content: [
        "./app/renderer/index.html",
        "./app/renderer/src/**/*.{js,jsx,ts,tsx}",
        "../../node_modules/react-tailwindcss-datepicker/dist/index.esm.{js,ts}",
    ],
    theme: {
        extend: {},
    },
    plugins: [],
};
