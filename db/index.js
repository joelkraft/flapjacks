const { Pool } = require('pg')
const dbconfig = require('../config').db.dev

const pool = new Pool(dbconfig)

module.exports = {
  query: (text, params, callback) => pool.query(text, params, callback)
}
