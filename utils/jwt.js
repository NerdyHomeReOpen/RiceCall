/* eslint-disable @typescript-eslint/no-require-imports */
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const jwt = require('jsonwebtoken');
const path = require('path');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

const JWT = {
  generateToken: (data) => {
    return jwt.sign({ ...data }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },

  verifyToken: (token) => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return { valid: true, ...decoded };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  },
};

module.exports = { ...JWT };
