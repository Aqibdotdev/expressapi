const Redis = require("redis");
const redisClient = Redis.createClient({ port: 6380 });

redisClient.on("connect", () => {
  console.log("Connected to Redis server at port 6380");
});

redisClient.connect();

export default redisClient;
