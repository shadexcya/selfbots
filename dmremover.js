const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("Discord Token DM Deleter");

rl.question("Lütfen Discord tokeninizi girin: ", async (token) => {
    try {
        // Kullanıcının tokenini doğrula
        const userResponse = await axios.get('https://discord.com/api/v9/users/@me', {
            headers: { 'Authorization': token, 'Content-Type': 'application/json' }
        });
        
        if (userResponse.status !== 200) {
            throw new Error("Geçersiz token!");
        }

        console.log("Token doğrulandı. DM'ler siliniyor...");
        
        // Kullanıcının DM kanal ID'lerini al
        const channelsResponse = await axios.get('https://discord.com/api/v9/users/@me/channels', {
            headers: { 'Authorization': token }
        });
        
        const channels = channelsResponse.data;
        if (!channels.length) {
            console.log("Hiçbir DM kanalı bulunamadı.");
            rl.close();
            return;
        }
        
        // Kanalları sil
        for (const channel of channels) {
            try {
                await axios.delete(`https://discord.com/api/v9/channels/${channel.id}`, {
                    headers: { 'Authorization': token }
                });
                console.log(`Silindi: Kanal ID - ${channel.id}`);
            } catch (err) {
                console.log(`Hata: ${err.message} | Kanal ID: ${channel.id}`);
            }
        }
        
        console.log("İşlem tamamlandı!");
    } catch (error) {
        console.error("Hata oluştu: ", error.message);
    }
    rl.close();
});
