import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://vectrontechnologies.com',
  integrations: [
    sitemap({
      // /RFtrueLink/ is shipped from public/, so the integration would
      // otherwise miss it. Bump priority on the RF consulting service
      // page — that's the page we want ranking for the target keywords.
      customPages: [
        "https://vectrontechnologies.com/RFtrueLink/",
      ],
      serialize(item) {
        if (item.url === "https://vectrontechnologies.com/") {
          item.priority = 1.0;
          item.changefreq = "monthly";
        } else if (item.url === "https://vectrontechnologies.com/services/rf-electromagnetics/") {
          item.priority = 0.9;
          item.changefreq = "monthly";
        } else if (item.url === "https://vectrontechnologies.com/RFtrueLink/") {
          item.priority = 0.8;
          item.changefreq = "monthly";
        } else {
          item.priority = item.priority ?? 0.6;
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    format: 'directory',
  },
});
