/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['Poppins', 'sans-serif'] },
      // TAMBAHKAN INI: Tampilan desktop akan muncul lebih cepat (mulai 600px)
      screens: {
        'md': '600px', 
      },
    },
  },
  plugins: [],
}