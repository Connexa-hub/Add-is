const IdempotencyKey = require('../models/IdempotencyKey');

/**
 * Idempotency-Key support for money-moving POST endpoints.
 *
 * Clients (mobile app) send an `Idempotency-Key` header — a client-generated
 * UUID kept stable across retries of the *same* logical request (e.g. the
 * same "buy ₦500 airtime" tap, even if the network times out and the app
 * retries the HTTP call). When present:
 *
 *  - First request for a given (user, key, route): proceeds normally. Once
 *    the handler sends its response, that response is cached against the key.
 *  - A retry with the same key while the first attempt is still in flight:
 *    rejected with 409 so the client doesn't fire a second purchase while
 *    the first is still being processed — it should back off and retry.
 *  - A retry with the same key after the first attempt completed: the
 *    original response is replayed verbatim; none of the handler's logic
 *    (reserving funds, calling VTPass/Monnify, etc.) runs again.
 *
 * If no header is sent, this middleware is a no-op. It never blocks clients
 * that haven't adopted the header yet, but it also can't protect them from
 * duplicate-submission — rolling `Idempotency-Key` out on the mobile client
 * is tracked as a follow-up (ROADMAP.md).
 *
 * Must run after verifyToken (needs req.userId).
 */
module.exports = function idempotency(routeName) {
  return async function idempotencyMiddleware(req, res, next) {
    const key = req.headers['idempotency-key'];
    if (!key || !req.userId) {
      return next();
    }

    try {
      const result = await IdempotencyKey.findOneAndUpdate(
        { userId: req.userId, key, route: routeName },
        { $setOnInsert: { status: 'processing' } },
        { upsert: true, new: false, rawResult: true }
      );

      // `value` is the pre-update document. It's null only when this upsert
      // just created the record — i.e. this is genuinely the first time
      // we've seen this key. Any non-null value means a document already
      // existed, so this is a retry.
      const existing = result && result.value;
      if (existing) {
        if (existing.status === 'completed') {
          return res.status(existing.statusCode || 200).json(existing.responseBody);
        }
        return res.status(409).json({
          success: false,
          message: 'A request with this idempotency key is already being processed. Please wait and retry.'
        });
      }

      const originalJson = res.json.bind(res);
      res.json = (body) => {
        IdempotencyKey.updateOne(
          { userId: req.userId, key, route: routeName },
          { $set: { status: 'completed', statusCode: res.statusCode, responseBody: body } }
        ).catch((err) => console.error('Idempotency cache write failed:', err.message));
        return originalJson(body);
      };

      next();
    } catch (err) {
      // Idempotency bookkeeping must never be the reason a real request fails.
      console.error('Idempotency middleware error:', err.message);
      next();
    }
  };
};
