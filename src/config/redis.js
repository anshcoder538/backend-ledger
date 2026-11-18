const redis=require('redis');

const redisClient=redis.createClient({
    username: process.env.REDIS_USERNAME,
    password: process.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT
    }
});

module.exports=redisClient;