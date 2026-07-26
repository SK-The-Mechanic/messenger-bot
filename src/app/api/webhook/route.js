import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');
    const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        return new Response(challenge, { status: 200 });
    }
    return new Response('Forbidden', { status: 403 });
}

export async function POST(request) {
    console.log('=== POST HIT ===');

    const body = await request.json();

    if (body.object === 'page') {
        for (const entry of body.entry) {
            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender.id;

            if (webhookEvent.message && webhookEvent.message.text) {
                const userMessage = webhookEvent.message.text;
                console.log('USER MESSAGE:', userMessage);

                try {
                    const replyText = await handleMessage(senderId, userMessage);
                    console.log('AI REPLY:', replyText);
                    await sendMessage(senderId, replyText);
                } catch (err) {
                    console.log('ERROR IN HANDLER:', err.message);
                }
            }
        }
        return new Response('EVENT_RECEIVED', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
}

async function handleMessage(senderId, userMessage) {
    const pricingList = await prisma.servicePricing.findMany({ where: { active: true } });
    const unsupportedList = await prisma.unsupportedTech.findMany({ where: { active: true } });

    const pricingText = pricingList
        .map((p) => `- ${p.category}${p.subType ? ' (' + p.subType + ')' : ''}: ${p.techStack}, ৳${p.minPriceBDT}-${p.maxPriceBDT} BDT ($${p.minPriceUSD}-${p.maxPriceUSD} USD)${p.notes ? ' — ' + p.notes : ''}`)
        .join('\n');
    const unsupportedText = unsupportedList.map((t) => t.name).join(', ');

    const systemPrompt = `You are the friendly assistant for SK Tech's Facebook Page, a freelance dev studio in Bangladesh.
You reply in whichever language/mix the customer uses — English, Bangla, or Banglish — naturally and casually.

We build with: Next.js, React, Node.js, Express, MongoDB, PostgreSQL, React Native (for apps). These are all things we DO support — never reject a request just because it mentions Next.js specifically, since that's actually one of our main tools.

If the customer just greets you (hi, hello, hey, kemon acho, etc.) — greet them back warmly and briefly, ask how you can help. Don't jump into pricing unless they ask about a service.

Pricing info:
${pricingText}

We do NOT work with: ${unsupportedText}. Only decline if they specifically ask about one of these exact technologies.

Rules:
- Keep replies short — 1-3 sentences, casual Messenger tone.
- Ask what kind of app (E-commerce, Health, Food Delivery/navigation-style, etc.) if "app" is mentioned without specifics.
- Always mention both BDT and USD when quoting a price.`;

    // Fetch last 10 messages for this sender
    const history = await prisma.conversationMessage.findMany({
        where: { senderId },
        orderBy: { createdAt: 'asc' },
        take: 10,
    });

    const historyMessages = history.map((h) => ({ role: h.role, content: h.content }));

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemPrompt },
                ...historyMessages,
                { role: 'user', content: userMessage },
            ],
        }),
    });

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that right now.";

    // Save this exchange to history
    await prisma.conversationMessage.createMany({
        data: [
            { senderId, role: 'user', content: userMessage },
            { senderId, role: 'assistant', content: replyText },
        ],
    });

    return replyText;
}

async function sendMessage(senderId, text) {
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

    const res = await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipient: { id: senderId },
            message: { text },
        }),
    });

    const resData = await res.json();
    console.log('FB SEND RESPONSE:', JSON.stringify(resData));
}