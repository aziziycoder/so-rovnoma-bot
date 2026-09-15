require('dotenv').config();
const { Telegraf, Scenes, session, Markup } = require('telegraf');
const express = require('express');
const { surveyScene } = require('./scenes/survey');

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('XATO: BOT_TOKEN aniqlanmadi! Iltimos, .env faylida BOT_TOKEN ni ko\'rsating.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

// Stage va Scene larni sozlash
const stage = new Scenes.Stage([surveyScene]);

bot.use(session());
bot.use(stage.middleware());

// /start buyrug'i
bot.command('start', async (ctx) => {
  const firstName = ctx.from.first_name || 'Foydalanuvchi';
  await ctx.reply(
    `Assalomu alaykum, *${firstName}*!\n\n` +
    `Ushbu bot orqali *Mahallalardagi oilalarning ijtimoiy holatini o‘rganish so‘rovnomasi*ni to‘ldirishingiz mumkin.\n\n` +
    `Barcha kiritilgan ma'lumotlar avtomatik Google Sheets jadvaliga saqlanadi.\n\n` +
    `So‘rovnomani boshlash uchun quyidagi tugmani bosing:`,
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('🚀 So‘rovnomani boshlash', 'start_survey')]
      ])
    }
  );
});

// So'rovnomani boshlash callback
bot.action('start_survey', async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.scene.enter('SURVEY_SCENE');
});

// /cancel buyrug'i
bot.command('cancel', async (ctx) => {
  if (ctx.scene) {
    await ctx.scene.leave();
  }
  await ctx.reply('❌ Amal bekor qilindi. Qaytadan boshlash uchun /start bosing.', Markup.removeKeyboard());
});

// /help buyrug'i
bot.command('help', async (ctx) => {
  await ctx.reply(
    `ℹ️ *Bot bo‘yicha yordam:*\n\n` +
    `• /start - So‘rovnomani boshlash\n` +
    `• /cancel - Jarayonni bekor qilish\n` +
    `• /help - Yordam xabari\n\n` +
    `Savollarga ketma-ket javob bering. Rasm talab qilinganda rasm yuklashingiz yoki "O‘tkazib yuborish" tugmasini bosishingiz mumkin.`,
    { parse_mode: 'Markdown' }
  );
});

// Noto'g'ri xabarlar uchun umumiy handler (agar scene ichida bo'lmasa)
bot.on('message', async (ctx) => {
  await ctx.reply(
    `So‘rovnomani to‘ldirish uchun /start buyrug‘ini bosing.`,
    Markup.inlineKeyboard([
      [Markup.button.callback('🚀 So‘rovnomani boshlash', 'start_survey')]
    ])
  );
});

// Xatoliklarni ushlab qolish
bot.catch((err, ctx) => {
  console.error(`Xatolik yuz berdi (${ctx.updateType}):`, err);
});

// ==========================================
// RENDER.COM UCHUN HTTP SERVER (Health check)
// ==========================================
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    bot: 'Mahallalar so\'rovnoma boti faol ishlamoqda',
    time: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Express server port ${PORT} da ishga tushdi (Render health-check uchun)`);
});

// Botni ishga tushirish (Long Polling)
bot.launch().then(() => {
  console.log('🤖 Telegram bot muvaffaqiyatli ishga tushdi!');
});

// Xavfsiz to'xtatish (Graceful shutdown)
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
