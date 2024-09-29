const emoji = require("node-canvas-with-twemoji-and-discord-emoji");

module.exports = async (context, message, x, y) => {
  return await emoji.fillTextWithTwemoji(context, message, x, y);
};