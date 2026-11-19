const TelegramBot = require('node-telegram-bot-api');
const token = 'SIZNING_BOT_TOKENINGIZ';
const bot = new TelegramBot(token, { polling: true });

// Админнинг Telegram ID рақами (ўзингизнинг ID рақамингизни ёзасиз)
const ADMIN_CHAT_ID = 'SIZNING_TELEGRAM_IDINGIZ';

// Бемор қабулга ёзилиш формасини тўлдириб юборганда чақириладиган функция:
function notifyAdminAboutBooking(patientName, patientPhone, doctorName) {
    const message = `🚨 **ЯНГИ ҚАБУЛГА ЁЗИЛИШ!**\n\n` +
                    `👤 Бемор: ${patientName}\n` +
                    `📞 Тел/Телеграм: ${patientPhone}\n` +
                    `👨‍⚕️ Танлови: ${doctorName}\n` +
                    `⏰ Вақти: ${new Date().toLocaleString()}`;

    // Telegram API орқали админга хабар юбориш
    bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'Markdown' })
        .then(() => {
            console.log("Админга хабар юборилди!");
        })
        .catch((error) => {
            console.log("Хатолик юз берди: ", error.code);
        });
}