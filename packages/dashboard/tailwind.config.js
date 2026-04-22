/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Graphic Realism: Anton for massive display headings
        display: ['Anton', 'Impact', 'sans-serif'],
        // JetBrains Mono for data readouts and body
        mono: ['JetBrains Mono', 'Roboto Mono', 'monospace'],
        // Space Grotesk for UI labels and navigation
        sans: ['Space Grotesk', 'sans-serif'],
      },
      colors: {
        // Graphic Realism Palette — DO NOT ADD to this without team approval
        accent: '#CCFF00',       // Neon chartreuse — primary signal color
        'accent-cyan': '#00FFFF', // Cyan — secondary signal
        danger: '#FF3300',        // Blood orange — alerts & errors
        warn: '#FFB800',          // Amber — warnings
        surface: {
          DEFAULT: '#111111',
          deep: '#050505',
          elevated: '#1C1C1C',
          border: '#2A2A2A',
        },
        text: {
          primary: '#F0F0F0',
          muted: '#666666',
          faint: '#333333',
        },
      },
      boxShadow: {
        // Hard drop shadows — NO soft gaussian blurs
        'hard-accent': '4px 4px 0px #CCFF00',
        'hard-cyan': '4px 4px 0px #00FFFF',
        'hard-danger': '4px 4px 0px #FF3300',
        'hard-sm': '2px 2px 0px #CCFF00',
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
