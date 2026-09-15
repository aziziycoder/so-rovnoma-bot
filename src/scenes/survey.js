const { Scenes, Markup } = require('telegraf');
const { createPaginationKeyboard } = require('../keyboards/pagination');
const { sendToGoogleSheet } = require('../services/sheets');
const mahallaList = require('../data/mahalla.json');
const vakillarList = require('../data/vakillar.json');

const QILINGAN_ISH_OPTIONS = [
  'Oila bilan ishlash',
  'Mikro loyiha',
  'Subsidiya olish',
  'Boshqa'
];

const AMALIY_ISH_OPTIONS = [
  "Kreditga yo'naltirish",
  'Issiqxona qurib berish',
  'Hovli yeridan foydalanishni tavsiya berish',
  'Ish taklif qilish'
];

/**
 * 8 bosqichli So'rovnoma Wizard Scene
 */
const surveyScene = new Scenes.WizardScene(
  'SURVEY_SCENE',

  // ----------------------------------------------------
  // BOSQICH 1: Mahallani tanlash (Savol 1)
  // ----------------------------------------------------
  async (ctx) => {
    ctx.wizard.state.survey = {};
    const keyboard = createPaginationKeyboard(mahallaList, 'm_sel:', 0, 10, 2);
    await ctx.reply(
      '📋 *1-savol: Mahallani tanlang*\n\nRo‘yxatdan kerakli mahallani tanlang:',
      { parse_mode: 'Markdown', ...keyboard }
    );
    return ctx.wizard.next();
  },

  // ----------------------------------------------------
  // BOSQICH 2: Mahallani qabul qilish va Vakilni so'rash (Savol 2)
  // ----------------------------------------------------
  async (ctx) => {
    // Pagination yoki tanlovni tekshirish
    if (ctx.callbackQuery) {
      const data = ctx.callbackQuery.data;
      if (data === 'noop') {
        await ctx.answerCbQuery();
        return;
      }
      if (data === 'cancel_survey') {
        await ctx.answerCbQuery('So‘rovnoma bekor qilindi');
        await ctx.reply('❌ So‘rovnoma bekor qilindi. Qayta boshlash uchun /start bosing.', Markup.removeKeyboard());
        return ctx.scene.leave();
      }
      if (data.startsWith('m_sel:page:')) {
        const page = parseInt(data.replace('m_sel:page:', ''), 10);
        const keyboard = createPaginationKeyboard(mahallaList, 'm_sel:', page, 10, 2);
        await ctx.editMessageReplyMarkup(keyboard.reply_markup);
        await ctx.answerCbQuery();
        return;
      }
      if (data.startsWith('m_sel:')) {
        const index = parseInt(data.replace('m_sel:', ''), 10);
        const selectedMahalla = mahallaList[index];
        ctx.wizard.state.survey.mahalla = selectedMahalla;
        await ctx.answerCbQuery(`Tanlandi: ${selectedMahalla}`);
        await ctx.editMessageText(`✅ *Mahalla tanlandi:* ${selectedMahalla}`, { parse_mode: 'Markdown' });

        // 2-savolga o'tish: Mahalla vakili
        const keyboard = createPaginationKeyboard(vakillarList, 'v_sel:', 0, 6, 1);
        await ctx.reply(
          '👤 *2-savol: Mahalla vakilini tanlang*\n\nRo‘yxatdan vakilni tanlang:',
          { parse_mode: 'Markdown', ...keyboard }
        );
        return ctx.wizard.next();
      }
    }

    if (ctx.message && ctx.message.text) {
      ctx.wizard.state.survey.mahalla = ctx.message.text.trim();
      const keyboard = createPaginationKeyboard(vakillarList, 'v_sel:', 0, 6, 1);
      await ctx.reply(
        `✅ *Mahalla kiritildi:* ${ctx.wizard.state.survey.mahalla}\n\n👤 *2-savol: Mahalla vakilini tanlang:*\n\nRo‘yxatdan vakilni tanlang:`,
        { parse_mode: 'Markdown', ...keyboard }
      );
      return ctx.wizard.next();
    }
  },

  // ----------------------------------------------------
  // BOSQICH 3: Vakilni qabul qilish va Birga ishlagan shaxsni so'rash (Savol 3)
  // ----------------------------------------------------
  async (ctx) => {
    if (ctx.callbackQuery) {
      const data = ctx.callbackQuery.data;
      if (data === 'noop') {
        await ctx.answerCbQuery();
        return;
      }
      if (data === 'cancel_survey') {
        await ctx.answerCbQuery('So‘rovnoma bekor qilindi');
        await ctx.reply('❌ So‘rovnoma bekor qilindi. Qayta boshlash uchun /start bosing.', Markup.removeKeyboard());
        return ctx.scene.leave();
      }
      if (data.startsWith('v_sel:page:')) {
        const page = parseInt(data.replace('v_sel:page:', ''), 10);
        const keyboard = createPaginationKeyboard(vakillarList, 'v_sel:', page, 6, 1);
        await ctx.editMessageReplyMarkup(keyboard.reply_markup);
        await ctx.answerCbQuery();
        return;
      }
      if (data.startsWith('v_sel:')) {
        const index = parseInt(data.replace('v_sel:', ''), 10);
        const selectedVakil = vakillarList[index];
        ctx.wizard.state.survey.vakil = selectedVakil;
        await ctx.answerCbQuery(`Tanlandi: ${selectedVakil}`);
        await ctx.editMessageText(`✅ *Mahalla vakili tanlandi:* ${selectedVakil}`, { parse_mode: 'Markdown' });

        // 3-savol: Birga ishlagan shaxs
        await ctx.reply(
          '🤝 *3-savol: Mahallada birga ishlagan shaxs F.I.Sh.*\n\nIltimos, ushbu shaxsning to‘liq F.I.Sh. (familiya, ism, sharifi)ni yozib yuboring:',
          { parse_mode: 'Markdown' }
        );
        return ctx.wizard.next();
      }
    }

    if (ctx.message && ctx.message.text) {
      ctx.wizard.state.survey.vakil = ctx.message.text.trim();
      await ctx.reply(
        '🤝 *3-savol: Mahallada birga ishlagan shaxs F.I.Sh.*\n\nIltimos, ushbu shaxsning to‘liq F.I.Sh. (familiya, ism, sharifi)ni yozib yuboring:',
        { parse_mode: 'Markdown' }
      );
      return ctx.wizard.next();
    }
  },

  // ----------------------------------------------------
  // BOSQICH 4: F.I.Sh. qabul qilish va Telefon raqam so'rash (Savol 4)
  // ----------------------------------------------------
  async (ctx) => {
    if (!ctx.message || !ctx.message.text) {
      await ctx.reply('Iltimos, shaxsning F.I.Sh. matn ko‘rinishida yozib yuboring:');
      return;
    }

    ctx.wizard.state.survey.birgaIshlagan = ctx.message.text.trim();

    // 4-savol: Telefon raqami (Qo'lda kiritish)
    await ctx.reply(
      '📞 *4-savol: Telefon raqami*\n\nTelefon raqamini yozib yuboring (masalan: `+998901234567` yoki `901234567`):',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('❌ Bekor qilish', 'cancel_survey')]
        ])
      }
    );
    return ctx.wizard.next();
  },

  // ----------------------------------------------------
  // BOSQICH 5: Telefon raqamini qabul qilish va Qilingan ishni so'rash (Savol 5)
  // ----------------------------------------------------
  async (ctx) => {
    if (ctx.callbackQuery) {
      if (ctx.callbackQuery.data === 'cancel_survey') {
        await ctx.answerCbQuery('So‘rovnoma bekor qilindi');
        await ctx.reply('❌ So‘rovnoma bekor qilindi. Qayta boshlash uchun /start bosing.');
        return ctx.scene.leave();
      }
    }

    let phone = '';

    if (ctx.message && ctx.message.contact) {
      phone = ctx.message.contact.phone_number;
    } else if (ctx.message && ctx.message.text) {
      const text = ctx.message.text.trim();
      if (text === '/cancel' || text === '❌ Bekor qilish') {
        await ctx.reply('❌ So‘rovnoma bekor qilindi. Qayta boshlash uchun /start bosing.');
        return ctx.scene.leave();
      }
      // Raqamlarni tekshirish (kamida 7 ta raqam bo'lishi kerak)
      const digits = text.replace(/\D/g, '');
      if (digits.length < 7) {
        await ctx.reply('⚠️ Iltimos, to‘g‘ri telefon raqam kiriting (masalan: `+998901234567`):', { parse_mode: 'Markdown' });
        return;
      }
      phone = text;
    } else {
      await ctx.reply('Iltimos, telefon raqamini matn ko‘rinishida yozib yuboring:');
      return;
    }

    ctx.wizard.state.survey.telefon = phone;
    await ctx.reply(`✅ *Telefon raqami qabul qilindi:* ${phone}`, { parse_mode: 'Markdown' });

    // 5-savol: Mahallada qilingan ish (Qo'lda yozish)
    await ctx.reply(
      '🔨 *5-savol: Mahallada qilingan ish*\n\n' +
      'Mahallada amalga oshirilgan ish haqida yozib yuboring.\n' +
      '_(Masalan: Oila bilan ishlash, Mikro loyiha, Subsidiya olish yoki boshqa...)_',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('❌ Bekor qilish', 'cancel_survey')]
        ])
      }
    );
    return ctx.wizard.next();
  },

  // ----------------------------------------------------
  // BOSQICH 6: Qilingan ishni qabul qilish va Muammoni so'rash (Savol 6)
  // ----------------------------------------------------
  async (ctx) => {
    if (ctx.callbackQuery) {
      if (ctx.callbackQuery.data === 'cancel_survey') {
        await ctx.answerCbQuery('So‘rovnoma bekor qilindi');
        await ctx.reply('❌ So‘rovnoma bekor qilindi. Qayta boshlash uchun /start bosing.');
        return ctx.scene.leave();
      }
    }

    if (!ctx.message || !ctx.message.text) {
      await ctx.reply('Iltimos, mahallada qilingan ish haqida matn ko‘rinishida yozib yuboring:');
      return;
    }

    const text = ctx.message.text.trim();
    if (text === '/cancel' || text === '❌ Bekor qilish') {
      await ctx.reply('❌ So‘rovnoma bekor qilindi. Qayta boshlash uchun /start bosing.');
      return ctx.scene.leave();
    }

    ctx.wizard.state.survey.qilinganIsh = text;

    // 6-savol: Mahalla muammosi
    await ctx.reply(
      '⚠️ *6-savol: Mahallani muammosi haqida qisqacha ma’lumot.*\n\n' +
      'Mahalladagi asosiy muammo haqida qisqacha yozib yuboring:',
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.callback('❌ Bekor qilish', 'cancel_survey')]
        ])
      }
    );
    return ctx.wizard.next();
  },

  // ----------------------------------------------------
  // BOSQICH 7: Muammoni qabul qilish va Rasmni so'rash (Savol 7)
  // ----------------------------------------------------
  async (ctx) => {
    if (ctx.callbackQuery) {
      if (ctx.callbackQuery.data === 'cancel_survey') {
        await ctx.answerCbQuery('So‘rovnoma bekor qilindi');
        await ctx.reply('❌ So‘rovnoma bekor qilindi. Qayta boshlash uchun /start bosing.');
        return ctx.scene.leave();
      }
    }

    if (!ctx.message || !ctx.message.text) {
      await ctx.reply('Iltimos, muammo haqida matn ko‘rinishida yozing:');
      return;
    }

    const text = ctx.message.text.trim();
    if (text === '/cancel' || text === '❌ Bekor qilish') {
      await ctx.reply('❌ So‘rovnoma bekor qilindi. Qayta boshlash uchun /start bosing.');
      return ctx.scene.leave();
    }

    ctx.wizard.state.survey.muammo = text;

    // 7-savol: Mahallada qilingan ish rasmi
    const skipKeyboard = Markup.inlineKeyboard([
      [Markup.button.callback('➡️ Rasm yo‘q (O‘tkazib yuborish)', 'skip_photo')],
      [Markup.button.callback('❌ Bekor qilish', 'cancel_survey')]
    ]);

    await ctx.reply(
      '📷 *7-savol: Mahallada qilingan ish rasmi*\n\n' +
      'Mahallada amalga oshirilgan ish yuzasidan bitta rasm (foto) yuboring.\n' +
      'Agar rasm bo‘lmasa, pastdagi "O‘tkazib yuborish" tugmasini bosing:',
      { parse_mode: 'Markdown', ...skipKeyboard }
    );
    return ctx.wizard.next();
  },

  // ----------------------------------------------------
  // BOSQICH 8: Rasmni qabul qilish va Amaliy ishni so'rash (Savol 8)
  // ----------------------------------------------------
  async (ctx) => {
    if (ctx.callbackQuery) {
      const data = ctx.callbackQuery.data;
      if (data === 'cancel_survey') {
        await ctx.answerCbQuery('Bekor qilindi');
        await ctx.reply('❌ So‘rovnoma bekor qilindi. Qayta boshlash uchun /start bosing.');
        return ctx.scene.leave();
      }
      if (data === 'skip_photo') {
        ctx.wizard.state.survey.photoFileId = null;
        await ctx.answerCbQuery('Rasm o‘tkazib yuborildi');
        await ctx.editMessageText('📷 *Rasm:* Biriktirilmadi (o‘tkazib yuborildi)', { parse_mode: 'Markdown' });

        // 8-savolga o'tish: Amaliy ish
        return askAmaliyIsh(ctx);
      }
    }

    if (ctx.message && ctx.message.photo && ctx.message.photo.length > 0) {
      const photos = ctx.message.photo;
      const largestPhoto = photos[photos.length - 1];
      ctx.wizard.state.survey.photoFileId = largestPhoto.file_id;
      await ctx.reply('✅ Rasm muvaffaqiyatli qabul qilindi.');

      // 8-savolga o'tish: Amaliy ish
      return askAmaliyIsh(ctx);
    }

    await ctx.reply(
      'Iltimos, rasm yuboring yoki pastdagi "➡️ Rasm yo‘q (O‘tkazib yuborish)" tugmasini bosing:',
      Markup.inlineKeyboard([
        [Markup.button.callback('➡️ Rasm yo‘q (O‘tkazib yuborish)', 'skip_photo')],
        [Markup.button.callback('❌ Bekor qilish', 'cancel_survey')]
      ])
    );
  },

  // ----------------------------------------------------
  // BOSQICH 9: Amaliy ishni qabul qilish va Tasdiqlash
  // ----------------------------------------------------
  async (ctx) => {
    if (ctx.callbackQuery) {
      const data = ctx.callbackQuery.data;
      if (data === 'cancel_survey') {
        await ctx.answerCbQuery('Bekor qilindi');
        await ctx.reply('❌ So‘rovnoma bekor qilindi. Qayta boshlash uchun /start bosing.');
        return ctx.scene.leave();
      }
    }

    if (!ctx.message || !ctx.message.text) {
      await ctx.reply('Iltimos, mahalla bilan qilingan amaliy ish haqida yozib yuboring:');
      return;
    }

    const text = ctx.message.text.trim();
    if (text === '/cancel' || text === '❌ Bekor qilish') {
      await ctx.reply('❌ So‘rovnoma bekor qilindi. Qayta boshlash uchun /start bosing.');
      return ctx.scene.leave();
    }

    ctx.wizard.state.survey.amaliyIsh = text;
    return showSummary(ctx);
  },

  // ----------------------------------------------------
  // BOSQICH 10: Tasdiqlash va Google Sheets'ga yuborish
  // ----------------------------------------------------
  async (ctx) => {
    if (!ctx.callbackQuery) return;

    const data = ctx.callbackQuery.data;

    if (data === 'confirm_send') {
      await ctx.answerCbQuery('Yuborilmoqda...');
      await ctx.editMessageText('⏳ *Ma’lumotlar Google Sheets jadvaliga saqlanmoqda... Iltimos, kuting.*', { parse_mode: 'Markdown' });

      const survey = ctx.wizard.state.survey;
      const result = await sendToGoogleSheet(survey, ctx.telegram);

      if (result.success) {
        await ctx.reply(
          '🎉 *Barcha ma’lumotlar Google Sheets jadvaliga muvaffaqiyatli saqlandi!*\n\n' +
          'Ishtirokingiz va mehnatingiz uchun tashakkur!\n\n' +
          'Yangi so‘rovnoma to‘ldirish uchun /start buyrug‘ini bosing.',
          { parse_mode: 'Markdown' }
        );
      } else {
        await ctx.reply(
          `⚠️ *Ma’lumotlarni jadvalga yozishda xatolik yuz berdi:*\n\`${result.error}\`\n\n` +
          `Eslatma: Agar Google Apps Script Webhook URL hali .env faylga qo‘yilmagan bo‘lsa, iltimos, uni sozlang.`,
          { parse_mode: 'Markdown' }
        );
      }

      return ctx.scene.leave();
    }

    if (data === 'restart_survey') {
      await ctx.answerCbQuery('Qaytadan boshlash');
      await ctx.reply('🔄 So‘rovnoma boshidan boshlanmoqda...');
      return ctx.scene.reenter();
    }

    if (data === 'cancel_survey') {
      await ctx.answerCbQuery('Bekor qilindi');
      await ctx.reply('❌ So‘rovnoma bekor qilindi. Qayta boshlash uchun /start bosing.', Markup.removeKeyboard());
      return ctx.scene.leave();
    }
  }
);

