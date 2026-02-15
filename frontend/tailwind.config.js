/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                background: '#0f172a', // Charcoal
                primary: {
                    DEFAULT: '#2563eb', // Electric Blue
                    light: '#60a5fa',
                    dark: '#1d4ed8',
                },
                warning: '#f59e0b', // Amber
                critical: '#ef4444', // Soft Red
                surface: '#1e293b',
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
        },
    },
    plugins: [],
}
