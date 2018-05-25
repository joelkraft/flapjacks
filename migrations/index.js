const db = require('../db')

let query = q =>
  new Promise(resolve =>
    db.query(q, (err, res) => {
      if (err) return console.log(err)
      resolve(console.log('query succeeded'))
    })
  )

const migrations = [
  {
    up: () =>
      query(
        `
        CREATE TABLE filesloaded (
          checksum CHAR(40) PRIMARY KEY,
          filename varchar(255),
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE transactions (
          ID SERIAL PRIMARY KEY,
          amount float NOT NULL,
          default_description varchar(255),
          description varchar(255),
          category varchar(255),
          transaction_date varchar(30),
          file_checksum CHAR(40) REFERENCES filesloaded (checksum)
        );        
    `
      ),
    down: () =>
      query(
        `
            DROP TABLE transactions, filesloaded;
        `
      )
  }
]

const migrate = (dir, cb) => {
  let p = Promise.resolve()
  migrations
    .reduce((chain, migration) => chain.then(() => migration[dir]()), p)
    .then(cb)
    .catch(e => console.log(e))
}

// If calling from command line
const direction = process.argv[2]
direction && migrate(direction, () => process.exit(0))

module.exports = migrate
