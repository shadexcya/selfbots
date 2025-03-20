const Discord = require('discord.js-selfbot-v13');
const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let tokens = [];
let userIds = [];
let channelId = null;
let serverId = null;
let userReplies = [];
let selectedToken = null;
let copyMode = false;
let replyMode = false;
let replyInterval = null;
let duration = 0; // süreyi dakika cinsinden saklayacağız

console.log(chalk.hex('#FFD700').bold('-------'));
console.log(chalk.white.italic('Shadex AutoReply SelfBot v1.7'));
console.log(chalk.hex('#FFD700').bold('-------'));

function loadTokensFromFile() {
    return new Promise((resolve, reject) => {
        fs.readFile('C:\\Users\\Shadex\\Desktop\\tokenlist.txt', 'utf8', (err, data) => {
            if (err) {
                reject(chalk.red('Token dosyasını okurken hata oluştu!'));
                rl.close();
                return;
            }
            tokens = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            if (tokens.length === 0) {
                reject(chalk.red('Geçerli bir token bulunamadı!'));
                rl.close();
                return;
            }
            console.log(chalk.green("Token'lar dosyadan alındı."));
            resolve();
        });
    });
}

async function listTokens(tokens) {
    console.log(chalk.yellow("Mevcut Token'lar ve Kullanıcı Adları:"));
    const tokenUsers = await Promise.all(tokens.map(async (token) => {
        const tempClient = new Discord.Client();
        try {
            await tempClient.login(token);
            const username = tempClient.user.tag;
            tempClient.destroy();
            return { token, username };
        } catch (error) {
            return null;
        }
    }));

    const validUsers = tokenUsers.filter(user => user !== null);
    validUsers.forEach((user, index) => {
        console.log(chalk.cyan(`${index + 1}: ${user.username}`));
    });

    rl.question(chalk.green('Bir kullanıcı seçin: '), (selectedIndex) => {
        const selectedIdx = parseInt(selectedIndex.trim()) - 1;
        const selectedUser = validUsers[selectedIdx];

        if (selectedUser) {
            selectedToken = selectedUser.token;
            askUserIds();
        } else {
            console.log(chalk.red('Geçersiz seçim!'));
            rl.close();
        }
    });
}

function askUserIds() {
    rl.question(chalk.blue("Yanıt verilecek kullanıcı ID'lerini girin (boş bırak = kanal ID soracak): "), (userIdsInput) => {
        if (userIdsInput.trim()) {
            userIds = userIdsInput.split(',').map(id => id.trim());
            askReplyMode();
        } else {
            askChannelId();
        }
    });
}

function askChannelId() {
    rl.question(chalk.blue("Yanıt verilecek kanal ID'sini girin (boş bırak = sunucu ID soracak): "), (input) => {
        if (input.trim()) {
            channelId = input.trim();
            askReplyMode();
        } else {
            askServerId();
        }
    });
}

function askServerId() {
    rl.question(chalk.blue("Yanıt verilecek sunucu ID'sini girin (boş bırak = tüm sunucular): "), (input) => {
        if (input.trim()) {
            serverId = input.trim();
        }
        askReplyMode();
    });
}

function askReplyMode() {
    rl.question(chalk.green("Yanıt modunu seçin (1: Yeni mesaj, 2: Hazır reply, 3: Kopyalama modu, 4: Oto-Reply): "), (mode) => {
        if (mode === '1') {
            askNewMessage(); // Yeni mesaj seçeneği geldiğinde sadece mesaj iste
        } else if (mode === '2') {
            askReplyFile(); // Hazır reply seçeneği seçilirse yanıt dosyasını iste
        } else if (mode === '3') {
            copyMode = true;
            console.log(chalk.green('Kopyalama modu aktif!'));
            askDuration();
        } else {
            console.log(chalk.red('Geçersiz seçenek!'));
            rl.close();
        }
    });
}

function askNewMessage() {
    rl.question(chalk.green("Yeni mesajınızı yazın: "), (newMessage) => {
        if (!newMessage.trim()) {
            console.log(chalk.red("Mesaj boş olamaz!"));
            return askNewMessage(); // Eğer boş girildiyse tekrar iste
        }

        userReplies = [newMessage]; // Kullanıcının yazdığı mesajı yanıtlar listesine ekle
        console.log(chalk.green("Yeni mesaj başarıyla alındı!"));
        askDuration(); // Yeni mesaj alındıktan sonra sıralama sormadan direkt süreyi iste
    });
}

