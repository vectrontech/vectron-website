/**
 * Generate hero/visual assets for the Vectron site using Gemini's image model
 * (Nano Banana 2 / Nano Banana).
 *
 * Usage:
 *   GEMINI_API_KEY=sk-... npm run gen:images
 *
 * Notes:
 *   - Outputs PNGs to public/images/generated/<slug>.png
 *   - Commit the generated files. Build-time does NOT call the API.
 *   - Shared style suffix keeps all visuals coherent with the letterhead
 *     (dark obsidian, chromed, editorial, subtle teal signal glow).
 */

import { GoogleGenAI } from "@google/genai";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(__dirname, "..", "public", "images", "generated");

const STYLE_SUFFIX = [
  "dark obsidian background",
  "chromed / brushed-metal accents",
  "editorial photography, shallow depth of field",
  "subtle cool teal signal glow as a single accent color",
  "cinematic lighting, high-end industrial aesthetic",
  "3:2 aspect ratio, wide composition",
  "no text, no logos, no watermarks, no human faces",
].join(", ");

const compose = (p: string) => `${p}. Style: ${STYLE_SUFFIX}.`;

// Flowchart-specific style: overrides the default because we WANT readable labels.
const FLOWCHART_STYLE = [
  "clean architectural system diagram, editorial technical illustration",
  "dark obsidian background",
  "brushed-metal / chrome rectangular nodes with soft rim light",
  "thin flowing teal signal lines connecting nodes left to right",
  "node labels in a clean modern sans-serif, off-white text, legible but restrained",
  "premium, whitepaper-grade quality — feels like a diagram in a technical brief",
  "subtle blueprint grid in the background",
  "no logos, no watermarks, no human faces",
  "3:2 aspect ratio, wide composition",
].join(", ");

const flow = (p: string) => `${p}. Style: ${FLOWCHART_STYLE}.`;

const OG_STYLE = [
  "16:9 landscape composition exactly 1200x630 pixels",
  "dark obsidian background",
  "premium chrome and brushed metal aesthetic",
  "subtle teal signal accent",
  "leave generous empty negative space on the right side for headline overlay",
  "no text, no logos, no watermarks, no human faces",
].join(", ");

