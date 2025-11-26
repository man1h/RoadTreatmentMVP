const bcrypt = require('bcrypt');

const testPassword = async () => {
    const adminHashFromSeed = '$2b$10$N6lz3JXgW9ZF1ElLee21UerXjkdiDIwS0cLQbC1V0Yoi8qTIyPkqm';
    const dispatcherHashFromSeed = '$2b$10$N6lz3JXgW9ZF1ElLee21UejqFbi6jvmOnkqMxW5B4cwq8zpVCM0bW';

    console.log('Testing admin hash:');
    console.log('  admin123:', await bcrypt.compare('admin123', adminHashFromSeed));
    console.log('  password123:', await bcrypt.compare('password123', adminHashFromSeed));

    console.log('\nTesting dispatcher/driver hash:');
    console.log('  admin123:', await bcrypt.compare('admin123', dispatcherHashFromSeed));
    console.log('  password123:', await bcrypt.compare('password123', dispatcherHashFromSeed));
};

testPassword();
