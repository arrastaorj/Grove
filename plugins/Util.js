const abbrev = require("./abbrev.js");
const renderEmoji = require("./renderEmoji");
const convertAbbrev = require("./convertAbbrev");

module.exports = class Util {
  static toAbbrev(num) {
    return abbrev(num);
  }

  static renderEmoji(context, msg, x, y) {
    return renderEmoji(context, msg, x, y);
  }

  static notAbbrev(num) {
    return convertAbbrev(num);
  }
};