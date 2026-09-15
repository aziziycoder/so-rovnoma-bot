# Mahallalardagi oilalarning ijtimoiy holatini o‘rganish Telegram Boti

Ushbu bot mahallalardagi oilalarning ijtimoiy holatini o‘rganish bo‘yicha 8 ta savoldan iborat so‘rovnomani o‘tkazadi va to‘plangan ma'lumotlarni (jumladan rasmni) avtomatik **Google Sheets** jadvaliga yozib boradi.

---

## 1-QADAM: Google Sheets'da Apps Script (Webhook) sozlash

1. Google Sheets jadvalingizni brauzerda oching:
   👉 [Google Sheets jadvali](https://docs.google.com/spreadsheets/d/1DO8LfpG6dpU4gERSxpUtt_p1PGdcmYbr19gPQsrqry0/edit)
2. Yuqori menyudan: **Расширения (Extensions)** -> **Apps Script** bo'limiga kiring.
3. Loyihamizdagi `google-apps-script/Code.gs` fayli ichidagi kodni to'liq nusxalab, Apps Script muharriridagi barcha narsani o'chirib, o'rniga qo'ying.
4. **Saqlash (Ctrl + S)** belgisini bosing.
5. Yuqori o'ng burchakdagi ko'k **"Начать развертывание" (Deploy)** tugmasini bosing -> **"Новое развертывание" (New deployment)**.
6. Chap tarafdagi tishli g'ildirakcha (⚙️) belgisini bosib **"Веб-приложение" (Web app)** ni tanlang.
7. Sozlamalarni quyidagicha belgilang:
   * **Описание (Description):** `Telegram Survey Bot`
   * **Запуск от имени (Execute as):** `Я (Me)`
   * **У кого есть доступ (Who has access):** `Все (Anyone)` ⚠️ *Juda muhim: "Все" tanlanishi shart!*
8. **Развернуть (Deploy)** tugmasini bosing va so'ralgan ruxsatlarni tasdiqlang (**Предоставить доступ** -> O'z Google profilingizni tanlang -> **Advanced (Дополнительно)** -> **Go to ... (Небезопасно)** -> **Allow (Разрешить)**).
9. Sizga **URL веб-приложения (Web app URL)** beriladi:
   Masalan: `https://script.google.com/macros/s/AKfycb.../exec`
10. O'sha URL manzilni nusxalab oling.

---

## 2-QADAM: Lokal kompyuterda sinab ko'rish

1. `.env` faylini oching va 1-qadamda olgan URL'ingizni qo'ying:
   ```env
   BOT_TOKEN=8560293780:AAFpa9PmdRYKrvXu-nJsRchWEH1QJ5PR2M0
   GOOGLE_SCRIPT_URL=https://script.google.com/macros/s/SIZNING_SCRIPT_ID/exec
   PORT=3000
   ```
2. Terminalda botni ishga tushiring:
   ```bash
   npm start
   ```
3. Telegram'da [@Linkify_tgbot](https://t.me/Linkify_tgbot) ga kirib `/start` bosing va so'rovnomani to'ldirib ko'ring!

---

## 3-QADAM: Render.com ga bepul joylash (Deploy qilish)

Render.com da botingiz 24/7 bepul ishlab turadi.

1. Loyihani GitHub repozitoriyingizga yuklang:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - survey bot"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO_NAME.git
   git push -u origin main
   ```
2. [Render.com](https://render.com) saytiga kiring va GitHub orqali ro'yxatdan o'ting.
3. **New +** tugmasini bosing -> **Web Service** ni tanlang.
4. GitHub repozitoriyingizni ulang (`Connect`).
5. Sozlamalarni quyidagicha to'ldiring:
   * **Name:** `mahalla-sorovnoma-bot`
   * **Region:** Frankfurt (yoki yaqinroq istalgan server)
   * **Branch:** `main`
   * **Runtime:** `Node`
   * **Build Command:** `npm install`
   * **Start Command:** `npm start`
   * **Instance Type:** `Free`
6. **Environment Variables** bo'limiga quyidagi 2 ta o'zgaruvchini qo'shing:
   * `BOT_TOKEN` = `8560293780:AAFpa9PmdRYKrvXu-nJsRchWEH1QJ5PR2M0`
   * `GOOGLE_SCRIPT_URL` = `1-qadamda olingan Apps Script Webhook URL manzili`
7. **Create Web Service** tugmasini bosing.

---

## 4-QADAM: Render bepul rejasida bot uxlab qolmasligi uchun (Tavsiya)

Render bepul Web Service'lari agar 15 daqiqa davomida so'rov kelmasa uxlaydi (sleep mode). Bot har doim uyg'oq turishi uchun:
1. Render sizga bergan URL manzilni nusxalang (masalan: `https://mahalla-sorovnoma-bot.onrender.com`).
2. Bepul [cron-job.org](https://cron-job.org) yoki [uptimerobot.com](https://uptimerobot.com) saytiga kiring.
3. Yangi monitor qo'shing: har **10 daqiqada** o'sha URL manzilga `GET` so'rov yuborishni sozlang.
4. Shunda Render hech qachon uxlamaydi va botingiz 24/7 uzluksiz ishlaydi!
