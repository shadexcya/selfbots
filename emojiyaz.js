import axios from 'axios';
import fs from 'fs';
import readline from 'readline';

// Emoji art templates for A-Z and space
const letterTemplates = {
    "a": [
        "  X  ",
        " X X ",
        "XXXXX",
        "X   X",
        "X   X"
    ],
    "b": [
        "XXXX ",
        "X   X",
        "XXXX ",
        "X   X",
        "XXXX "
    ],
    "c": [
        " XXX ",
        "X   X",
        "X    ",
        "X   X",
        " XXX "
    ],
    "d": [
        "XXXX ",
        "X   X",
        "X   X",
        "X   X",
        "XXXX "
    ],
    "e": [
        "XXXXX",
        "X    ",
        "XXX  ",
        "X    ",
        "XXXXX"
    ],
    "f": [
        "XXXXX",
        "X    ",
        "XXX  ",
        "X    ",
        "X    "
    ],
    "g": [
        " XXX ",
        "X    ",
        "X  XX",
        "X   X",
        " XXX "
    ],
    "h": [
        "X   X",
        "X   X",
        "XXXXX",
        "X   X",
        "X   X"
    ],
    "i": [
        " XXX ",
        "  X  ",
        "  X  ",
        "  X  ",
        " XXX "
    ],
    "j": [
        "  XXX",
        "   X ",
        "   X ",
        "X  X ",
        " XX  "
    ],
    "k": [
        "X   X",
        "X  X ",
        "XXX  ",
        "X  X ",
        "X   X"
    ],
    "l": [
        "X    ",
        "X    ",
        "X    ",
        "X    ",
        "XXXXX"
    ],
    "m": [
        "X   X",
        "XX XX",
        "X X X",
        "X   X",
        "X   X"
    ],
    "n": [
        "X   X",
        "XX  X",
        "X X X",
        "X  XX",
        "X   X"
    ],
    "o": [
        " XXX ",
        "X   X",
        "X   X",
        "X   X",
        " XXX "
    ],
    "p": [
        "XXXX ",
        "X   X",
        "XXXX ",
        "X    ",
        "X    "
    ],
    "q": [
        " XXX ",
        "X   X",
        "X   X",
        "X  XX",
        " XXXX"
    ],
    "r": [
        "XXXX ",
        "X   X",
        "XXXX ",
        "X  X ",
        "X   X"
    ],
    "s": [
        " XXXX",
        "X    ",
        " XXX ",
        "    X",
        "XXXX "
    ],
    "t": [
        "XXXXX",
        "  X  ",
        "  X  ",
        "  X  ",
        "  X  "
    ],
    "u": [
        "X   X",
        "X   X",
        "X   X",
        "X   X",
        " XXX "
    ],
    "v": [
        "X   X",
        "X   X",
        "X   X",
        " X X ",
        "  X  "
    ],
    "w": [
        "X   X",
        "X   X",
        "X X X",
        "XX XX",
        "X   X"
    ],
    "x": [
        "X   X",
        " X X ",
        "  X  ",
        " X X ",
        "X   X"
    ],
    "y": [
        "X   X",
        "X   X",
        " XXXX",
        "    X",
        " XXXX"
    ],
    "z": [
        "XXXXX",
        "   X ",
        "  X  ",
        " X   ",
        "XXXXX"
    ],
    " ": [
        "     ",
        "     ",
        "     ",
        "     ",
        "     "
    ]
};

// Function to convert text into emoji-based ASCII art
function convertTextToEmoji(text, emoji) {
    const lines = ["", "", "", "", ""];
    for (const char of text.toLowerCase()) {
        if (letterTemplates[char]) {
            for (let i = 0; i < 5; i++) {
                lines[i] += letterTemplates[char][i].replace(/X/g, emoji) + "  ";
            }
        }
    }
    return lines.join("\n");
}

// Function to send the emoji-based message to a Discord channel
async function sendEmojiMessage(token, channelId, emoji, text) {
    const emojiText = convertTextToEmoji(text, emoji);
    try {
        await axios.post(
            `https://discord.com/api/v9/channels/${channelId}/messages`,
            { content: emojiText },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log(`✅ Message successfully sent:\n${emojiText}`);
    } catch (error) {
        console.error(`❌ Error: ${error.response?.data?.message || error.message}`);
    }
}

// Function to prompt the user for input
async function promptForToken() {
    const filePath = "C:/Users/Shadex/Desktop/tokenlist.txt";
    const tokens = fs.readFileSync(filePath, 'utf-8').split('\n').filter(token => token.trim() !== "");

    if (tokens.length === 0) {
        console.log("❌ Token list is empty!");
        return null;
    }

    // Get usernames for the tokens
    const usernames = await Promise.all(tokens.map(async (token) => {
        try {
            const res = await axios.get('https://discord.com/api/v9/users/@me', {
                headers: { Authorization: `Bearer ${token.trim()}` }
            });
            return res.data.username;
        } catch (error) {
            console.error(`❌ Token error: ${error.response?.data?.message || error.message}`);
            return `Invalid token`;
        }
    }));

    console.log("Loaded tokens:");
    usernames.forEach((username, index) => {
        console.log(`${index + 1}: ${username}`);
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const tokenIndex = await new Promise((resolve) => {
        rl.question("Which token would you like to use? (1, 2, 3, ...): ", (answer) => {
            resolve(parseInt(answer) - 1);
            rl.close();
        });
    });

    if (tokenIndex < 0 || tokenIndex >= tokens.length) {
        console.log("❌ Invalid selection!");
        return null;
    }

    return tokens[tokenIndex].trim();
}

// Main function to run the script
(async () => {
    const token = await promptForToken();
    if (!token) return;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question("Enter the channel ID: ", (channelId) => {
        rl.question("Enter the emoji to use: ", (emoji) => {
            rl.question("Enter the text you want to convert to ASCII art: ", (text) => {
                sendEmojiMessage(token, channelId, emoji, text);
                rl.close();
            });
        });
    });
})();
