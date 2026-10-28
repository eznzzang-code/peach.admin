const fs = require('fs');
const path = require('path');

const slidesDir = path.join(__dirname, 'pptx_slides', 'ppt', 'slides');
const files = fs.readdirSync(slidesDir).filter(f => f.endsWith('.xml') && !f.startsWith('_'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(slidesDir, file), 'utf8');
  const texts = [];
  const regex = /<a:t>(.*?)<\/a:t>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    texts.push(match[1]);
  }
  const slideText = texts.join(' ');
  if (/월별\s*과원관리|과원/i.test(slideText)) {
    console.log(`\n=================== [ ${file} ] ===================`);
    console.log(slideText);
  }
});
