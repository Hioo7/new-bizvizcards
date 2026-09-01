// For Storybook (Vite) — processes src/global.css through Tailwind v3 so the
// bizviz `:root` vars + utility classes are available to react-native-web.
module.exports = {
  plugins: {
    tailwindcss: { config: "./tailwind.config.js" },
    autoprefixer: {},
  },
};
