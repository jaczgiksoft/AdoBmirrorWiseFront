/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./app/renderer/src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            // aún puedes definir colores o tamaños aquí si lo deseas
        },
    },
    plugins: [],
};