function askReplyFile() {
    const repliesDir = 'C:\\Users\\Shadex\\Desktop\\replies'; // Belirttiğiniz dizin

    fs.readdir(repliesDir, (err, files) => {
        if (err) {
            console.log(chalk.red("Yanıt dosyaları okunamadı!"));
            rl.close();
            return;
        }

        // Sadece .txt dosyalarını alalım
        const txtFiles = files.filter(file => file.endsWith('.txt'));

        if (txtFiles.length === 0) {
            console.log(chalk.red("Hiçbir .txt dosyası bulunamadı!"));
            rl.close();
            return;
        }

        console.log(chalk.yellow("Yanıt dosyaları:"));
        txtFiles.forEach((file, index) => {
            console.log(chalk.cyan(`${index + 1}: ${file}`));
        });

        rl.question(chalk.green('Bir yanıt dosyası seçin: '), (selectedIndex) => {
            const selectedIdx = parseInt(selectedIndex.trim()) - 1;
            const selectedFile = txtFiles[selectedIdx];

            if (selectedFile) {
                const filePath = path.join(repliesDir, selectedFile);
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                        console.log(chalk.red("Yanıt dosyası okunamadı!"));
                        rl.close();
                        return;
                    }

                    userReplies = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
                    askOrder();
                });
            } else {
                console.log(chalk.red('Geçersiz seçim!'));
                rl.close();
            }
        });
    });
}

function askOrder() {
    rl.question(chalk.green("Yanıtları sıralı mı yoksa rastgele mi göndermek istersiniz? (1: Sıralı, 2: Rastgele): "), (orderChoice) => {
        if (orderChoice === '1') {
            askDuration(true); // Sıralı yanıt
        } else if (orderChoice === '2') {
            askDuration(false); // Rastgele yanıt
        } else {
            console.log(chalk.red('Geçersiz seçenek!'));
            rl.close();
        }
    });
}

function askDuration(isOrdered) {
    rl.question(chalk.green('Yanıtları ne kadar süreyle göndermek istersiniz? (Dakika cinsinden, 0 = sınırsız): '), (time) => {
        if (time.trim() === '0') {
            duration = Infinity;  // Sonsuz süre
            console.log(chalk.green('Sınırsız süre seçildi.'));
        } else {
            duration = parseInt(time) * 60 * 1000; // Dakika cinsinden süreyi milisaniyeye çeviriyoruz
            if (isNaN(duration) || duration <= 0) {
                console.log(chalk.red('Geçersiz süre!'));
                rl.close();
                return;
            }
        }
        startBot(isOrdered); // Süreyi aldıktan sonra botu başlatıyoruz
    });
}


function startBot(isOrdered) {
    const client = new Discord.Client();
    client.login(selectedToken).catch(err => console.error(chalk.red(`❌ Selfbot giriş hatası: ${err.message}`)));

    client.on('ready', () => {
        console.log(chalk.green(`✅ Kullanıcı: ${client.user.tag} giriş yaptı!`));
        startReplying(isOrdered, client);
    });
}

function startReplying(isOrdered, client) {
    const startTime = Date.now();

    client.on('messageCreate', async (message) => {
        if (message.author.bot || message.author.id === client.user.id) return;

        // Kanal ID'sini kontrol etme
        if (channelId && message.channel.id !== channelId) {
            return; // Kanal ID'si eşleşmiyorsa işlem yapılmaz
        }

        // Kullanıcı ID'lerini kontrol etme
        if (userIds.length === 0 || userIds.includes(message.author.id)) {
            let replyMessage = '';

            if (copyMode) {
                // Kopyalama modunda, gelen mesajı al
                replyMessage = message.content.trim();
                if (!replyMessage) {
                    console.log(chalk.red('❌ Boş mesaj! Kopyalanan mesaj içeriği boş.'));
                    return; // Eğer mesaj boşsa yanıt vermeyelim
                }
            } else {
                // Sıralı veya rastgele yanıt durumunda
                replyMessage = isOrdered ? userReplies.shift() : userReplies[Math.floor(Math.random() * userReplies.length)];
                if (!replyMessage) {
                    console.log(chalk.red('❌ Yanıt boş! Yanıt verilecek içerik bulunamadı.'));
                    return;
                }
                if (isOrdered) userReplies.push(replyMessage); // Sıralı yanıt modunda, yanıtı sona ekleyelim
            }

            try {
                await message.reply(replyMessage);  // Yanıt gönderme
                console.log(chalk.green(`✅ Yanıt verildi: [${message.author.tag}] - [${message.guild?.name} - #${message.channel.name || 'DM'}] : ${message.content}`));
            } catch (error) {
                console.error(chalk.red(`❌ Yanıt gönderme hatası: ${error.message}`));
            }
        }
    });

    // Reply döngüsünü başlatıyoruz
    replyInterval = setInterval(() => {
        if (isOrdered && userReplies.length === 0) {
            reloadReplies(isOrdered);
        }
    }, 5000);
}

function reloadReplies(isOrdered) {
    if (userReplies.length === 0) {
        console.log(chalk.red("Yanıtlar tükenmiş. Lütfen yeni yanıtlar girin."));
        rl.close();
    }
}

loadTokensFromFile().then(() => listTokens(tokens)).catch((error) => {
    console.error(error);
    rl.close();
});
