// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();

// export async function GET(request) {
//     const { searchParams } = new URL(request.url);

//     const mode = searchParams.get('hub.mode');
//     const token = searchParams.get('hub.verify_token');
//     const challenge = searchParams.get('hub.challenge');

//     const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN;

//     if (mode === 'subscribe' && token === VERIFY_TOKEN) {
//         return new Response(challenge, { status: 200 });
//     }

//     return new Response('Forbidden', { status: 403 });
// }

// export async function POST(request) {
//     const body = await request.json();

//     if (body.object === 'page') {
//         for (const entry of body.entry) {
//             const webhookEvent = entry.messaging[0];
//             const senderId = webhookEvent.sender.id;

//             if (webhookEvent.message && webhookEvent.message.text) {
//                 const userMessage = webhookEvent.message.text;
//                 const replyText = await handleMessage(userMessage);
//                 await sendMessage(senderId, replyText);
//             }
//         }

//         return new Response('EVENT_RECEIVED', { status: 200 });
//     }

//     return new Response('Not Found', { status: 404 });
// }

// async function handleMessage(userMessage) {
//     // 1. Pull real pricing + unsupported tech data from your DB
//     const pricingList = await prisma.servicePricing.findMany({ where: { active: true } });
//     const unsupportedList = await prisma.unsupportedTech.findMany({ where: { active: true } });

//     // 2. Turn that data into readable text for the AI to reference
//     const pricingText = pricingList
//         .map(
//             (p) =>
//                 `- ${p.category}${p.subType ? ' (' + p.subType + ')' : ''}: ${p.techStack}, ৳${p.minPriceBDT}-${p.maxPriceBDT} BDT ($${p.minPriceUSD}-${p.maxPriceUSD} USD)${p.notes ? ' — ' + p.notes : ''}`
//         )
//         .join('\n');

//     const unsupportedText = unsupportedList.map((t) => t.name).join(', ');

//     // 3. Build the system prompt with real data embedded
//     const systemPrompt = `You are the friendly assistant for SK Tech's Facebook Page, a freelance dev studio in Bangladesh.
// You reply in whichever language/mix the customer uses — English, Bangla, or Banglish — naturally and casually, like a real person chatting on Messenger, not a formal bot.

// Here is our current service pricing:
// ${pricingText}

// We do NOT work with: ${unsupportedText}. If asked about these, politely decline and don't offer a price.

// Rules:
// - If someone asks about a website, quote the Website pricing.
// - If someone asks about an app, ask what kind (E-commerce, Health, Food Delivery/navigation-style, etc.) if they haven't specified, then quote the matching price.
// - Keep replies short — 1-3 sentences, Messenger style, not an essay.
// - Always mention both BDT and USD when quoting a price.
// - If asked about tech we don't support, politely say sorry, we don't work with that.`;

//     // 4. Call DeepSeek
//     const response = await fetch('https://api.deepseek.com/chat/completions', {
//         method: 'POST',
//         headers: {
//             'Content-Type': 'application/json',
//             Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
//         },
//         body: JSON.stringify({
//             model: 'deepseek-chat',
//             messages: [
//                 { role: 'system', content: systemPrompt },
//                 { role: 'user', content: userMessage },
//             ],
//         }),
//     });

//     const data = await response.json();
//     return data.choices?.[0]?.message?.content || "Sorry, I couldn't process that right now.";
// }

// async function sendMessage(senderId, text) {
//     const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

//     await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//             recipient: { id: senderId },
//             message: { text },
//         }),
//     });
// }

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
    console.log('BODY RECEIVED:', JSON.stringify(body));

    if (body.object === 'page') {
        for (const entry of body.entry) {
            console.log('ENTRY:', JSON.stringify(entry));

            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender.id;
            console.log('SENDER ID:', senderId);

            if (webhookEvent.message && webhookEvent.message.text) {
                const userMessage = webhookEvent.message.text;
                console.log('USER MESSAGE:', userMessage);

                try {
                    const replyText = await handleMessage(userMessage);
                    console.log('AI REPLY:', replyText);

                    await sendMessage(senderId, replyText);
                    console.log('SEND MESSAGE CALLED');
                } catch (err) {
                    console.log('ERROR IN HANDLER:', err.message);
                }
            } else {
                console.log('NO TEXT MESSAGE FOUND IN EVENT');
            }
        }
        return new Response('EVENT_RECEIVED', { status: 200 });
    }

    console.log('OBJECT WAS NOT "page":', body.object);
    return new Response('Not Found', { status: 404 });
}

async function handleMessage(userMessage) {
    const pricingList = await prisma.servicePricing.findMany({ where: { active: true } });
    const unsupportedList = await prisma.unsupportedTech.findMany({ where: { active: true } });

    const pricingText = pricingList
        .map((p) => `- ${p.category}${p.subType ? ' (' + p.subType + ')' : ''}: ${p.techStack}, ৳${p.minPriceBDT}-${p.maxPriceBDT} BDT ($${p.minPriceUSD}-${p.maxPriceUSD} USD)${p.notes ? ' — ' + p.notes : ''}`)
        .join('\n');

    const unsupportedText = unsupportedList.map((t) => t.name).join(', ');

    const systemPrompt = `You are the friendly assistant for SK Tech's Facebook Page...
Pricing:
${pricingText}
We do NOT work with: ${unsupportedText}.`;

    const response = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userMessage },
            ],
        }),
    });

    const data = await response.json();
    console.log('DEEPSEEK RAW RESPONSE:', JSON.stringify(data));

    return data.choices?.[0]?.message?.content || "Sorry, I couldn't process that right now.";
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