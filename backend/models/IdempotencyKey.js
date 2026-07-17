const mongoose = require('mongoose');

// Backs Idempotency-Key support on money-moving endpoints. A document exists
// per (user, client-supplied key, route) and caches the response of the
// first successful request so retries (e.g. a mobile client retrying after
// a network timeout) replay the original result instead of re-running the
// purchase/funding logic and potentially double-charging.
//
// TTL index on createdAt auto-expires entries after 24h — idempotency keys
// only need to survive as long as a client might plausibly retry, not
// forever, and this keeps the collection from growing unbounded.
const IdempotencyKeySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  key: { type: String, required: true },
  route: { type: String, required: true },
  status: { type: String, enum: ['processing', 'completed'], default: 'processing' },
  statusCode: Number,
  responseBody: Object,
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 }
});

IdempotencyKeySchema.index({ userId: 1, key: 1, route: 1 }, { unique: true });

module.exports = mongoose.model('IdempotencyKey', IdempotencyKeySchema);
