import { createTool } from "@/lib/airtable";

const SEED_TOOLS = [
  {
    name: "Viktor",
    description: "An AI teammate that integrates directly into Slack or Teams, reading channel context and proactively taking work off your plate.",
    category: "AI Agent",
    releaseDate: "2026-09-22",
    url: "https://www.viktor.ai",
    icon: "🤖",
    createdAt: new Date().toISOString()
  },
  {
    name: "Granola AI",
    description: "A passive meeting transcription and summarization tool that records audio from your laptop locally without needing to join the virtual call.",
    category: "Productivity",
    releaseDate: "2026-09-22",
    url: "https://granola.ai",
    icon: "🎙️",
    createdAt: new Date().toISOString()
  },
  {
    name: "Google Flow",
    description: "An end-to-end multimedia and video generation platform capable of turning single images and text prompts into dynamic animations.",
    category: "Video Generation",
    releaseDate: "2026-09-22",
    url: "https://flow.google",
    icon: "🎬",
    createdAt: new Date().toISOString()
  },
  {
    name: "Claude Co-work",
    description: "An advanced desktop-automation agent built for handling long-document reasoning, file management, and repetitive tasks.",
    category: "Desktop Automation",
    releaseDate: "2026-09-22",
    url: "https://claude.ai/co-work",
    icon: "💻",
    createdAt: new Date().toISOString()
  },
  {
    name: "Lovable / Bolt",
    description: "Popular 'vibe-coding' platforms that let users build functional software applications purely through conversational prompts.",
    category: "No-Code",
    releaseDate: "2026-09-22",
    url: "https://lovable.dev",
    icon: "⚡",
    createdAt: new Date().toISOString()
  }
];

async function seed() {
  for (const tool of SEED_TOOLS) {
    try {
      await createTool(tool);
      console.log(`Created: ${tool.name}`);
    } catch (e: any) {
      console.error(`Failed: ${tool.name} - ${e.message}`);
    }
  }
}

seed().then(() => console.log("Seed complete")).catch(console.error);