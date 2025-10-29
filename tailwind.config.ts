import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'selector',
  content: ["./src/pages/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}", "./src/app/**/*.{js,ts,jsx,tsx,mdx}", "./src/ui/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontSize: {
        "10xl": "9rem",
      },
      screens: {
        xs: "386px",
      },
      zIndex: {
        "1000": "1000",
        "1500": "1500",
      },
      backgroundImage: {
        body: "linear-gradient(119.14deg, #121A21 140.65%, #253041 140.65%)",
      },
      fontFamily: {
        sans: ["var(--aeonik)", "sans-serif"],
        grange: ["var(--grange)"],
      },
      colors: {
        background: "#000000",
        foreground: "#FFFFFF",
        neutral: {
          "50": "#fafaf9",
          "100": "#f5f5f4",
          "200": "#e6e6e5",
          "300": "#d4d4d3",
          "400": "#a2a2a2",
          "500": "#727272",
          "600": "#535353",
          "700": "#404040",
          "800": "#272727",
          "900": "#000000",
        },
        // DeCharge Blue Theme
        decharge: {
          "50": "#e6eeff",
          "100": "#b3ccff",
          "200": "#80aaff",
          "300": "#4d88ff",
          "400": "#1a66ff",
          "500": "#0044ff", // Main blue from the image
          "600": "#0033cc",
          "700": "#002299",
          "800": "#001166",
          "900": "#000033",
        },
        brand: {
          "50": "#e6eeff",
          "100": "#b3ccff",
          "200": "#80aaff",
          "300": "#4d88ff",
          "400": "#1a66ff",
          "500": "#0044ff",
          "600": "#0033cc",
          "700": "#002299",
          "800": "#001166",
          "900": "#000000",
        },
        highlight: {
          "50": "#e6eeff",
          "100": "#b3ccff",
          "200": "#80aaff",
          "300": "#4d88ff",
          "400": "#1a66ff",
          "500": "#0044ff",
          "600": "#0033cc",
          "700": "#002299",
          "800": "#001166",
          "900": "#000033",
        },
      },
      borderRadius: {
        sm: "0.0833rem",
        default: "0.1667rem",
        md: "0.25rem",
        lg: "0.5rem",
        xl: "0.875rem",
        "2xl": "1.1667rem",
        "3xl": "1.75rem",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        "glow-pulse": {
          "0%, 100%": {
            boxShadow: "0 0 20px #0044ff, 0 0 40px #0044ff, 0 0 60px #0044ff",
          },
          "50%": {
            boxShadow: "0 0 10px #0044ff, 0 0 20px #0044ff, 0 0 30px #0044ff",
          },
        },
        "text-glow": {
          "0%": {
            textShadow: "0 0 10px #0044ff, 0 0 20px #0044ff, 0 0 30px #0044ff",
          },
          "50%": {
            textShadow: "0 0 20px #0044ff, 0 0 30px #0044ff, 0 0 40px #0044ff",
          },
          "100%": {
            textShadow: "0 0 10px #0044ff, 0 0 20px #0044ff, 0 0 30px #0044ff",
          },
        },
        "slide-glow": {
          "0%": {
            transform: "translateX(-100%)",
            opacity: "0",
          },
          "10%": {
            opacity: "1",
          },
          "90%": {
            opacity: "1",
          },
          "100%": {
            transform: "translateX(100%)",
            opacity: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "text-glow": "text-glow 3s ease-in-out infinite",
        "slide-glow": "slide-glow 2s ease-in-out",
      },
    },
  },
  plugins: [require("tailwindcss-easing"), require("autoprefixer")],
};

export default config;
