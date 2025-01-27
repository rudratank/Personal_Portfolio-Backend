const memoryCache = new Map();

function cacheMiddleware(req, res, next) {
  const cacheKey = req.originalUrl;
  const cachedResponse = memoryCache.get(cacheKey);
  
  if (cachedResponse) {
    return res.json(cachedResponse);
  }
  
  res.sendResponse = res.json;
  res.json = (data) => {
    memoryCache.set(cacheKey, data, 3600000); // 1-hour cache
    res.sendResponse(data);
  };
  
  next();
}

export default cacheMiddleware;
