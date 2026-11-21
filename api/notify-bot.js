export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ ok: false, error: 'Method not allowed' });
    }

    const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    const GROUP_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '-1003624424535';

    if (!BOT_TOKEN) {
        return res.status(500).json({ ok: false, error: 'TELEGRAM_BOT_TOKEN is not set' });
    }

    try {
        const { name, phone, doctor, time } = req.body || {};
        if (!name || !phone || !doctor) {
            return res.status(400).json({ ok: false, error: 'Missing booking fields' });
        }

        const text =
            `🩺 <b>Янги қабулга ёзилиш (@druniversal_bot)</b>\n\n` +
            `👤 <b>Бемор:</b> ${escapeHtml(name)}\n` +
            `📞 <b>Телефон / Telegram:</b> ${escapeHtml(phone)}\n` +
            `👨‍⚕️ <b>Мутахассис:</b> ${escapeHtml(doctor)}\n` +
            `🕒 <b>Вақти:</b> ${escapeHtml(time || new Date().toLocaleString('uz-UZ'))}`;

        const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: GROUP_CHAT_ID,
                text,
                parse_mode: 'HTML'
            })
        });

        const tgData = await tgRes.json();
        if (!tgRes.ok || !tgData.ok) {
            return res.status(502).json({ ok: false, error: tgData.description || 'Telegram API error' });
        }

        return res.status(200).json({ ok: true });
    } catch (err) {
        return res.status(500).json({ ok: false, error: err.message });
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}