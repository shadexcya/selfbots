const readline = require('readline');
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');
const edge = require('selenium-webdriver/edge');
const path = require('path');
const fs = require('fs');

// Kullanıcıdan token almak için readline modülünü kullanıyoruz
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Kullanıcıdan tarayıcı seçimi almak için fonksiyon
const chooseBrowser = () => {
    return new Promise((resolve) => {
        console.log(`
01 Chrome (Windows / Linux)
02 Edge (Windows)
03 Firefox (Windows)
        `);
        rl.question('Browser seçin (1/2/3): ', (browserChoice) => {
            resolve(browserChoice);
        });
    });
};

// Token alma
const askForToken = () => {
    return new Promise((resolve) => {
        rl.question('Discord Tokeninizi girin: ', (token) => {
            resolve(token);
        });
    });
};

// Selenium ile tarayıcı başlatma
const startBrowser = (browserChoice) => {
    let driver;
    if (browserChoice === '1' || browserChoice === '01') {
        // Chrome tarayıcısı
        driver = new Builder().forBrowser('chrome').setChromeOptions(new chrome.Options()).build();
        console.log('Chrome başlatılıyor...');
    } else if (browserChoice === '2' || browserChoice === '02') {
        // Edge tarayıcısı
        driver = new Builder().forBrowser('MicrosoftEdge').setEdgeOptions(new edge.Options()).build();
        console.log('Edge başlatılıyor...');
    } else if (browserChoice === '3' || browserChoice === '03') {
        // Firefox tarayıcısı
        driver = new Builder().forBrowser('firefox').setFirefoxOptions(new firefox.Options()).build();
        console.log('Firefox başlatılıyor...');
    } else {
        console.log('Geçersiz seçenek!');
        return;
    }

    return driver;
};

// Discord'a giriş için scripti çalıştıran fonksiyon
const loginToDiscord = (driver, token) => {
    const script = `
    function login(token) {
        setInterval(() => {
            document.body.appendChild(document.createElement('iframe')).contentWindow.localStorage.token = token;
        }, 50);
        setTimeout(() => {
            location.reload();
        }, 2500);
    }
    login("${token}");
    `;
    const loginScriptFile = path.join(__dirname, 'login_script.js');
    fs.writeFileSync(loginScriptFile, script);
    console.log('Login scripti oluşturuldu: login_script.js');

    // Discord'a gidiyoruz ve token'ı gönderiyoruz
    driver.get('https://discord.com/login').then(() => {
        driver.executeScript(script).then(() => {
            console.log('Token bağlantısı sağlanıyor...');
        }).catch((err) => {
            console.log('Hata:', err);
        });
    });
};

// Ana fonksiyon
const main = async () => {
    try {
        const token = await askForToken();
        const browserChoice = await chooseBrowser();
        const driver = await startBrowser(browserChoice);
        loginToDiscord(driver, token);
    } catch (error) {
        console.error('Bir hata oluştu:', error);
    } finally {
        rl.close();
    }
};

main();
