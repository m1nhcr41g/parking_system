const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const hashPassword = async (plainPassword) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return await bcrypt.hash(plainPassword, salt);
};

const comparePassword = async (plainPassword, hash) => {
  return await bcrypt.compare(plainPassword, hash);
};

module.exports = {
  hashPassword,
  comparePassword
};