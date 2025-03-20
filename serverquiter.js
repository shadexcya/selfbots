const fs = require("fs");
const readline = require("readline");
const chalk = require("chalk");
const { Client } = require("discord.js-selfbot-v13");

// Tokenlerin bulunduğu dosya
const tokenFilePath = "C:\\Users\\Shadex\\Desktop\\tokenlist.txt";

// Tokenları dosyadan çekme
function loadTokensFromFile() {
    return new Promise((resolve, reject) => {
        fs.readFile(tokenFilePath, "utf8", (err, data) => {
            if (err) {
                reject(chalk.red("Token dosyasını okurken hata oluştu! Bot kapanıyor."));
                return;
            }
            const tokens = data.split("\n").map(line => line.trim()).filter(line => line.length > 0);
            if (tokens.length === 0) {
                reject(chalk.red("Geçerli bir token bulunamadı! Bot kapanıyor."));
                return;
            }
            console.log(chalk.green("Token'lar dosyadan alındı."));
            resolve(tokens);
        });
    });
}

// Token'ları listeleme
async function listTokens(tokens) {
    console.log(chalk.yellow("Mevcut Token'lar ve Kullanıcı Adları:"));

    const tokenUsers = await Promise.all(tokens.map(async (token) => {
        const tempClient = new Client();
        try {
            await tempClient.login(token);
            const username = tempClient.user.tag;
            tempClient.destroy();
            return { token, username };
        } catch (error) {
            console.error(chalk.red(`❌ Token ile kullanıcı alınırken hata oluştu: ${error.message}`));
            return null;
        }
    }));

    const validUsers = tokenUsers.filter(user => user !== null);

    validUsers.forEach((user, index) => {
        console.log(chalk.cyan(`${index + 1}: ${user.username}`));
    });

    if (validUsers.length === 0) {
        console.log(chalk.red("Geçerli bir token bulunamadı!"));
        return;
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(chalk.green("Birden fazla kullanıcı seçin (örnek: 1, 2): "), (selectedIndexes) => {
        const selectedIndices = selectedIndexes.split(",").map(idx => parseInt(idx.trim()) - 1);
        const selectedUsers = selectedIndices.map(idx => validUsers[idx]).filter(user => user);
        
        if (selectedUsers.length > 0) {
            console.log(chalk.green(`Seçilen Kullanıcılar: ${selectedUsers.map(user => user.username).join(", ")}`));
            rl.question(chalk.green("Hariç tutulacak sunucu ID'lerini virgülle ayırarak girin: "), (serverIds) => {
                const excludedServers = serverIds.split(",").map(id => id.trim());
                quitFromServers(selectedUsers.map(user => user.token), excludedServers);
                rl.close();
            });
        } else {
            console.log(chalk.red("Geçersiz seçim!"));
            rl.close();
        }
    });
}

// Sunuculardan çıkma işlemi
async function quitFromServers(tokens, excludedServers) {
    for (const token of tokens) {
        const client = new Client();
        try {
            await client.login(token);
            console.log(chalk.green(`Giriş yapıldı: ${client.user.tag}`));
            const guilds = client.guilds.cache;
            console.log(`Toplam ${guilds.size} sunucu bulundu.`);
            
            for (const [id, guild] of guilds) {
                if (excludedServers.includes(id)) {
                    console.log(chalk.yellow(`Hariç tutulan sunucu: ${guild.name} (${id})`));
                    continue;
                }
                console.log(`Çıkılıyor: ${guild.name} (${id})`);
                await guild.leave();
            }
            console.log(chalk.green("İşlem tamamlandı!"));
        } catch (err) {
            console.log(chalk.red(`Hata oluştu: ${err.message}`));
        } finally {
            client.destroy();
        }
    }
}

// Programı başlat
(async function start() {
    try {
        const tokens = await loadTokensFromFile();
        await listTokens(tokens);
    } catch (err) {
        console.error(err);
    }
})();
