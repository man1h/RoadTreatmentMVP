const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/AL23.txt');
const stream = fs.createReadStream(filePath, { encoding: 'utf8', start: 0, end: 2000 });

stream.on('data', (chunk) => {
    const lines = chunk.split('\n');
    fs.writeFileSync(path.join(__dirname, 'headers.txt'), lines[0]);
    stream.destroy();
});
