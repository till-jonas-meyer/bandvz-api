const argon2 = require('argon2');

const hashPassword = async (password) => {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });
}

if (!process.argv[2]) {
  console.error('Please give a password as first parameter.');
  process.exit(0);
}

hashPassword(process.argv[2]).then(hash => console.log(hash));