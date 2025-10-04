import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{vue,ts}'],
    theme: {
        extend: {
            colors: {
                brand: {
                    DEFAULT: '#136f63',
                    50:'#edf7f5',100:'#d6efeb',200:'#a8ddd4',300:'#76c9bb',
                    400:'#49b8a6',500:'#28a895',600:'#1f8a7a',700:'#176b60',800:'#11514a',900:'#0c3a36'
                }
            },
            boxShadow: { soft: '0 2px 8px rgba(0,0,0,.06)' }
        },
    },
    plugins: [forms()],
};
