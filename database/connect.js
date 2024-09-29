const { connect } = require("mongoose")
const mongoose = require('mongoose')
require('colors')

module.exports = {
  start() {
    mongoose.set('strictQuery', false)
    try {
      connect(process.env.mongourl, {
      })

      console.log("[MongoDB]".bgGreen, "> Conectado ao Banco de Dados.".green)

    } catch (err) {
      if (err) return console.log(`🚨 | [MongoDB]:`, err)
    }
  },
}