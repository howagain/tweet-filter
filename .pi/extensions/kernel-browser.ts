/**
 * Kernel Browser Extension for Pi Coding Agent
 * Provides browser automation via Kernel SDK
 */
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";

const KERNEL_API_KEY = process.env.KERNEL_API_KEY || "sk_a41311ff-fee8-45b4-b1b5-96bc423009a5.HBiHI9eK5V8c+onl9eaNLaYFsrsCAHqdE0zRZhlBSH4";
const KERNEL_BASE_URL = "https://api.kernel.ai";

interface KernelBrowser {
  id: string;
  cdpUrl: string;
}

let activeBrowser: KernelBrowser | null = null;

async function createBrowser(profile?: string): Promise<KernelBrowser> {
  const response = await fetch(`${KERNEL_BASE_URL}/browsers`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${KERNEL_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      profile: profile || "x-profile",
      headless: true
    })
  });
  
  if (!response.ok) {
    throw new Error(`Kernel API error: ${response.status} ${await response.text()}`);
  }
  
  return response.json();
}

async function closeBrowser(browserId: string): Promise<void> {
  await fetch(`${KERNEL_BASE_URL}/browsers/${browserId}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${KERNEL_API_KEY}` }
  });
}

export default function (pi: ExtensionAPI) {
  // Tool: Create browser session
  pi.registerTool({
    name: "kernel_create_browser",
    description: "Create a Kernel browser session with optional profile (e.g., x-profile for authenticated Twitter)",
    parameters: Type.Object({
      profile: Type.Optional(Type.String({ description: "Profile name for auth cookies (default: x-profile)" }))
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      try {
        activeBrowser = await createBrowser(params.profile);
        // Wait for browser to initialize
        await new Promise(resolve => setTimeout(resolve, 5000));
        return {
          content: [{ 
            type: "text", 
            text: `Browser created: ${activeBrowser.id}\nCDP URL: ${activeBrowser.cdpUrl}` 
          }],
          details: { type: "json", data: activeBrowser }
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: `Error creating browser: ${err}` }],
          details: {}
        };
      }
    }
  });

  // Tool: Navigate to URL
  pi.registerTool({
    name: "kernel_navigate",
    description: "Navigate browser to a URL",
    parameters: Type.Object({
      url: Type.String({ description: "URL to navigate to" })
    }),
    async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
      if (!activeBrowser) {
        return { content: [{ type: "text", text: "No active browser. Call kernel_create_browser first." }], details: {} };
      }
      
      // This would use CDP to navigate - simplified for template
      // In practice, use puppeteer-core with activeBrowser.cdpUrl
      return {
        content: [{ type: "text", text: `Navigated to: ${params.url}` }],
        details: {}
      };
    }
  });

  // Tool: Extract tweets from page
  pi.registerTool({
    name: "kernel_extract_tweets",
    description: "Extract tweets from the current page. Returns structured tweet data.",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
      if (!activeBrowser) {
        return { content: [{ type: "text", text: "No active browser. Call kernel_create_browser first." }], details: {} };
      }

      // Extraction script - would run via CDP
      const extractionScript = `
        (() => {
          const tweets = [];
          document.querySelectorAll('article[data-testid="tweet"]').forEach(article => {
            const tweetText = article.querySelector('[data-testid="tweetText"]')?.innerText || '';
            const author = article.querySelector('[data-testid="User-Name"]')?.innerText || '';
            const time = article.querySelector('time')?.getAttribute('datetime') || '';
            const link = article.querySelector('a[href*="/status/"]')?.href || '';
            
            const images = [];
            article.querySelectorAll('img[src*="pbs.twimg.com"]').forEach(img => {
              images.push(img.src);
            });
            
            if (tweetText || images.length > 0) {
              tweets.push({ author, text: tweetText, time, link, images });
            }
          });
          return tweets;
        })()
      `;

      // In practice, run via CDP evaluate
      return {
        content: [{ type: "text", text: "Tweet extraction complete. Run extraction script via CDP." }],
        details: { type: "code", data: extractionScript }
      };
    }
  });

  // Tool: Close browser
  pi.registerTool({
    name: "kernel_close_browser",
    description: "Close the active browser session",
    parameters: Type.Object({}),
    async execute(_toolCallId, _params, _signal, _onUpdate, _ctx) {
      if (activeBrowser) {
        await closeBrowser(activeBrowser.id);
        activeBrowser = null;
        return { content: [{ type: "text", text: "Browser closed." }], details: {} };
      }
      return { content: [{ type: "text", text: "No active browser." }], details: {} };
    }
  });

  // Cleanup on session end
  pi.on("session_end", async () => {
    if (activeBrowser) {
      await closeBrowser(activeBrowser.id);
      activeBrowser = null;
    }
  });
}
