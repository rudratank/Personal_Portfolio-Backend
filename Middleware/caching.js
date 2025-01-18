import NodeCache from 'node-cache';

// Create cache instance with 5 minute TTL by default
const cache = new NodeCache({ stdTTL: 300 });

// Cache middleware
export const cacheMiddleware = (key) => {
  return (req, res, next) => {
    const cachedData = cache.get(key);
    if (cachedData) {
      return res.status(200).json(cachedData);
    }
    // Add custom response method to cache the response
    res.sendAndCache = (data) => {
      cache.set(key, data);
      res.json(data);
    };
    next();
  };
};