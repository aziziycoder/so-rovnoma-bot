const axios = require('axios');

/**
 * Telegram file_id orqali rasmni yuklab olib, base64 ga o'tkazish
 */
async function getTelegramPhotoBase64(telegram, fileId) {
  try {
    const fileLink = await telegram.getFileLink(fileId);
    const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data);
    return {
      base64: buffer.toString('base64'),
      mime: 'image/jpeg',
      fileUrl: fileLink.href
    };
  } catch (error) {
    console.error('Rasmni yuklashda xatolik:', error.message);
    return null;
  }
}

/**
 * So'rovnoma ma'lumotlarini Google Apps Script Webhook'iga yuborish
 */
async function sendToGoogleSheet(surveyData, telegram) {
  const rawUrl = process.env.GOOGLE_SCRIPT_URL;
  const scriptUrl = rawUrl ? rawUrl.trim() : null;

  if (!scriptUrl) {
    console.warn('DIQQAT: GOOGLE_SCRIPT_URL .env faylida ko\'rsatilmagan!');
    return {
      success: false,
      error: 'GOOGLE_SCRIPT_URL sozlanmagan'
    };
  }

  try {
    let imageBase64 = null;
    let imageName = null;
    let photoUrl = null;

    if (surveyData.photoFileId && telegram) {
      const imgData = await getTelegramPhotoBase64(telegram, surveyData.photoFileId);
      if (imgData) {
        imageBase64 = imgData.base64;
        imageName = `mahalla_${Date.now()}.jpg`;
        photoUrl = imgData.fileUrl;
      }
    }

    const payload = {
      mahalla: surveyData.mahalla,
      vakil: surveyData.vakil,
      birgaIshlagan: surveyData.birgaIshlagan,
      telefon: surveyData.telefon,
      qilinganIsh: surveyData.qilinganIsh,
      muammo: surveyData.muammo,
      amaliyIsh: surveyData.amaliyIsh,
      imageBase64: imageBase64,
      imageName: imageName,
      imageMime: 'image/jpeg',
      photoUrl: photoUrl
    };

    console.log("Google Sheets'ga yuborilmoqda...");
    const res = await axios.post(scriptUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 45000,
      maxRedirects: 10,
      maxContentLength: Infinity,
      maxBodyLength: Infinity
    });

    if (res.data && res.data.status === 'success') {
      return {
        success: true,
        data: res.data
      };
    } else {
      return {
        success: false,
        error: res.data ? res.data.message : 'Noma\'lum javob'
      };
    }
  } catch (err) {
    console.error('Google Sheets ga yuborishda xatolik:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

module.exports = {
  sendToGoogleSheet,
  getTelegramPhotoBase64
};
