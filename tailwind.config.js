/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                accent: '#6366f1',
                neutral: {
                    50: '#f7f8fb',
                    100: '#f3f4f6',
                    200: '#e5e7eb',
                    300: '#d1d5db',
                    400: '#9ca3af',
                    500: '#6b7280',
                    700: '#374151',
                }
            },
            boxShadow: {
                glass: '0 8px 24px rgba(17,24,39,0.08)',
                card: '0 10px 30px rgba(17,24,39,0.06)'
            },
            backdropBlur: {
                xl: '20px',
                lg: '12px',
            },
            borderRadius: {
                xl: '20px',
                '2xl': '24px',
                pill: '9999px'
            }
        },
    },
    plugins: [],
};