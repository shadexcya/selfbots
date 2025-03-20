const Discord = require('discord.js-selfbot-v13');
const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let tokens = [];
let channelIds = [];
let selectedEmoji = null;  // Seçilen emoji burada tutulacak
let reactedMessages = new Set();  // Eklenen tepkiler için bir set

console.log(chalk.hex('#FFD700').bold('-------'));
console.log(chalk.white.italic('Shadex AutoReact SelfBot v1.6'));
console.log(chalk.hex('#FFD700').bold('-------'));

// Tokenları dosyadan çekme
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

// Token'ları listeleme
async function listTokens(tokens) {
    console.log(chalk.yellow('Mevcut Token\'lar ve Kullanıcı Adları:'));

    const tokenUsers = await Promise.all(tokens.map(async (token) => {
        const tempClient = new Discord.Client();
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
        console.log(chalk.red('Geçerli bir token bulunamadı!'));
        rl.close();
        return;
    }

    rl.question(chalk.green('Birden fazla kullanıcı seçin (örnek: 1, 2): '), (selectedIndexes) => {
        const selectedIndices = selectedIndexes.split(',').map(idx => parseInt(idx.trim()) - 1);
        const selectedUsers = selectedIndices.map(idx => validUsers[idx]).filter(user => user);
        
        if (selectedUsers.length > 0) {
            console.log(chalk.green(`Seçilen Kullanıcılar: ${selectedUsers.map(user => user.username).join(', ')}`));
            getSelectedMode(selectedUsers.map(user => user.token)); // Mod seçimini al
        } else {
            console.log(chalk.red('Geçersiz seçim!'));
            rl.close();
        }
    });
}

// Mod seçimi
function getSelectedMode(selectedTokens) {
    rl.question(chalk.green('Shadex Selfbot - Mod seçin (1: Normal, 2: Kişiye Özel, 3: Role Özel, 4: Tepki Ekle Modu): '), (mode) => {
        let userIds = [];
        let roleId = null;

        if (mode === '1' || mode === '2' || mode === '3') {
            rl.question(chalk.blue('Shadex Bot: Lütfen kullanılacak emoji\'yi girin (örnek: 👍): '), (emoji) => {
                selectedEmoji = emoji.trim();
                console.log(chalk.green(`Seçilen Emojiler: ${selectedEmoji}`));

                if (mode === '2') {
                    rl.question(chalk.blue('Shadex Bot: Kişiye özel tepki için kullanıcının ID\'lerini girin (virgülle ayırarak): '), (ids) => {
                        userIds = ids.split(',').map(id => id.trim());
                        getNewChannelIds(selectedTokens, mode, userIds, roleId, selectedEmoji);
                    });
                } else if (mode === '3') {
                    rl.question(chalk.blue('Shadex Bot: Rol ID\'sini girin: '), (enteredRoleId) => {
                        roleId = enteredRoleId.trim();
                        getNewChannelIds(selectedTokens, mode, userIds, roleId, selectedEmoji);
                    });
                } else {
                    getNewChannelIds(selectedTokens, mode, userIds, roleId, selectedEmoji);
                }
            });
        } else if (mode === '4') {
            console.log(chalk.green('Tepki Ekle Modu seçildi. Bot, başka kullanıcıların tepki attığı mesajlara tepki ekleyecek.'));
            getNewChannelIds(selectedTokens, mode, userIds, roleId); // Mod 4 için kanal ID'lerini al
        } else {
            console.log(chalk.red('Geçersiz mod seçimi!'));
            rl.close();
        }
    });
}

// Kanal ID'lerini al
function getNewChannelIds(selectedTokens, mode, userIds, roleId, emoji = null) {
    rl.question(chalk.blue('Shadex Bot: Lütfen kanal ID\'lerini girin (virgülle ayırarak): '), (channelIdsInput) => {
        channelIds = channelIdsInput.split(',').map(id => id.trim());
        console.log(chalk.green(`Kanal ID'leri: ${channelIds.join(', ')}`));
        startBot(selectedTokens, channelIds, mode, userIds, roleId, emoji); // Botu başlat
    });
}

// Botu başlatma
function startBot(selectedTokens, channelIds, mode, userIds = [], roleId = null, emoji = null) {
    const clients = selectedTokens.map(token => {
        const client = new Discord.Client();
        client.login(token).catch(err => console.error(chalk.red(`❌ Shadex: Selfbot giriş hatası: ${err.message}`)));
        return client;
    });

    clients.forEach(client => {
        client.on('ready', () => {
            console.log(chalk.green(`✅ Kullanıcı: ${client.user.tag} giriş yaptı!`));
        });

        client.on('messageCreate', async (message) => {
            if (!channelIds.includes(message.channel.id)) return;
            if (message.author.bot) return;

            // Mod 2: Kullanıcıya özel tepki ekleme
            if (mode === '2' && userIds.length > 0 && !userIds.includes(message.author.id)) return;

            // Mod 3: Rol özel tepki ekleme
            if (mode === '3' && message.guild) {
                const member = await message.guild.members.fetch(message.author.id).catch(() => null);
                if (!member || !member.roles.cache.has(roleId)) return;
            }

            // Eğer mod 1, 2 veya 3 ise, seçilen emoji ile tepki ekle
            if ((mode === '1' || mode === '2' || mode === '3') && emoji) {
                try {
                    await message.react(emoji);
                    console.log(chalk.green(`✅ ${emoji} tepki eklendi: ${message.guild.name} | ${message.author.username} | ${client.user.tag}`));
                } catch (error) {
                    console.error(chalk.red(`❌ Tepki eklenirken hata oluştu: ${error}`));
                }
            }
        });

        // Yeni tepki eklendiğinde çalışacak kısım (4. mod için)
        client.on('messageReactionAdd', async (reaction, user) => {
            if (!channelIds.includes(reaction.message.channel.id)) return;
            if (user.bot) return; // Botların reaksiyonlarını atlıyoruz

            // Eğer reaction.message.author yoksa, tepki eklemeyelim
            if (!reaction.message.author) return;

            // Eğer bu mesajda daha önce tepki eklenmişse, tekrar tepki ekleme
            if (reactedMessages.has(reaction.message.id)) return;

            try {
                // Aynı emoji ile tepkiyi tekrarlıyoruz
                await reaction.message.react(reaction.emoji);
                console.log(chalk.green(`✅ Tepki eklendi: ${reaction.emoji} -> ${reaction.message.guild.name} | ${reaction.message.author.username} | ${client.user.tag}`));

                // Tepki ekledikten sonra mesajı reactedMessages set'ine ekliyoruz
                reactedMessages.add(reaction.message.id);
            } catch (error) {
                console.error(chalk.red(`❌ Tepki eklenirken hata oluştu: ${error}`));
            }
        });
    });
}

// Program başlatma
(async () => {
    try {
        await loadTokensFromFile(); // Tokenları dosyadan al
        await listTokens(tokens); // Tokenları listele
    } catch (error) {
        console.error(error);
    }
})();
