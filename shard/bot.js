const { ShardingManager } = require('discord.js');
require('dotenv').config()
require('colors')

const manager = new ShardingManager('./index.js', {
    token: process.env.tokenGroveTest,
    totalShards: 'auto',
});

manager.spawn()

manager.on('shardCreate', shard => {

    console.log("[Bot-Shard]".bgWhite, `> Shard iniciado Nº ${shard.id}`.white);

})
