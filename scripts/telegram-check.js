const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  try {
    const txt = fs.readFileSync(filePath, 'utf8');
    const lines = txt.split(/\r?\n/);
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const eq = trimmed.indexOf('=');
      if (eq === -1) return;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!(key in process.env)) process.env[key] = val;
    });
  } catch (e) {
    // ignore
  }
}

// Load .env.local then .env if present
loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const token = (process.env.TELEGRAM_BOT_TOKEN || '').trim();
const chatRaw = (process.env.TELEGRAM_CHAT_ID || '').trim();
const chatId = chatRaw.split(',').map(s => s.trim()).filter(Boolean)[0];

if (!token) {
  console.error('No TELEGRAM_BOT_TOKEN found in environment or .env files');
  process.exit(2);
}
if (!chatId) {
  console.error('No TELEGRAM_CHAT_ID found in environment or .env files');
  process.exit(2);
}

(async () => {
  try {
    console.log('Using token preview:', token.slice(0,8) + '...' + token.slice(-6));
    console.log('Using chat id:', chatId);

    const getMeRes = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/getMe`);
    const getMe = await getMeRes.text();
    console.log('\ngetMe response status:', getMeRes.status);
    console.log(getMe);

    const getChatRes = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/getChat?chat_id=${encodeURIComponent(chatId)}`);
    const getChat = await getChatRes.text();
    console.log('\ngetChat response status:', getChatRes.status);
    console.log(getChat);

    // Try sending a small test message (commented by default)
    // const sendRes = await fetch(`https://api.telegram.org/bot${encodeURIComponent(token)}/sendMessage`, {
    //   method: 'POST', headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ chat_id: chatId, text: 'Test message from telegram-check script' })
    // });
    // console.log('\nsendMessage status:', sendRes.status, await sendRes.text());

  } catch (err) {
    console.error('Error performing Telegram checks:', err);
    process.exit(3);
  }
})();
