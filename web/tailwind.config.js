import forms from '@tailwindcss/forms';

const neutral = {
    100: '#f9f4ed',
    200: '#eee7db',
    300: '#dcd3c4',
    400: '#c0b6a5',
    500: '#a19786',
    600: '#82796a',
    700: '#645c50',
    800: '#474238',
    900: '#2e2b25',
};

const accent = {
    DEFAULT: '#c67139',
    100: '#fff2eb',
    200: '#ffe1d0',
    300: '#ffc6a5',
    400: '#f6a06b',
    500: '#d67f48',
    600: '#b2622d',
    700: '#8c491a',
    800: '#643312',
    900: '#402310',
};

const accent2 = {
    DEFAULT: '#7a8a5e',
    100: '#f0fae1',
    200: '#e1eecc',
    300: '#ccdbb2',
    400: '#aebf92',
    500: '#8fa073',
    600: '#728157',
    700: '#56633f',
    800: '#3d472b',
    900: '#272e1b',
};

const ink = '#201e1d';

/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{vue,ts}'],
    theme: {
        extend: {
            colors: {
                bg: '#f5ead8',
                surface: '#ebddc5',
                ink,
                divider: `color-mix(in srgb, ${ink} 16%, transparent)`,
                muted: `color-mix(in srgb, ${ink} 55%, transparent)`,
                neutral,
                accent,
                'accent-2': accent2,
            },
            fontFamily: {
                heading: ['Caprasimo', 'system-ui', 'sans-serif'],
                body: ['Figtree', 'system-ui', 'sans-serif'],
                sans: ['Figtree', 'system-ui', 'sans-serif'],
            },
            fontSize: {
                h1: ['42px', { lineHeight: '1.12', letterSpacing: '-0.015em' }],
                h2: ['32px', { lineHeight: '1.12', letterSpacing: '-0.015em' }],
                h3: ['25px', { lineHeight: '1.12', letterSpacing: '-0.015em' }],
                h4: ['20px', { lineHeight: '1.12', letterSpacing: '-0.015em' }],
                h5: ['16px', { lineHeight: '1.12', letterSpacing: '-0.015em' }],
                h6: ['13px', { lineHeight: '1.12', letterSpacing: '0.08em' }],
                kicker: ['10px', { lineHeight: '1.2', letterSpacing: '0.1em' }],
                body: ['15px', { lineHeight: '1.55' }],
                'card-title': ['17px', { lineHeight: '1.2' }],
                control: ['14px', { lineHeight: '1.2' }],
                'dialog-body': ['14px', { lineHeight: '1.55' }],
                caption: ['13px', { lineHeight: '1.4' }],
                label: ['12px', { lineHeight: '1.4' }],
                meta: ['11px', { lineHeight: '1.4' }],
            },
            opacity: {
                7: '0.07',
                14: '0.14',
                18: '0.18',
                45: '0.45',
            },
            spacing: {
                1: '4.4px',
                2: '8.8px',
                3: '13.2px',
                4: '17.6px',
                6: '26.4px',
                8: '35.2px',
            },
            borderRadius: {
                sm: '8px',
                md: '16px',
                lg: '28px',
                card: 'calc(28px * 1.15)',
                pill: '999px',
            },
            boxShadow: {
                sm: `0 1px 2px color-mix(in srgb, ${neutral[900]} 14%, transparent)`,
                md: `0 3px 10px color-mix(in srgb, ${neutral[900]} 16%, transparent)`,
                lg: `0 12px 32px color-mix(in srgb, ${neutral[900]} 22%, transparent)`,
            },
        },
    },
    plugins: [forms()],
};
