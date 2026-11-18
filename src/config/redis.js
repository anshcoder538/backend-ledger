const redis=require('redis');

const redisClient=redis.createClient({
    username: 'default',
    password: 'YJu8IL1ijWRbKd5UaZlI6pJUbhmNkCsw',
    socket: {
        host: 'wish-breezy-crayon-91510.db.redis.io',
        port: 10639
    }
});

module.exports=redisClient;