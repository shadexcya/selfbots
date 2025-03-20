const { Client } = require("discord.js-selfbot-v13");
const fs = require("fs");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Tokenleri dosyadan oku
const tokens = fs.readFileSync("C:\\Users\\Shadex\\Desktop\\tokenlist.txt", "utf-8").split("\n").map(t => t.trim());
console.log("🔄 Tokenler yükleniyor...");

const clients = [];
let loadedTokens = [];

const getUsername = async (token, index) => {
  const client = new Client();
  try {
    await client.login(token);
    console.log(`[${index + 1}] ${client.user.username}`);
    loadedTokens.push({ index, token, username: client.user.username });
  } catch {
    console.log(`[${index + 1}] ❌ Giriş başarısız!`);
  }
  clients.push(client);
};

(async () => {
  for (let i = 0; i < tokens.length; i++) {
    await getUsername(tokens[i], i);
  }

  rl.question("Takip Edilecek Token Numarasını Seç (1 tane): ", (mainTokenIndex) => {
    const mainTokenData = loadedTokens.find(t => t.index === parseInt(mainTokenIndex) - 1);
    if (!mainTokenData) {
      console.log("❌ Geçersiz seçim!");
      process.exit(1);
    }

    rl.question("Mesajı Kopyalayacak Token Numaralarını Seç (Virgülle Ayır): ", (tokenInput) => {
      const tokenIndexes = tokenInput.split(",").map(num => parseInt(num.trim()) - 1);
      const selectedTokens = tokenIndexes.map(index => loadedTokens.find(t => t.index === index)).filter(Boolean);

      if (selectedTokens.length === 0) {
        console.log("❌ Geçersiz seçim!");
        process.exit(1);
      }

      console.log(`📩 **Bot aktif!** ${mainTokenData.username} kullanıcısını takip ediyor...`);

      // Takip eden bot
      const mainClient = new Client();
      mainClient.login(mainTokenData.token)
        .then(() => console.log(`✅ Lider Token Giriş Yaptı: ${mainClient.user.username}`))
        .catch(() => console.log(`❌ Takipçi Token Girişi Başarısız!`));

      // Kopyalayan botlar
      const cloneClients = selectedTokens.map(tokenData => {
        const client = new Client();
        client.login(tokenData.token)
          .then(() => console.log(`✅ Kopyalayan Token Giriş Yaptı: ${client.user.username}`))
          .catch(() => console.log(`❌ Token giriş yapılamadı: ${tokenData.token}`));
        
        // Token bağlantı koparsa yeniden bağlanmayı dene
        client.on("disconnect", async () => {
          console.log(`⚠️ ${client.user?.username || "Bilinmeyen"} bağlantısı kesildi, yeniden bağlanıyor...`);
          try {
            await client.login(tokenData.token);
            console.log(`✅ ${client.user?.username || "Bilinmeyen"} yeniden bağlandı.`);
          } catch {
            console.log(`❌ ${client.user?.username || "Bilinmeyen"} yeniden bağlanamadı.`);
          }
        });
        return client;
      });

      // Mesajları takip et
      mainClient.on("messageCreate", async (message) => {
        if (message.author.id !== mainClient.user.id) return;

        cloneClients.forEach(async (client) => {
          try {
            const channel = await client.channels.fetch(message.channel.id);
            if (!channel) {
              console.log(`❌ ${client.user.username} için Geçersiz Kanal!`);
              return;
            }

            channel.send(message.content).then(() => {
              console.log(`✅ ${client.user.username} Aynı Mesajı Attı: ${message.content}`);
            }).catch(err => {
              console.log(`❌ Mesaj gönderilemedi (${client.user.username}):`, err);
            });

          } catch (error) {
            console.log(`❌ Kanal erişim hatası (${client.user.username}):`, error.message);
          }
        });
      });
    });
  });
})();
