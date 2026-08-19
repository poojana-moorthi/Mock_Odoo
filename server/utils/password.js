const bcrypt = require('bcrypt');

/**
 * Hash a plaintext password
 * @param {string} password Plaintext password
 * @returns {Promise<string>} BCrypt password hash
 */
exports.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

/**
 * Compare plaintext password with stored hash
 * @param {string} password Plaintext password
 * @param {string} hashedPassword Encrypted password hash
 * @returns {Promise<boolean>} Match result
 */
exports.comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Validate password complexity based on business requirements:
 * - minimum 8 characters
 * - uppercase character
 * - lowercase character
 * - number
 * - special character
 * @param {string} password
 * @returns {boolean}
 */
exports.validatePasswordComplexity = (password) => {
  if (!password || password.length < 8) {
    return false;
  }
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return false;
  }
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    return false;
  }
  // Check for number
  if (!/[0-9]/.test(password)) {
    return false;
  }
  // Check for special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return false;
  }
  return true;
};
