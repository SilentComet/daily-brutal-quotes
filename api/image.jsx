import { ImageResponse } from '@vercel/og';
import { getQuoteOfTheDay, getQuoteByNumber } from '../lib/quotes';

export const config = {
  runtime: 'edge',
};

// Helper to fetch TTF ArrayBuffer from Google Fonts
async function getFont(family, weight, style) {
  try {
    const url = 'https://fonts.googleapis.com/css2?family=' + family + ':ital,wght@' + (style === 'italic' ? '1,' : '0,') + weight;
    const cssRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1' }});
    const css = await cssRes.text();
    // Use a slightly more robust regex to find the TTF URL
    const resource = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
    if (resource) {
      const res = await fetch(resource[1]);
      if (res.ok) {
        return await res.arrayBuffer();
      }
    }
    return null;
  } catch (e) {
    console.error('Failed to load font', family, e);
    return null;
  }
}

const W = 1170;
const H = 2532;

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const theme = searchParams.get('theme') || 'neo';
    const dateParam = searchParams.get('date');
    const nParam = searchParams.get('n');

    if (!['neo', 'dark', 'brutal'].includes(theme)) {
      return new Response(JSON.stringify({ error: 'Invalid theme' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const quote = nParam
      ? getQuoteByNumber(parseInt(nParam, 10))
      : getQuoteOfTheDay(dateParam || null);

    const isDark = theme === 'dark';
    const isBrutal = theme === 'brutal';
    const isNeo = theme === 'neo';

    const bg = isDark ? '#0D0D0D' : (isBrutal ? '#FFFFFF' : '#FFED47');
    const textCol = isDark ? '#F0F0F0' : (isBrutal ? '#000000' : '#1A1A1A');
    const accent = isDark ? '#FFED47' : (isBrutal ? '#000000' : '#1A1A1A');
    const border = isDark ? '#2A2A2A' : (isBrutal ? '#000000' : '#1A1A1A');
    const tagBg = isDark ? '#FFED47' : (isBrutal ? '#000000' : '#1A1A1A');
    const tagText = isDark ? '#0D0D0D' : (isBrutal ? '#FFFFFF' : '#FFED47');
    const mutedText = isDark ? 'rgba(255,255,255,0.40)' : 'rgba(0,0,0,0.45)';
    const numColor = isDark ? 'rgba(255,237,71,0.05)' : (isBrutal ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.07)');

    const dateStr = new Date(quote.date + "T00:00:00Z").toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
    });

    const badgeText = `No. ${String(quote.number).padStart(3, "0")}`;

    let fontSize = 88;
    if (quote.text.length > 150) fontSize = 72;
    if (quote.text.length > 200) fontSize = 60;
    if (quote.text.length > 250) fontSize = 50;

    // Fetch fonts in parallel (only fetching the ones we need for this theme)
    const fontPromises = [];
    
    // Always need these for headers/numbers
    fontPromises.push(getFont('IBM+Plex+Mono', 700, 'normal').then(data => ({ name: 'IBMPlexMono', data, weight: 700, style: 'normal' })));
    fontPromises.push(getFont('IBM+Plex+Mono', 400, 'normal').then(data => ({ name: 'IBMPlexMonoRegular', data, weight: 400, style: 'normal' })));

    if (isBrutal) {
        // Brutal uses IBM Plex Mono for everything
    } else {
        // Neo and Dark use Playfair Display
        fontPromises.push(getFont('Playfair+Display', 700, 'normal').then(data => ({ name: 'PlayfairDisplay', data, weight: 700, style: 'normal' })));
        fontPromises.push(getFont('Playfair+Display', 700, 'italic').then(data => ({ name: 'PlayfairDisplayItalic', data, weight: 700, style: 'italic' })));
    }

    const loadedFonts = (await Promise.all(fontPromises)).filter(f => f.data !== null);

    if (searchParams.get('debug') === '1') {
      return new Response(JSON.stringify({
        loadedFonts: loadedFonts.map(f => ({ name: f.name, size: f.data?.byteLength, weight: f.weight, style: f.style })),
        failedFonts: (await Promise.all(fontPromises)).filter(f => f.data === null).map(f => f.name)
      }), { headers: { 'Content-Type': 'application/json' } });
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
            overflow: 'hidden',
          }}
        >
            {/* Border Frame */}
            {(isNeo || isBrutal) && (
                <div style={{
                    position: 'absolute',
                    top: 48, left: 48, right: 48, bottom: 48,
                    border: `24px solid ${border}`,
                    pointerEvents: 'none'
                }}></div>
            )}
             {(isNeo || isBrutal) && (
                 <>
                <div style={{ position: 'absolute', top: 36, left: 36, width: 24, height: 24, backgroundColor: border }}></div>
                <div style={{ position: 'absolute', top: 36, right: 36, width: 24, height: 24, backgroundColor: border }}></div>
                <div style={{ position: 'absolute', bottom: 36, left: 36, width: 24, height: 24, backgroundColor: border }}></div>
                <div style={{ position: 'absolute', bottom: 36, right: 36, width: 24, height: 24, backgroundColor: border }}></div>
                </>
            )}

          {/* Watermark Number */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontFamily: 'IBMPlexMono',
              fontSize: 620,
              fontWeight: 700,
              color: numColor,
              zIndex: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {quote.number}
          </div>

          {/* Header */}
          <div
            style={{
              position: 'absolute',
              top: 168,
              left: 0,
              right: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <span style={{
                fontFamily: 'IBMPlexMono',
                fontSize: 34,
                fontWeight: 700,
                color: accent,
                letterSpacing: 6
            }}>DAILY  BRUTAL  QUOTES</span>
            <div style={{
                width: W - 192,
                height: isBrutal ? 6 : 4,
                backgroundColor: accent,
                marginTop: 24
            }}></div>
          </div>

          {/* Main Content Area */}
          <div style={{
              position: 'absolute',
              top: H * 0.27,
              left: 96 + 8,
              right: 96 + 8,
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10
          }}>
              {/* Quote Mark */}
               <div style={{
                fontFamily: isBrutal ? 'IBMPlexMono' : 'PlayfairDisplay',
                fontSize: 200,
                fontWeight: 700,
                color: isDark ? 'rgba(255,237,71,0.07)' : (isBrutal ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.10)'),
                position: 'absolute',
                top: -100,
                left: -20
            }}>
                &quot;
            </div>

            {/* Quote Text */}
            <div style={{
                fontFamily: isBrutal ? 'IBMPlexMono' : 'PlayfairDisplayItalic',
                fontSize: fontSize,
                fontWeight: 700,
                fontStyle: isBrutal ? 'normal' : 'italic',
                color: textCol,
                lineHeight: 1.35,
                marginBottom: 60,
                display: 'flex',
                flexWrap: 'wrap'
            }}>
                {quote.text}
            </div>

             {/* Accent Line */}
             <div style={{
                width: 140,
                height: 7,
                backgroundColor: isDark ? '#FFED47' : (isBrutal ? '#000000' : '#FF4B4B'),
                marginBottom: 54
            }}></div>

            {/* Meta (Badge + Date) */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* Badge */}
                <div style={{ display: 'flex', position: 'relative' }}>
                    {isNeo && (
                        <div style={{
                            position: 'absolute',
                            top: 7, left: 7, right: -7, bottom: -7,
                            backgroundColor: border,
                            zIndex: 1
                        }}></div>
                    )}
                    <div style={{
                        display: 'flex',
                        backgroundColor: tagBg,
                        border: isBrutal ? `4px solid ${border}` : 'none',
                        padding: '16px 26px',
                        zIndex: 2,
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <span style={{
                            fontFamily: 'IBMPlexMono',
                            fontSize: 30,
                            fontWeight: 700,
                            color: tagText
                        }}>
                            {badgeText}
                        </span>
                    </div>
                </div>

                {/* Date */}
                <div style={{
                     fontFamily: 'IBMPlexMonoRegular',
                     fontSize: 26,
                     color: mutedText,
                     marginLeft: 24
                }}>
                    {dateStr}
                </div>
            </div>

          </div>

          {/* Footer */}
          <div style={{
              position: 'absolute',
              bottom: 110,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              fontFamily: 'IBMPlexMono',
              fontSize: 24,
              color: mutedText,
              zIndex: 10
          }}>
              daily-brutal-quotes.vercel.app
          </div>

        </div>
      ),
      {
        width: W,
        height: H,
        fonts: loadedFonts,
      }
    );
  } catch (e) {
    console.error(e);
    return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
  }
}
