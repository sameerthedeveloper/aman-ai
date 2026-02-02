
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                aman: {
                    bg: "#18181b", // zinc-900
                    card: "#27272a", // zinc-800
                    border: "#3f3f46", // zinc-700
                    text: "#f4f4f5", // zinc-100
                    secondary: "#a1a1aa", // zinc-400
                    accent: "#22d3ee", // cyan-400 (or similar distinct color)
                    muted: "#71717a" // zinc-500
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
                mono: ['JetBrains Mono', 'monospace'],
            }
        },
    },
    plugins: [],
}
