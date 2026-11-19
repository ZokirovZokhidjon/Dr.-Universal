export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY созланмаган' });
    }

    const { question, doctors = [], history = [] } = req.body || {};
    if (!question || !question.trim()) {
        return res.status(400).json({ error: 'Савол киритилмади' });
    }

    const doctorsText = doctors.length
        ? doctors.map(d => `- ${d.name}: ${d.status}${d.note ? ` (${d.note})` : ''}`).join('\n')
        : 'Мутахассислар ҳолати ҳозирча кўрсатилмаган.';

    const systemInstruction =
        `Сен "Dr. Universal" соғломлаштириш ва ўқув марказининг онлайн маслаҳатчиси — доктор формасидаги хушмуомала қиз, Зинасан.\n` +
        `Вазифанг:\n` +
        `1) Фойдаланувчи билан худди жонли суҳбатдошдек самимий, тушунарли ва батафсил гаплаш. Салом берса, аввал хушмуомала алик ол ва ҳол-аҳвол сўра.\n` +
        `2) Мутахассисларнинг бўш ёки бандлиги сўралсагина қуйидаги маълумотга таян:\n${doctorsText}\n` +
        `3) Шикоят ёки савол берилса, фойдали йўналтирувчи маслаҳат бер (мануал терапия, хижама, биокоррекция ва қабулга тайёрланиш юзасидан).\n` +
        `4) Аниқ тиббий ташхис қўйма, даволаш буюрма; маслаҳат охирида аниқ ташхис ва муолажани мутахассис белгилашини қисқа эслат.\n` +
        `5) Жавобни табиий ва равон ўзбек тилида ёз.`;

    const contents = [
        ...history.slice(-6),
        {
            role: 'user',
            parts: [{ text: question.trim() }]
        }
    ];

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: systemInstruction }]
                    },
                    contents
                })
            }
        );

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

        if (!reply) {
            return res.status(502).json({ error: 'Моделдан жавоб олинмади' });
        }

        return res.status(200).json({ reply });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}