// Yordamchi: 8-savol matn kiritishni so'rash
async function askAmaliyIsh(ctx) {
  await ctx.reply(
    '💼 *8-savol: Mahalla bilan qilingan amaliy ish*\n\n' +
    'Mahalla bilan qilingan amaliy ish haqida yozib yuboring.\n' +
    '_(Masalan: Kreditga yo‘naltirish, Issiqxona qurib berish, Hovli yeridan foydalanishni tavsiya berish, Ish taklif qilish yoki boshqa...)_',
    {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.callback('❌ Bekor qilish', 'cancel_survey')]
      ])
    }
  );
  return ctx.wizard.next();
}

// Yordamchi: Yakuniy tasdiqlash xulosasini ko'rsatish
async function showSummary(ctx) {
  const s = ctx.wizard.state.survey;
  const summaryText =
    '📋 *SO‘ROVNOMA NATIJALARI:*\n\n' +
    `📍 *1. Mahalla:* ${s.mahalla || '-'}\n` +
    `👤 *2. Mahalla vakili:* ${s.vakil || '-'}\n` +
    `🤝 *3. Birga ishlagan shaxs:* ${s.birgaIshlagan || '-'}\n` +
    `📞 *4. Telefon raqami:* ${s.telefon || '-'}\n` +
    `🔨 *5. Qilingan ish:* ${s.qilinganIsh || '-'}\n` +
    `⚠️ *6. Mahalla muammosi:* ${s.muammo || '-'}\n` +
    `📷 *7. Rasm:* ${s.photoFileId ? '✅ Yuklandi' : '❌ Yuklanmadi'}\n` +
    `💼 *8. Amaliy ish:* ${s.amaliyIsh || '-'}\n\n` +
    '_Ma’lumotlarni tekshiring va tasdiqlang:_';

  const confirmKeyboard = Markup.inlineKeyboard([
    [Markup.button.callback('✅ Tasdiqlash va Yuborish', 'confirm_send')],
    [
      Markup.button.callback('🔄 Qaytadan boshlash', 'restart_survey'),
      Markup.button.callback('❌ Bekor qilish', 'cancel_survey')
    ]
  ]);

  await ctx.reply(summaryText, { parse_mode: 'Markdown', ...confirmKeyboard });
  return ctx.wizard.next();
}

module.exports = {
  surveyScene
};
