const TelegramBot = require('node-telegram-bot-api');

const token = 'SIZNING_BOT_TOKENINGIZ';
const bot = new TelegramBot(token, { polling: true });
const ADMIN_CHAT_ID = 'SIZNING_TELEGRAM_IDINGIZ';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Мутахассислар ҳолати (намуна маълумот — ўзингизнинг жадвал/база билан алмаштиришингиз мумкин)
const specialists = [
    { name: 'Зохиджон Зокиров', specialty: 'Мануал терапия / Массаж', status: 'Бугун соат 15:00 дан бўш' },
    { name: 'Навбатчи мутахассис', specialty: 'Умумий қабул', status: 'Ҳозир банд' }
];

// 1. Мутахассислар ҳолати ҳақида қисқача маълумот тайёрлаш
async function getSpecialistsSummary() {
    const rawList = specialists
        .map(s => `- ${s.name} (${s.specialty}): ${s.status}`)
        .join('\n');

    if (!GEMINI_API_KEY) {
        return rawList;
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Қуйидаги мутахассислар ҳолати асосида фойдаланувчига жуда қисқа, аниқ ва хушмуомала маълумот тайёрла (ўзбек тилида):\n${rawList}`
                        }]
                    }]
                })
            }
        );

        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || rawList;
    } catch (err) {
        console.log('Мутахассислар маълумотида хатолик:', err.message);
        return rawList;
    }
}

// 2. Фойдаланувчига йўналтирувчи маслаҳат бериш
async function getUserAdvice(userQuestion, doctorName = '') {
    if (!GEMINI_API_KEY) {
        return 'Қабул учун мутахассисга мурожаат қилишингизни тавсия этамиз.';
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: `Фойдаланувчи сўрови: "${userQuestion}". Танланган йўналиш: "${doctorName}". ` +
                                  `Қисқа (3-4 гап) фойдали ва эҳтиёткор маслаҳат бер (ўзбек тилида). ` +
                                  `Аниқ ташхис ёки муолажа буюрма, охирида мутахассис кўриги муҳимлигини эслат.`
                        }]
                    }]
                })
            }
        );

        const data = await response.json();
        return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
            'Мутахассис билан боғланиб, ҳолатингизни батафсил тушунтиришингизни тавсия этамиз.';
    } catch (err) {
        console.log('Маслаҳат олишда хатолик:', err.message);
        return 'Ҳозирча маслаҳат олиш имкони бўлмади, лекин қабулга ёзилишингиз мумкин.';
    }
}

// Қабулга ёзилганда админга хабар + AI маслаҳат
async function notifyAdminAboutBooking(patientName, patientPhone, doctorName, patientNote = '') {
    const advice = patientNote ? await getUserAdvice(patientNote, doctorName) : '';

    let message =
        `🚨 *ЯНГИ ҚАБУЛГА ЁЗИЛИШ!*\n\n` +
        `👤 Бемор: ${patientName}\n` +
        `📞 Тел/Телеграм: ${patientPhone}\n` +
        `👨‍⚕️ Танлови: ${doctorName}\n` +
        `⏰ Вақти: ${new Date().toLocaleString()}`;

    if (advice) {
        message += `\n\n💡 *AI йўналтирувчи маслаҳат:* ${advice}`;
    }

    bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'Markdown' })
        .then(() => console.log('Админга хабар юборилди!'))
        .catch((error) => console.log('Хатолик юз берди:', error.code));
}