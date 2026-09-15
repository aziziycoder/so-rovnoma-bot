const { Markup } = require('telegraf');

/**
 * Sahifalangan Inline Keyboard yaratish funksiyasi
 * @param {Array<string>} items - Tanlov variantlari ro'yxati
 * @param {string} prefix - callback_data prefiksi (masalan, 'm_sel:' yoki 'v_sel:')
 * @param {number} page - Hozirgi sahifa (0-indeks)
 * @param {number} pageSize - Har bir sahifada nechta element bo'lishi
 * @param {number} cols - Qatorda nechta tugma bo'lishi (1 yoki 2)
 */
function createPaginationKeyboard(items, prefix, page = 0, pageSize = 8, cols = 1) {
  const totalPages = Math.ceil(items.length / pageSize);
  const currentPage = Math.max(0, Math.min(page, totalPages - 1));
  const startIndex = currentPage * pageSize;
  const currentItems = items.slice(startIndex, startIndex + pageSize);

  const buttons = [];

  if (cols === 2) {
    for (let i = 0; i < currentItems.length; i += 2) {
      const row = [];
      const item1 = currentItems[i];
      const index1 = startIndex + i;
      row.push(Markup.button.callback(item1, `${prefix}${index1}`));

      if (i + 1 < currentItems.length) {
        const item2 = currentItems[i + 1];
        const index2 = startIndex + i + 1;
        row.push(Markup.button.callback(item2, `${prefix}${index2}`));
      }
      buttons.push(row);
    }
  } else {
    currentItems.forEach((item, i) => {
      const actualIndex = startIndex + i;
      buttons.push([Markup.button.callback(item, `${prefix}${actualIndex}`)]);
    });
  }

  // Navigatsiya tugmalari (Oldingi / Sahifa / Keyingi)
  const navRow = [];
  if (currentPage > 0) {
    navRow.push(Markup.button.callback('⬅️ Oldingi', `${prefix}page:${currentPage - 1}`));
  } else {
    navRow.push(Markup.button.callback('⏹', 'noop'));
  }

  navRow.push(Markup.button.callback(`📄 ${currentPage + 1}/${totalPages}`, 'noop'));

  if (currentPage < totalPages - 1) {
    navRow.push(Markup.button.callback('Keyingi ➡️', `${prefix}page:${currentPage + 1}`));
  } else {
    navRow.push(Markup.button.callback('⏹', 'noop'));
  }
  buttons.push(navRow);

  // Bekor qilish tugmasi
  buttons.push([Markup.button.callback('❌ Bekor qilish', 'cancel_survey')]);

  return Markup.inlineKeyboard(buttons);
}

module.exports = {
  createPaginationKeyboard
};
