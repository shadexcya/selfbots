const readline = require('readline');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

let tokens = [];

// Terminal genişliği hesaplama ve yazıyı ortalama fonksiyonu
function centerText(text) {
    const terminalWidth = process.stdout.columns || 80; // Terminal genişliğini al
    const padding = Math.max(0, Math.floor((terminalWidth - text.length) / 2)); // Genişlik farkını hesapla
    return ' '.repeat(padding) + text;
}

// Terminalin genişliğine göre maddeleri ortalama fonksiyonu
function verticalList(items) {
    return items.map(item => chalk.blue.bold(item)).join('\n');  // Her maddeyi alt alta yazdır
}

// Logo metni ve başlatıcıyı düz bir şekilde yazdırma
function showLogo() {
    console.log(chalk.bold.cyan(centerText('Shadex SelfBot - Başlatıcı')));
}

showLogo(); // Başlangıçta logo metnini yazdır

// Token'ları dosyadan al
function loadTokensFromFile() {
    return new Promise((resolve, reject) => {
        fs.readFile('C:\\Users\\Shadex\\Desktop\\tokenlist.txt', 'utf8', (err, data) => {
            if (err) {
                console.log(chalk.red.bold('Token dosyasını okurken hata oluştu! Bot kapanıyor.'));
                rl.close();
                return reject();
            }
            tokens = data.split('\n').map(line => line.trim()).filter(line => line.length > 0);
            if (tokens.length === 0) {
                console.log(chalk.red.bold('Geçerli bir token bulunamadı! Bot kapanıyor.'));
                rl.close();
                return reject();
            }
            resolve();
        });
    });
}

// Kullanıcıdan mod seçimi almak
async function askForMode() {
    return new Promise((resolve) => {
        rl.question(chalk.bold.blue(
            '\n' + centerText('Shadex Bot: Hangi modu başlatmak istersiniz?') +
            '\n\n' + chalk.green.bold('Mesaj ve Etkileşim') + '\n' + verticalList([
                '1: Reply',
                '2: React',
                '3: Mention',
                '4: Yazıyor (Yazma Modülü)',
                '5: Mesaj'
            ]) +
            '\n\n' + chalk.green.bold('Bot Yönetimi ve Sunucu') + '\n' + verticalList([
                '6: Server Info',
                '7: Bot Invite',
                '8: Token Checker',
                '9: Token Info'
            ]) +
            '\n\n' + chalk.green.bold('Kullanıcı ve Token') + '\n' + verticalList([
                '10: Token Status',
                '11: Delete Friends',
                '12: Token Login',
                '13: Token Joiner',
                '14: Token Leaver',
                '15: Username Changer',
                '16: Token Voice',
                '17: Token Onliner'
            ]) +
            '\n\n' + chalk.green.bold('Spammer') + '\n' + verticalList([
                '18: Spammer',
                '19: WH Spammer',
                '20: Mass DM'
            ]) +
            '\n\n' + chalk.green.bold('Copy') + '\n' + verticalList([
                '21: Emoji Copy',
                '22: Server Copy'
            ]) +
            '\n\n' + chalk.green.bold('Raids') + '\n' + verticalList([
                '23: Token Raid',
                '24: Bot Raid'
            ]) +
            '\n\n' + chalk.green.bold('Temizlik') + '\n' + verticalList([
                '25: DM Remover',
                '26: Server Quiter',
                '27: Message Delete'
            ]) +
            '\n\n' + chalk.green.bold('Diğer') + '\n' + verticalList([
                '28: User Tracker'
            ]) +
            '\n\n' + centerText('Seçiminizi yapın: ')
        ), (mode) => {
            resolve(mode);
        });
    });
}

