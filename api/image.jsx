import { ImageResponse } from '@vercel/og';
import { getQuoteOfTheDay, getQuoteByNumber } from '../lib/quotes';
import fs from 'fs';
import path from 'path';

const W = 1170;
const H = 2532;

// Load fonts from the filesystem since we are running in standard Node.js
function getFont(filename) {
    try {
        const filePath = path.join(process.cwd(), 'public', 'fonts', filename);
        if (!fs.existsSync(filePath)) return null;
        const fontBuffer = fs.readFileSync(filePath);
        return fontBuffer.buffer.slice(fontBuffer.byteOffset, fontBuffer.byteOffset + fontBuffer.byteLength);
    } catch (e) {
        console.error('Failed to load font', filename, e);
        return null;
    }
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url, 'http://localhost');
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
    
    // Load font
    const ibmBold = getFont('IBMPlexMono-Bold.ttf');
    const fonts = [];
    if (ibmBold) {
        fonts.push({
            name: 'IBMPlexMono',
            data: ibmBold,
            weight: 700,
            style: 'normal'
        });
    }

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
          <div style={{ fontFamily: 'IBMPlexMono', fontSize: 100, color: textCol, display: 'flex' }}>
            Testing Node.js Text Rendering
          </div>
          <div style={{ fontFamily: 'IBMPlexMono', fontSize: 60, color: textCol, marginTop: 40, display: 'flex' }}>
            {quote.text}
          </div>
        </div>
      ),
      {
        width: W,
        height: H,
        fonts: fonts
      }
    );
  } catch (e) {
    console.error(e);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}
