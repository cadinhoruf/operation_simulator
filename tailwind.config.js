/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-green": "#8dc63f",
        "brand-green-dark": "#7ab33a",
      },
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
  // Otimizações para produção
  corePlugins: {
    // Desabilitar utilitários não utilizados
    preflight: true,
    container: false,
  },
  // Purge CSS para remover classes não utilizadas
  purge: {
    enabled: process.env.NODE_ENV === "production",
    content: ["./src/**/*.{js,ts,jsx,tsx}"],
    options: {
      safelist: [
        "brand-green",
        "bg-brand-green",
        "border-brand-green",
        "hover:bg-brand-green-dark",
        "focus:ring-brand-green",
      ],
    },
  },
};
