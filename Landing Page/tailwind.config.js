module.exports = {
  darkMode: 'class',
  content: [
    "./*.html",
    "./scss/**/*.scss",
    "./node_modules/preline/dist/*.js"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Schibsted Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        grey: {
          50: "#e9e9e9",
          100: "#d3d3d3",
          200: "#bcbcbc",
          300: "#a6a6a6",
          400: "#909090",
          500: "#7a7a7a",
          600: "#646464",
          700: "#4d4d4d",
          800: "#373737",
          900: "#212121",
        },
      },
      borderRadius: {
        'none': '0',
        'sm': '0.125rem',
        'DEFAULT': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
        'full': '9999px',
      },
      boxShadow: {
        'soft': '0 2px 4px 0 rgba(0, 0, 0, 0.05)',
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'sidebar': '4px 0 6px -1px rgba(0, 0, 0, 0.1)',
      },
      transitionDuration: {
        '250': '250ms',
        '350': '350ms',
      },
    },
  },
  plugins: [
    require('preline/plugin'),
  ],
}
