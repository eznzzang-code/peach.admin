const fs = require('fs');
const path = require('path');
const slidesDir = path.join(__dirname, 'pptx_slides', 'ppt', 'slides');

['slide17.xml', 'slide18.xml', 'slide19.xml', 'slide20.xml'].forEach(file => {
  if (fs.existsSync(path.join(slidesDir, file))) {
    const content = fs.readFileSync(path.join(slidesDir, file), 'utf8');
    const texts = [];
    const regex = /<a:t>(.*?)<\/a:t>/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      texts.push(match[1]);
    }
    console.log(`\n=================== [ ${file} ] ===================`);
    console.log(texts.join(' '));
  }
});
