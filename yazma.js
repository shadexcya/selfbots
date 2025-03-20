const { Client } = require('discord.js-selfbot-v13');
const fs = require('fs');
const readline = require('readline');
const chalk = require('chalk');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let tokens = []; // Token listesi burada tutulacak
let selectedTokens = []; // Seçilen tokenlar burada tutulacak
let selectedChannelIDs = []; // Seçilen kanal ID'leri burada tutulacak
let typingDuration = null; // Yazma süresi

// Tokenları dosyadan al
function loadTokensFromFile() {
    return new Promise((resolve, reject) => {
        fs.readFile('C:\\Users\\Shadex\\Desktop\\tokenlist.txt', 'utf8', (err, data) => {
            if (err) {
                reject(chalk.red('Token dosyasını okurken hata oluştu! Bot kapanıyor.'));
                rl.close();
                return;
            }
            tokens = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            if (tokens.length === 0) {
                reject(chalk.red('Geçerli bir token bulunamadı! Bot kapanıyor.'));
                rl.close();
                return;
            }
            console.log(chalk.green('Token\'lar dosyadan alındı.'));
            resolve();
        });
    });
}

// Kullanıcı adlarını almak için tokenler ile giriş yapma
async function getTokenUsernames(tokens) {
    const userInfo = [];

    for (const token of tokens) {
        const client = new Client();
        try {
            await client.login(token);
            userInfo.push({ token, username: client.user.tag });
            client.destroy(); // Bağlantıyı kapat
        } catch (error) {
            console.error(chalk.red(`❌ Token ile kullanıcı alınırken hata oluştu: ${error.message}`));
        }
    }

    return userInfo;
}

// Tokenları ve kullanıcı adlarını listeleme
async function listTokens(tokens) {
    const tokenUsers = await getTokenUsernames(tokens);

    console.log(chalk.yellow('Mevcut Token\'lar ve Kullanıcı Adları:'));

    if (tokenUsers.length > 0) {
        tokenUsers.forEach((user, index) => {
            console.log(chalk.cyan(`${index + 1}: ${user.username}`));
        });

        return tokenUsers;
    } else {
        console.log(chalk.red('Geçerli bir token bulunamadı!'));
        rl.close();
        return null;
    }
}

// Kullanıcıdan birden fazla token seçme
async function selectTokens() {
    const tokenUsers = await listTokens(tokens);

    if (tokenUsers === null) return;

    return new Promise((resolve, reject) => {
        rl.question(chalk.green('Birden fazla token seçmek için token numaralarını virgülle ayırarak girin: '), (selectedIndexes) => {
            const indexes = selectedIndexes.split(',').map(index => parseInt(index.trim()) - 1);
            if (indexes.some(index => index < 0 || index >= tokenUsers.length)) {
                reject(chalk.red('Geçersiz seçim!'));
                rl.close();
                return;
            }
            selectedTokens = indexes.map(index => tokenUsers[index].token);
            console.log(chalk.green(`Seçilen Token(lar): ${selectedTokens.map(token => tokenUsers.find(user => user.token === token).username).join(', ')}`));
            resolve();
        });
    });
}

// Kullanıcıdan birden fazla kanal ID'si seçme
async function selectChannelIDs() {
    return new Promise((resolve) => {
        rl.question(chalk.green('Birden fazla kanal ID\'si girin (Virgülle ayırarak): '), (channelIDs) => {
            selectedChannelIDs = channelIDs.split(',').map(id => id.trim());
            console.log(chalk.green(`Seçilen Kanal ID'leri: ${selectedChannelIDs.join(', ')}`));
            resolve();
        });
    });
}

// Yazma süresi seçme
async function selectTypingDuration() {
    return new Promise((resolve) => {
        rl.question(chalk.green('Yazma göstergesi ne kadar süre aktif olsun? (Dakika cinsinden): '), (duration) => {
            typingDuration = parseInt(duration.trim()) * 60 * 1000; // Dakikayı milisaniyeye çevir
            resolve();
        });
    });
}

// Botu başlatma fonksiyonu
async function startBot() {
    try {
        // Token ve kanal bilgilerini seç
        await loadTokensFromFile();
        await selectTokens();
        await selectChannelIDs();
        await selectTypingDuration();

        console.log('Bot başlatılıyor...');

        // Her bir token için bot başlat
        selectedTokens.forEach(async (token) => {
            const client = new Client();
            await client.login(token); // Seçilen token ile giriş yap

            // Kendi hata işleme
            client.on('error', (err) => {
                console.error('Bot hata aldı:', err);
                restartBot(); // Hata olursa yeniden başlat
            });

            client.on('ready', () => {
                console.log(`Bot hazır! (${client.user.tag})`);
            });

            // Kanalda yazma göstergesi aktif et
            client.on('messageCreate', async (message) => {
                if (selectedChannelIDs.includes(message.channel.id)) {
                    client.channels.cache.get(message.channel.id).sendTyping();
                }
            });

            // Yazma göstergesini sürekli gönder
            console.log(chalk.green(`${client.user.tag} için yazma göstergesi ${typingDuration / 60000} dakika boyunca aktif olacak!`));

            // Süre boyunca sürekli yazma göstergesi gösterilecek
            setTimeout(() => {
                console.log(chalk.green(`${client.user.tag} için yazma göstergesi süresi bitti.`));
                client.destroy(); // Botu kapat
            }, typingDuration);

            // Süre boyunca sürekli olarak yazma göstergesi gösterelim
            const typingInterval = setInterval(() => {
                selectedChannelIDs.forEach(channelID => {
                    client.channels.cache.get(channelID).sendTyping();
                });
            }, 1000); // 1 saniyede bir sürekli yazma göstergesi
        });

    } catch (err) {
        console.log(chalk.red('Hata oluştu:', err));
        restartBot(); // Hata olursa yeniden başlat
    }
}

// Botu yeniden başlatma
function restartBot() {
    console.log(chalk.yellow('Bot yeniden başlatılıyor...'));
    setTimeout(() => {
        process.exit(1); // Botu kapat
    }, 1000);
}

// İlk başlatma
startBot();
