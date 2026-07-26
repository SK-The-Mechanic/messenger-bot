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

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request) {
    const body = await request.json();

    // Facebook sends "entry" array with messaging events
    if (body.object === 'page') {
        for (const entry of body.entry) {
            const webhookEvent = entry.messaging[0];
            const senderId = webhookEvent.sender.id;

            if (webhookEvent.message && webhookEvent.message.text) {
                const userMessage = webhookEvent.message.text;

                // We'll add the AI logic here next
                const replyText = await handleMessage(userMessage);

                await sendMessage(senderId, replyText);
            }
        }

        return new Response('EVENT_RECEIVED', { status: 200 });
    }

    return new Response('Not Found', { status: 404 });
}

async function handleMessage(userMessage) {
    // Placeholder for now — we'll wire up DeepSeek + Prisma queries next
    return `You said: ${userMessage}`;
}

async function sendMessage(senderId, text) {
    const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

    await fetch(`https://graph.facebook.com/v21.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipient: { id: senderId },
            message: { text },
        }),
    });
}