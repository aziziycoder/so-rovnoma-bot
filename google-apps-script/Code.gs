/**
 * Google Apps Script - So'rovnoma Telegram boti uchun Webhook
 * 
 * Qanday sozlanadi:
 * 1. Google Sheets jadvalingizni oching (https://docs.google.com/spreadsheets/d/1DO8LfpG6dpU4gERSxpUtt_p1PGdcmYbr19gPQsrqry0/edit)
 * 2. Yuqori menyudan: Kengaytmalar (Extensions) -> Apps Script bo'limiga kiring.
 * 3. U yerdagi mavjud kodni o'chirib, ushbu kodni to'liq joylashtiring.
 * 4. "Saqlash" (Save) belgisini bosing.
 * 5. Yuqori o'ng burchakdagi ko'k "Deploy" (Yoyish) tugmasini bosing -> "New deployment" (Yangi yoyilma).
 * 6. Chap tomondagi tishli g'ildirakcha (⚙️) belgisini bosib "Web app" ni tanlang.
 * 7. Quyidagicha to'ldiring:
 *    - Description: Telegram Survey Bot
 *    - Execute as: Me (Mening nomimdan)
 *    - Who has access: Anyone (Har kim)  <--- JUDA MUHIM!
 * 8. "Deploy" tugmasini bosing, so'ralgan ruxsatlarni tasdiqlang (Authorize access).
 * 9. Berilgan "Web app URL" havolasini nusxalab oling (masalan: https://script.google.com/macros/s/.../exec).
 * 10. O'sha URL'ni botning .env faylidagi GOOGLE_SCRIPT_URL parametriga qo'ying.
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'No post data received'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Birinchi varaq (Google Form javoblari yoziladigan asosiy varaq)
    var sheet = ss.getSheets()[0];
    
    var timestamp = new Date();
    var mahalla = data.mahalla || '';
    var vakil = data.vakil || '';
    var birgaIshlagan = data.birgaIshlagan || '';
    var telefon = data.telefon || '';
    var qilinganIsh = data.qilinganIsh || '';
    var muammo = data.muammo || '';
    var amaliyIsh = data.amaliyIsh || '';
    var rasmUrl = '';

    // Agar rasm base64 formatda yuborilgan bo'lsa, Google Drive'ga saqlaymiz
    if (data.imageBase64) {
      try {
        var folderName = "So'rovnoma rasmlari";
        var folders = DriveApp.getFoldersByName(folderName);
        var folder;
        if (folders.hasNext()) {
          folder = folders.next();
        } else {
          folder = DriveApp.createFolder(folderName);
        }
        
        var fileName = data.imageName || ("rasm_" + Utilities.formatDate(new Date(), "GMT+5", "yyyyMMdd_HHmmss") + ".jpg");
        var decoded = Utilities.base64Decode(data.imageBase64);
        var blob = Utilities.newBlob(decoded, data.imageMime || 'image/jpeg', fileName);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        rasmUrl = file.getUrl();
      } catch (imgErr) {
        rasmUrl = data.photoUrl || ("Rasm saqlashda xato: " + imgErr.toString());
      }
    } else if (data.photoUrl) {
      rasmUrl = data.photoUrl;
    }

    // Google Sheets jadvaliga yangi qator qo'shish
    sheet.appendRow([
      timestamp,
      mahalla,
      vakil,
      birgaIshlagan,
      telefon,
      qilinganIsh,
      muammo,
      amaliyIsh,
      rasmUrl
    ]);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      message: "Ma'lumotlar jadvalga muvaffaqiyatli saqlandi",
      row: sheet.getLastRow(),
      fileUrl: rasmUrl
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'ok',
    message: "Google Apps Script Webhook faol holatda!"
  })).setMimeType(ContentService.MimeType.JSON);
}
