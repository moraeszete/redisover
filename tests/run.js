const fs = require('fs');
const path = require('path');

(async () => {
  const files = fs.readdirSync(__dirname).filter(file => file.endsWith('.test.js')).sort();
  for (const file of files) {
    await require(path.join(__dirname, file))();
    console.log(`ok - ${file}`);
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
