const fs = require('fs');

const bold = fs.readFileSync('public/fonts/IBMPlexMono-Bold.ttf', 'base64');
const reg = fs.readFileSync('public/fonts/IBMPlexMono-Regular.ttf', 'base64');
const varF = fs.readFileSync('public/fonts/PlayfairDisplay-Variable.ttf', 'base64');
const ital = fs.readFileSync('public/fonts/PlayfairDisplay-Italic.ttf', 'base64');

const code = `
export const IBMPlexMonoBold = '${bold}';
export const IBMPlexMonoRegular = '${reg}';
export const PlayfairDisplay = '${varF}';
export const PlayfairDisplayItalic = '${ital}';
`;

fs.writeFileSync('lib/fonts-b64.js', code);
console.log('Successfully created lib/fonts-b64.js');
