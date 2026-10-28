const fs = require('fs');
const path = require('path');

const slidesDir = path.join(__dirname, 'pptx_slides', 'ppt', 'slides');
const files = fs.readdirSync(slidesDir).filter(f => f.endsWith('.xml') && !f.startsWith('_'));

console.log(`Found ${files.length} slides.`);

const results = [];

files.forEach(file => {
  const content = fs.readFileSync(path.join(slidesDir, file), 'utf8');
  const texts = [];
  const regex = /<a:t>(.*?)<\/a:t>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    texts.push(match[1]);
  }
  const slideText = texts.join(' ');
  if (/과원|재배|월별|상시|캘린더|달력/i.test(slideText)) {
    results.push({ file, text: slideText });
  }
});

results.forEach(r => {
  console.log(`\n=================== [ ${r.file} ] ===================`);
  console.log(r.text);
});
