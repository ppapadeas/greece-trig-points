import { next, rewrite } from '@vercel/edge';

export const config = {
  matcher: '/point/:id*',
};

const BOT_PATTERNS = [
  'facebookexternalhit', 'Facebot', 'Twitterbot', 'LinkedInBot',
  'WhatsApp', 'TelegramBot', 'Slackbot', 'Discordbot',
  'Googlebot', 'bingbot', 'Applebot', 'redditbot', 'vkShare',
  'Pinterestbot', 'Embedly',
];

export default function middleware(req: Request) {
  const ua = req.headers.get('user-agent') || '';
  const isBot = BOT_PATTERNS.some(p => ua.includes(p));

  if (isBot) {
    const url = new URL(req.url);
    const gysId = url.pathname.split('/').pop();
    const dest = new URL(req.url);
    dest.pathname = '/api/og';
    dest.search = '';
    dest.searchParams.set('id', gysId ?? '');
    return rewrite(dest);
  }

  // Non-bot: pass through to static CDN (serves index.html)
  return next();
}