async function startBot() {
    await loadTokensFromFile();
    const mode = await askForMode();

    if (mode === '1') {
        rl.close();
        startReplyModule();
    } else if (mode === '2') {
        rl.close();
        startReactModule();
    } else if (mode === '3') {
        rl.close();
        startMentionModule();
    } else if (mode === '4') {
        rl.close();
        startYazmaModule(); // 4. seçenek yazma modülünü başlatıyor
    } else if (mode === '5') {
        rl.close();
        startMesajModule(); // 5. seçenek mesaj modülünü başlatıyor
    } else if (mode === '6') {
        rl.close();
        startServerInfoModule();
    } else if (mode === '7') {
        rl.close();
        startBotInviteModule();
    } else if (mode === '8') {
        rl.close();
        startTokenCheckerModule();
    } else if (mode === '9') {
        rl.close();
        startTokenInfoModule();
    } else if (mode === '10') {
        rl.close();
        startTokenStatusModule();
    } else if (mode === '11') {
        rl.close();
        startDeleteFriendsModule();
    } else if (mode === '12') {
        rl.close();
        startTokenLoginModule();
    } else if (mode === '13') {
        rl.close();
        startTokenJoinerModule();
    } else if (mode === '14') {
        rl.close();
        startTokenLeaverModule();
    } else if (mode === '15') {
        rl.close();
        startUsernameChangerModule();
    } else if (mode === '16') {
        rl.close();
        startTokenVoiceModule();
    } else if (mode === '17') {
        rl.close();
        startTokenOnlinerModule();
    } else if (mode === '18') {
        rl.close();
        startSpammerModule(); // Spammer modülü burada başlatılıyor
    } else if (mode === '19') {
        rl.close();
        startWHSpammerModule();
    } else if (mode === '20') {
        rl.close();
        startMassDMModule();
    } else if (mode === '21') {
        rl.close();
        startEmojiCopyModule();
    } else if (mode === '22') {
        rl.close();
        startServerCopyModule();
    } else if (mode === '23') {
        rl.close();
        startTokenRaidModule();
    } else if (mode === '24') {
        rl.close();
        startBotRaidModule();
    } else if (mode === '25') {
        rl.close();
        startDMRemoverModule();
    } else if (mode === '26') {
        rl.close();
        startServerQuiterModule();
    } else if (mode === '27') {
        rl.close();
        startMessageDeleteModule();
    } else if (mode === '28') {
        rl.close();
        startUserTrackerModule();
    } else {
        console.log(chalk.red.bold('\n' + centerText('Geçersiz seçenek! Lütfen geçerli bir seçenek girin.')));
        rl.close();
    }
}

// Modülleri başlatma fonksiyonları (örnek olarak başlatma fonksiyonlarını ekledim, bunlar örnek çalıştırma işlemleri)
function startReplyModule() {
    console.log(chalk.green.bold(centerText('\nReply modülü başlatılıyor...')));
    try {
        require('./reply.js');
    } catch (err) {
        console.error(chalk.red(`Hata: ${err.message}`));
    }
}

function startReactModule() {
    console.log(chalk.green.bold(centerText('\nReact modülü başlatılıyor...')));
    try {
        require('./react.js');
    } catch (err) {
        console.error(chalk.red(`Hata: ${err.message}`));
    }
}

function startMentionModule() {
    console.log(chalk.green.bold(centerText('\nMention modülü başlatılıyor...')));
    try {
        require('./mention.js');
    } catch (err) {
        console.error(chalk.red(`Hata: ${err.message}`));
    }
}

function startYazmaModule() {
    console.log(chalk.green.bold(centerText('\nYazma modülü başlatılıyor...')));
    try {
        require('./yazma.js');
    } catch (err) {
        console.error(chalk.red(`Hata: ${err.message}`));
    }
}

function startMesajModule() {
    console.log(chalk.green.bold(centerText('\nMesaj modülü başlatılıyor...')));
    try {
        require('./mesaj.js');
    } catch (err) {
        console.error(chalk.red(`Hata: ${err.message}`));
    }
}

function startSpammerModule() {
    console.log(chalk.green.bold(centerText('\nSpammer modülü başlatılıyor...')));
    const spammerPath = path.join('C:\\Users\\Shadex\\Desktop\\botlarim\\shadexspammer', 'spammer.js');
    const childProcess = spawn('node', [spammerPath], { stdio: 'inherit' });

    childProcess.on('exit', (code) => {
        if (code === 0) {
            console.log(chalk.green.bold(centerText('\nSpammer botu başarıyla çalıştı.')));
        } else {
            console.log(chalk.red.bold(centerText(`\nSpammer botu çalışırken hata oluştu: ${code}`)));
        }
    });
}

// Diğer modüller için başlatma fonksiyonları buraya eklenebilir...

// Botu başlatma
startBot();
