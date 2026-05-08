import { ImageResponse } from '@vercel/og';
import { getQuoteOfTheDay, getQuoteByNumber } from '../lib/quotes';
import { IBMPlexMonoBold, IBMPlexMonoRegular, PlayfairDisplay, PlayfairDisplayItalic } from '../lib/fonts-b64';

export const config = {
  runtime: 'edge',
};

const W = 1170;
const H = 2532;

function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export default async function handler(req) {
  try {
    const { searchParams } = new URL(req.url);
    const theme = searchParams.get('theme') || 'neo';
    const dateParam = searchParams.get('date');
    const nParam = searchParams.get('n');

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

    // Load fonts. NOTE: We avoid PlayfairDisplay-Variable.ttf as Satori doesn't support variable fonts.
    const loadedFonts = [
        { name: 'IBMPlexMono', data: base64ToArrayBuffer(IBMPlexMonoBold), weight: 700, style: 'normal' },
        { name: 'IBMPlexMonoRegular', data: base64ToArrayBuffer(IBMPlexMonoRegular), weight: 400, style: 'normal' }
    ];

    if (!isBrutal) {
        // Use static Italic font for both normal and italic slots to avoid variable font poison
        loadedFonts.push({ name: 'PlayfairDisplay', data: base64ToArrayBuffer(PlayfairDisplayItalic), weight: 700, style: 'normal' });
        loadedFonts.push({ name: 'PlayfairDisplayItalic', data: base64ToArrayBuffer(PlayfairDisplayItalic), weight: 700, style: 'italic' });
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
                    display: 'flex',
                }}></div>
            )}
             {(isNeo || isBrutal) && (
                 <div style={{ display: 'flex' }}>
                    <div style={{ position: 'absolute', top: 36, left: 36, width: 24, height: 24, backgroundColor: border }}></div>
                    <div style={{ position: 'absolute', top: 36, right: 36, width: 24, height: 24, backgroundColor: border }}></div>
                    <div style={{ position: 'absolute', bottom: 36, left: 36, width: 24, height: 24, backgroundColor: border }}></div>
                    <div style={{ position: 'absolute', bottom: 36, right: 36, width: 24, height: 24, backgroundColor: border }}></div>
                </div>
            )}

          {/* Watermark Number - Fixed with Flex Centering (Bug 3) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 0,
            }}
          >
            <div style={{
              fontFamily: 'IBMPlexMono',
              fontSize: 620,
              fontWeight: 700,
              color: numColor,
            }}>
              {quote.number}
            </div>
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
            <div style={{
                fontFamily: 'IBMPlexMono',
                fontSize: 34,
                fontWeight: 700,
                color: accent,
                display: 'flex',
            }}>DAILY BRUTAL QUOTES</div>
            <div style={{
                width: W - 192,
                height: isBrutal ? 6 : 4,
                backgroundColor: accent,
                marginTop: 24,
                display: 'flex',
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
              {/* Quote Mark - Fixed HTML Entity (Bug 2) */}
               <div style={{
                fontFamily: isBrutal ? 'IBMPlexMono' : 'PlayfairDisplay',
                fontSize: 200,
                fontWeight: 700,
                color: isDark ? 'rgba(255,237,71,0.07)' : (isBrutal ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.10)'),
                position: 'absolute',
                top: -100,
                left: -20,
                display: 'flex',
            }}>
                {'\u201C'}
            </div>

            {/* Quote Text - Removed display:flex (Bug 1) */}
            <div style={{
                fontFamily: isBrutal ? 'IBMPlexMono' : 'PlayfairDisplayItalic',
                fontSize: fontSize,
                fontWeight: 700,
                fontStyle: isBrutal ? 'normal' : 'italic',
                color: textCol,
                lineHeight: 1.35,
                marginBottom: 60,
                // Block layout handles text wrapping natively in Satori
            }}>
                {quote.text}
            </div>

             {/* Accent Line */}
             <div style={{
                width: 140,
                height: 7,
                backgroundColor: isDark ? '#FFED47' : (isBrutal ? '#000000' : '#FF4B4B'),
                marginBottom: 54,
                display: 'flex',
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
                            zIndex: 1,
                            display: 'flex',
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
                            color: tagText,
                            display: 'flex',
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
                     marginLeft: 24,
                     display: 'flex',
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
