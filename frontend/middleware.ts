import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: '/point/:id*',
};

const BOT_PATTERNS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'WhatsApp', 'TelegramBot', 'Slackbot', 'Discordbot',
  'Googlebot', 'bingbot', 'Applebot', 'redditbot', 'vkShare',
  'Pinterestbot', 'Embedly',
];

export default function middleware(req: NextRequest) {
  const ua = req.headers.get('user-agent') || '';
  const isBot = BOT_PATTERNS.some(p => ua.includes(p));

  if (isBot) {
    const url = req.nextUrl.clone();
    const gysId = url.pathname.split('/').pop();
    url.pathname = '/api/og';
    url.searchParams.set('id', gysId ?? '');
    return NextResponse.rewrite(url);
  }

  // Non-bot: let Vercel serve index.html as normal
  return NextResponse.next();
}
