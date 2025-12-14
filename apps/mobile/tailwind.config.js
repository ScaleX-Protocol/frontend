/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#E0E0E0',
        card: '#0A0A0A',
        'card-foreground': '#E0E0E0',
        primary: '#676FFF',
        'primary-foreground': '#FFFFFF',
        secondary: '#1A1A1A',
        'secondary-foreground': '#E0E0E0',
        muted: '#1F1F1F',
        'muted-foreground': '#9CA3AF',
        accent: '#676FFF',
        'accent-foreground': '#FFFFFF',
        destructive: '#EF4444',
        'destructive-foreground': '#FFFFFF',
        border: '#1F2937',
        input: '#1F2937',
        ring: '#676FFF',
      },
    },
  },
  plugins: [],
}
