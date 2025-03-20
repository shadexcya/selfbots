import { Client } from 'discord.js';
import readline from 'readline';
import chalk from 'chalk';
import fs from 'fs';

// Read tokens from the file
const tokens = fs.readFileSync("C:/Users/Shadex/Desktop/tokenlist.txt", 'utf-8').split('\n').filter(token => token.trim() !== '');

// Set up readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// ASCII letter templates for emoji-based art
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

// Function to convert text into emoji ASCII art
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

// Tokenleri listele ve kullanıcı seçimi al
async function listTokens() {
    console.log(chalk.yellow('Mevcut Token\'lar ve Kullanıcı Adları:'));

    // Tokenlerin doğruluğunu kontrol etmek için her tokenla giriş yapmayı dene
    const clients = tokens.map(token => {
        const client = new Client();
        client.login(token).catch(() => console.log(chalk.red(`❌ Geçersiz token: ${token}`)));
        return { client, token };
    });

    setTimeout(() => {
        // Geçerli client'ları filtrele
        const validClients = clients.filter(({ client }) => client.user);
        
        // Geçerli client'ları yazdır
        validClients.forEach(({ client }, index) => {
            console.log(chalk.cyan(`${index + 1}: ${client.user.username}`));
        });

        if (validClients.length === 0) {
            console.log(chalk.red('Geçerli bir token bulunamadı!'));
            rl.close();
            return;
        }

        // Kullanıcıdan hangi tokeni seçmek istediğini sor
        rl.question(chalk.green('Kullanılacak tokenleri seçin (örnek: 1,2,3): '), (selectedIndexes) => {
            const selectedIndices = selectedIndexes.split(',').map(idx => parseInt(idx.trim()) - 1);
            const selectedClients = selectedIndices.map(idx => validClients[idx]).filter(client => client);

            if (selectedClients.length > 0) {
                console.log(chalk.green(`Seçilen Kullanıcılar: ${selectedClients.map(({ client }) => client.user.username).join(', ')}`));
                // Seçilen client'larla işlem yapmaya başla
                getEmojiAndText(selectedClients);
            } else {
                console.log(chalk.red('Geçersiz seçim!'));
                rl.close();
            }
        });
    }, 3000); // Tokenlerin giriş yapmasını beklemek için
}

// Kullanıcıdan emoji ve metin alın, ardından mesajı gönder
function getEmojiAndText(selectedClients) {
    rl.question(chalk.green('Bir emoji seçin (örnek: 😄🔥): '), (emoji) => {
        rl.question(chalk.green('Yazılacak metni girin: '), (text) => {
            selectedClients.forEach(({ client }) => {
                const emojiText = convertTextToEmoji(text, emoji);
                // Burada mesajı gönderebilirsiniz
                console.log(`Mesaj gönderiliyor: \n${emojiText}`);
                // client.channels.cache.get('CHANNEL_ID').send(emojiText); // Gerçek gönderim
            });
            rl.close();
        });
    });
}

// Başlatmak için
listTokens();
