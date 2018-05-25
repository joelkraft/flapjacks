const { Pool } = require('pg')
const dbconfig = require('../config').db.dev

const pool = new Pool(dbconfig)

const query = (text, params, callback) => pool.query(text, params, callback)
const pQuery = (q, params) =>
  new Promise((resolve, reject) =>
    pool.query(q, params, (err, res) => {
      if (err) return reject(err)
      resolve(res)
    })
  )
module.exports = {
  query,
  pQuery
}
