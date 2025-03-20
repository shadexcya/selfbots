const { Client } = require("discord.js-selfbot-v13"); // Selfbot için özel kütüphane
const axios = require("axios");
const fs = require("fs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Tokenları dosyadan al
function loadTokensFromFile() {
  return new Promise((resolve, reject) => {
    fs.readFile("C:\\Users\\Shadex\\Desktop\\tokenlist.txt", "utf8", (err, data) => {
      if (err) {
        reject("Token dosyasını okurken hata oluştu!");
        rl.close();
        return;
      }
      tokens = data.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
      if (tokens.length === 0) {
        reject("Geçerli bir token bulunamadı!");
        rl.close();
        return;
      }
      console.log("Token'lar dosyadan alındı.");
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
      console.error(`❌ Token ile kullanıcı alınırken hata oluştu: ${error.message}`);
    }
  }

  return userInfo;
}

// Kullanıcıdan bir token seçme
async function selectToken(tokens) {
  const tokenUsers = await getTokenUsernames(tokens);

  console.log("Mevcut Token'lar ve Kullanıcı Adları:");

  if (tokenUsers.length > 0) {
    tokenUsers.forEach((user, index) => {
      console.log(`${index + 1}: ${user.username}`);
    });

    return new Promise((resolve, reject) => {
      rl.question("Bir token seçmek için numarasını girin: ", (selectedIndex) => {
        const index = parseInt(selectedIndex.trim()) - 1;
        if (index < 0 || index >= tokenUsers.length) {
          reject("Geçersiz seçim!");
          rl.close();
          return;
        }
        const selectedToken = tokenUsers[index].token;
        console.log(`Seçilen Token: ${tokenUsers[index].username}`);
        resolve(selectedToken);
      });
    });
  } else {
    console.log("Geçerli bir token bulunamadı!");
    rl.close();
  }
}

// Kullanıcıdan server ID'si alma
async function getGuildID() {
  return new Promise((resolve) => {
    rl.question("Server ID'si girin: ", (guildID) => {
      resolve(guildID.trim());
    });
  });
}

async function startBot() {
  try {
    // "emojiler" klasörünü oluştur
    const SAVE_PATH = "./emojiler/";
    if (!fs.existsSync(SAVE_PATH)) {
      fs.mkdirSync(SAVE_PATH); // "emojiler" klasörünü oluştur
    }

    // Token ve server ID bilgilerini al
    await loadTokensFromFile();
    const selectedToken = await selectToken(tokens);
    const GUILD_ID = await getGuildID();

    const client = new Client();

    client.on("ready", async () => {
      console.log(`✅ Selfbot giriş yaptı: ${client.user.tag}`);

      try {
        // Sunucuyu fetch ile çağırıyoruz
        const guild = await client.guilds.fetch(GUILD_ID);
        if (!guild) return console.log("⚠ Sunucu bulunamadı!");

        console.log(`\n🎭 Sunucu: ${guild.name} (ID: ${guild.id})`);

        // Sunucuya özel bir klasör oluştur, sunucu adını klasör adı yapıyoruz
        const guildFolderPath = `${SAVE_PATH}${guild.name}/`;
        if (!fs.existsSync(guildFolderPath)) {
          fs.mkdirSync(guildFolderPath, { recursive: true }); // Sunucu adıyla klasör oluştur
        }

        // Sunucudaki emojileri indir
        let downloadedEmojis = 0; // İndirilen emoji sayısını tutuyoruz
        for (const emoji of guild.emojis.cache.values()) {
          console.log(`📥 İndiriliyor: ${emoji.name}`);

          try {
            const response = await axios.get(emoji.url, { responseType: "arraybuffer" });
            const fileExtension = emoji.animated ? "gif" : "png"; // Hareketli emojileri ayırt et
            fs.writeFileSync(`${guildFolderPath}${emoji.name}.${fileExtension}`, response.data);

            console.log(`✅ Kaydedildi: ${emoji.name}`);
            downloadedEmojis++; // Her başarılı indirilen emoji için sayacı arttır
          } catch (error) {
            console.log(`❌ İndirme başarısız: ${emoji.name}`);
          }
        }

        if (downloadedEmojis > 0) {
          console.log(`✅ ${guild.name} sunucusundaki ${downloadedEmojis} emoji başarıyla indirildi.`);
        } else {
          console.log("⚠ Sunucuda indirilebilecek emoji bulunamadı.");
        }

        console.log("Tüm emojiler kopyalandı!");
        client.destroy(); // Botu kapat
      } catch (error) {
        console.log("⚠ Sunucu erişimi sağlanamadı:", error);
        client.destroy(); // Hata durumunda da botu kapatıyoruz
      }
    });

    client.login(selectedToken);
  } catch (err) {
    console.log("Hata oluştu:", err);
    rl.close();
  }
}

// Botu başlat
startBot();
