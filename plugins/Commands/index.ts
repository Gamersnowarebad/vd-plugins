import { findByProps } from "@vendetta/metro";
import { showToast } from "@vendetta/ui/toasts";
import { getAssetIDByName } from "@vendetta/ui/assets";

const MessageActions = findByProps("sendMessage");
const messageUtil = findByProps("sendBotMessage", "sendMessage", "receiveMessage");

interface NekosLifeResult {
    url: string;
}

// Valid SFW categories
const validSfwCategories = [
    "avatar", "classic", "cuddle", "fox_girl", "gecg", "holo",
    "kemonomimi", "kiss", "neko", "ngif", "smug", "spank",
    "tickle", "waifu", "wallpaper", "woof"
];

async function fetchNekosLifeImages(category: string, count: number): Promise<string[]> {
    const urls: string[] = [];

    for (let i = 0; i < count; i++) {
        try {
            if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            const response = await fetch(`https://nekos.life/api/v2/img/${category}`);
            if (!response.ok) {
                console.error(`[NekosLife] API request failed: ${response.status}`);
                continue;
            }

            const data: NekosLifeResult = await response.json();
            if (data.url) {
                urls.push(data.url);
            }
        } catch (error) {
            console.error(`[NekosLife] Error fetching image ${i + 1}:`, error);
        }
    }

    return urls;
}

export const nekoslifeCommand = {
    name: "nekoslife",
    displayName: "nekoslife",
    description: "Get SFW images/gifs from nekos.life",
    displayDescription: "Get SFW images/gifs from nekos.life",
    options: [
        {
            name: "category",
            displayName: "category",
            description: "Choose a category",
            displayDescription: "Choose a category",
            type: 3, // String
            required: true,
            // This creates the dropdown menu
            choices: validSfwCategories.map(cat => ({
                name: cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " "),
                displayName: cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " "),
                value: cat
            }))
        },
        {
            name: "limit",
            displayName: "limit",
            description: "Number of images (1-5, default: 1)",
            displayDescription: "Number of images (1-5, default: 1)",
            type: 4, // Integer
            required: false,
        },
        {
            name: "send",
            displayName: "send",
            description: "Send to chat",
            displayDescription: "Send to chat",
            type: 5, // Boolean
            required: false,
        },
        {
            name: "ephemeral",
            displayName: "ephemeral",
            description: "Send as ephemeral message (only you can see)",
            displayDescription: "Send as ephemeral message (only you can see)",
            type: 5, // Boolean
            required: false,
        }
    ],
    execute: async (args: any, ctx: any) => {
        try {
            const category = args.find((arg: any) => arg.name === "category")?.value;
            const limitInput = args.find((arg: any) => arg.name === "limit")?.value;
            const shouldSend = args.find((arg: any) => arg.name === "send")?.value || false;
            const isEphemeral = args.find((arg: any) => arg.name === "ephemeral")?.value || false;

            if (!category) return; // Dropdown ensures we get a valid value

            let limit = 1;
            if (limitInput !== undefined) {
                limit = Math.max(1, Math.min(5, parseInt(String(limitInput)) || 1));
            }

            if (!isEphemeral) {
                showToast(`Fetching ${limit} ${category} image(s)...`, getAssetIDByName("DownloadIcon"));
            }

            const urls = await fetchNekosLifeImages(category, limit);

            if (urls.length === 0) {
                const errorMsg = "❌ Failed to fetch images.";
                if (isEphemeral) return { type: 4, data: { content: errorMsg, flags: 64 } };
                showToast(errorMsg, getAssetIDByName("CircleXIcon"));
                return null;
            }

            const content = urls.join("\n");

            if (isEphemeral) {
                return { type: 4, data: { content, flags: 64 } };
            } else if (shouldSend) {
                MessageActions.sendMessage(ctx.channel.id, { content }, void 0, { nonce: Date.now().toString() });
                return null;
            } else {
                messageUtil.sendBotMessage(ctx.channel.id, content);
                return null;
            }
        } catch (error) {
            console.error("[NekosLife] Command error:", error);
            return null;
        }
    },
    applicationId: "-1",
    inputType: 1,
    type: 1,
};