const IMAGES: { slug: string; prompt: string }[] = [
  {
    slug: "og",
    prompt:
      "An editorial dark hero composition: a brushed-aluminum precision-machined object on the left, dissolving into thin teal signal traces and chrome filaments that flow toward open dark space on the right. " +
      `Style: ${OG_STYLE}.`,
  },
  {
    slug: "home-hero",
    prompt: compose(
      "A single hero object: a precision-machined RF parabolic dish or phased-array antenna in brushed aluminum, " +
      "rendered as if it is partially dissolving into liquid chrome ribbons that flow and curl through the surrounding dark space. " +
      "The antenna is solid and engineered at its core, but its edges trail off into abstract mercury-like chrome filaments. " +
      "One soft teal radio-wave arc passes behind it as the only color accent. " +
      "Studio product photography lighting, shallow depth of field, single object positioned centered-right in frame. " +
      "Evokes the fusion of real RF engineering hardware with abstract signal and data flow."
    ),
  },
  {
    slug: "engineering-hero",
    prompt: flow(
      "A high-level AI-automation flowchart for an engineering firm, shown as connected nodes from left to right. " +
      "Six rectangular chrome nodes with these exact labels, in order: " +
      "'Requirements Doc', 'LLM Parse', 'Traceability Matrix', 'Simulation Run', 'Verification Report', 'Engineer Review'. " +
      "Arrows between each node are thin teal signal lines with small directional chevrons. " +
      "Two small branch nodes loop back from 'Engineer Review' to 'LLM Parse' to imply iteration. " +
      "Composed wide and cinematic, nodes occupy the middle band of the frame."
    ),
  },
  {
    slug: "sales-hero",
    prompt: flow(
      "A high-level AI-automation flowchart for a sales agency's outbound pipeline, shown as connected nodes from left to right. " +
      "Six rectangular chrome nodes with these exact labels, in order: " +
      "'Lead Source', 'Enrichment', 'AI Personalize', 'Send Sequence', 'Reply Handling', 'CRM Update'. " +
      "Arrows between each node are thin teal signal lines with small directional chevrons. " +
      "A small branch arrow from 'Reply Handling' loops back to 'Enrichment' to imply feedback. " +
      "Composed wide and cinematic, nodes occupy the middle band of the frame."
    ),
  },
  {
    slug: "rf-hero",
    prompt: compose(
      "Close-up macro of an RF front-end assembly: SMA connectors, brushed aluminum shielded enclosure, " +
      "precision PCB edges, faint RF waveform suggested by one soft teal arc of light in the background. " +
      "Looks like a real product you'd see in a lab, not a render."
    ),
  },
  {
    slug: "architecture-diagram",
    prompt: flow(
      "A clean hub-and-spoke architecture diagram. " +
      "At the very top center: one prominent rectangular brushed-chrome node labeled 'AI ORCHESTRATOR' with an 'AGENT' subtitle. " +
      "Below it, five vertical columns fan out, each headed by a category card: " +
      "'MEMORY', 'PRODUCTIVITY', 'RESEARCH', 'CONTENT', 'INTEGRATIONS'. " +
      "Each category card connects up to the orchestrator with a single thin teal vertical line. " +
      "Under each category card, three smaller chrome capsule nodes stacked vertically with these labels: " +
      "Memory column: 'Knowledge Base', 'Project Context', 'Auto Memory'. " +
      "Productivity column: 'Email Triage', 'Calendar', 'Docs and Sheets'. " +
      "Research column: 'Deep Research', 'Web Crawl', 'Vector Search'. " +
      "Content column: 'Outlines', 'Long Form', 'Short Form'. " +
      "Integrations column: 'CRM', 'Stripe', 'GitHub'. " +
      "At the very bottom, a single wide horizontal bar labeled 'AUTOMATION LAYER' with three small subtitles inside it: " +
      "'On Demand', 'Scheduled', 'Triggered'. " +
      "The automation bar connects upward to all five columns with thin dashed teal lines. " +
      "Composition: cinematic wide 3:2, generous spacing, dark obsidian background, soft teal glow on connection lines."
    ),
  },
];

const IMAGE_MIME = /^image\//;

async function generateOne(slug: string, prompt: string, model: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const client = new GoogleGenAI({ apiKey });
  console.log(`[gen] ${slug} → ${model}`);

  const response = await client.models.generateContent({
    model,
    contents: prompt,
    config: {
      responseModalities: ["IMAGE"],
    },
  });

  const parts = response?.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find(
    (p: any) => p?.inlineData?.data && IMAGE_MIME.test(p.inlineData.mimeType ?? "")
  );
  if (!imagePart?.inlineData?.data) {
    throw new Error(`No image data returned for "${slug}". Response: ${JSON.stringify(response).slice(0, 400)}`);
  }

  const bytes = Buffer.from(imagePart.inlineData.data, "base64");
  const outPng = resolve(OUT_DIR, `${slug}.png`);
  const outWebp = resolve(OUT_DIR, `${slug}.webp`);
  await writeFile(outPng, bytes);
  await sharp(bytes).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(outWebp);
  const pngKb = Math.round(bytes.byteLength / 1024);
  const { size: webpBytes } = await import("node:fs").then((m) => m.promises.stat(outWebp));
  const webpKb = Math.round(webpBytes / 1024);
  console.log(`[gen] ${slug} wrote ${pngKb}KB png, ${webpKb}KB webp`);
}

async function main() {
  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3-pro-image-preview";
  await mkdir(OUT_DIR, { recursive: true });

  const args = process.argv.slice(2);
  const filter = args.length > 0 ? new Set(args) : null;
  const work = filter ? IMAGES.filter((i) => filter.has(i.slug)) : IMAGES;

  if (filter && work.length === 0) {
    console.error(`No slugs matched. Available: ${IMAGES.map((i) => i.slug).join(", ")}`);
    process.exit(1);
  }

  for (const { slug, prompt } of work) {
    try {
      await generateOne(slug, prompt, model);
    } catch (err) {
      console.error(`[gen] FAILED ${slug}:`, err instanceof Error ? err.message : err);
      process.exitCode = 1;
    }
  }

  console.log(`[gen] done. Output: ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
