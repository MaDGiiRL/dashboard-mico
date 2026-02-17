/** @type {import('tailwindcss').Config} */
export default {
    content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                olympic: {
                    blue: "#0085C7",
                    yellow: "#F4C300",
                    black: "#000000",
                    green: "#009F3D",
                    red: "#DF0024",
                    navy: "#0B1B3A",
                    ice: "#F3F8FF",
                },
            },
        },
    },
    plugins: [],
};
