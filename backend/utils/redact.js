/**
 * Small helpers for keeping PII out of logs. Use these instead of
 * interpolating raw emails / account numbers / tokens into console.log or
 * console.error calls — in production those lines flow straight into
 * whatever log aggregator is configured, with no redaction of their own.
 */

function redactEmail(email) {
  if (!email || typeof email !== 'string') return '(no email)';
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 1))}@${domain}`;
}

function redactAccountNumber(accountNumber) {
  if (!accountNumber || typeof accountNumber !== 'string') return '(no account)';
  if (accountNumber.length <= 4) return '****';
  return `${'*'.repeat(accountNumber.length - 4)}${accountNumber.slice(-4)}`;
}

// Only log verbose/debug detail outside production. Errors themselves should
// still be logged in production (via console.error with redacted fields),
// this is specifically for the "here's everything I'm doing" trace logs.
function debugLog(...args) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(...args);
  }
}

module.exports = { redactEmail, redactAccountNumber, debugLog };
