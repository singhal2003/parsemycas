// At least 8 chars, one letter, one digit, one special character.
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;

function validatePassword(password) {
  if (typeof password !== "string") return "Password is required.";
  if (!PASSWORD_RULE.test(password)) {
    return "Password must be at least 8 characters and include a letter, a number, and a special character.";
  }
  return null;
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6-digit code
}

module.exports = { validatePassword, generateVerificationCode };
