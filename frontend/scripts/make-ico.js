const path = require('path');
const fs = require('fs');
const pngToIco = require('png-to-ico');

const input = path.join(__dirname, '..', 'public', 'offisphere-logo.png');
const out = path.join(__dirname, '..', 'public', 'offisphere.ico');

if (!fs.existsSync(input)) {
  console.error('Input PNG not found:', input);
  process.exit(1);
}

pngToIco(input)
  .then((buf) => fs.writeFileSync(out, buf))
  .then(() => console.log('Created', out))
  .catch((err) => {
    console.error('Failed to create ICO:', err);
    process.exit(2);
  });
