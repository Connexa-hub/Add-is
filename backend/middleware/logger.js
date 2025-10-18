const logger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - ${duration}ms`;
    
    if (res.statusCode >= 400) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
  });
  
  next();
};

module.exports = logger;
