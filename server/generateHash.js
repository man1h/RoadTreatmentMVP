const bcrypt = require('bcrypt');
const fs = require('fs');

const generate = async () => {
    const salt = await bcrypt.genSalt(10);
    const adminHash = await bcrypt.hash('admin123', salt);
    const userHash = await bcrypt.hash('password123', salt);

    const data = {
        admin123: adminHash,
        password123: userHash
    };

    fs.writeFileSync('hashes.json', JSON.stringify(data, null, 2));
    console.log('Hashes written to hashes.json');
};

generate();
