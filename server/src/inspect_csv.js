const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../data/AL23.txt');
const stream = fs.createReadStream(filePath, { encoding: 'utf8', start: 0, end: 1000 });

stream.on('data', (chunk) => {
    const lines = chunk.split('\n');
    console.log('HEADER:', lines[0]);
    console.log('FIRST ROW:', lines[1]);
    stream.destroy();
});
