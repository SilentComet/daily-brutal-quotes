import { ImageResponse } from '@vercel/og';
import { getQuoteOfTheDay, getQuoteByNumber } from '../lib/quotes';

export const config = {
  runtime: 'edge',
};

const W = 1170;
const H = 2532;

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const theme = searchParams.get('theme') || 'neo';
    const nParam = searchParams.get('n');

    const quote = nParam
      ? getQuoteByNumber(parseInt(nParam, 10))
      : getQuoteOfTheDay(null);

    const isDark = theme === 'dark';
    const isBrutal = theme === 'brutal';
    const isNeo = theme === 'neo';

    const bg = isDark ? '#0D0D0D' : (isBrutal ? '#FFFFFF' : '#FFED47');
    const textCol = isDark ? '#F0F0F0' : (isBrutal ? '#000000' : '#1A1A1A');

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            width: '100%',
            height: '100%',
            backgroundColor: bg,
            flexDirection: 'column',
            position: 'relative',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ fontSize: 100, color: textCol, display: 'flex' }}>
            Testing basic text rendering
          </div>
          <div style={{ fontSize: 60, color: textCol, marginTop: 40, display: 'flex' }}>
            {quote.text}
          </div>
        </div>
      ),
      {
        width: W,
        height: H,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}
