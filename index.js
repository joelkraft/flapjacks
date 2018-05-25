const fs = require('fs')
const checksum = require('checksum')
const filenames = fs.readdirSync('./data')
const csvs = filenames.map(file => fs.readFileSync(`./data/${file}`))
const { flatten, parseCSV } = require('./Utils')
const {query, pQuery} = require('./db')

function pFileChecksum(filename) {
    return new Promise((resolve, reject) => {
        checksum.file(`./data/${filename}`, (err, sha) => {
            if (err) {
                return reject(err)
            }
            return resolve(sha)
        })
    })
}

function isChecksumSaved(checksum) {
    return pQuery(`SELECT EXISTS(SELECT 1 FROM filesloaded WHERE checksum=$1)`, [checksum])
}

async function filterLoaded(filenames) {
    // map over filenames for checksums
    const checksums = await Promise.all(filenames.map(pFileChecksum))
    console.log(checksums)
    const matches = await Promise.all(checksums.map(isChecksumSaved))
    console.log(matches)
    return checksums.filter((checksum, index) => !matches[index])
}

function add(trans) {
    return trans.reduce((total, t, i) => {
        if (typeof t.amount !== 'number') console.log(i, t)
        return total + t.amount},
    0)
}
function log(values) {
    values.forEach(({date, name, category, amount}) => {
        const result = `${date}  ${name}  ${category}  ${amount}\n`
        process.stdout.write(result)
    });
    console.log(`* * * NUMBER OF RECORDS: ${values.length}`)
    return values
}
function filterDeposits(transactions) {
    return transactions.filter(transaction => transaction.amount > 0)
}

function store(records) {

    return pQuery(
        `
            INSERT INTO transactions (amount, default_description, category, transaction_date, document_checksum, document_name)
                VALUES ($1, $2, $3, $4, $5, $6);
        `,
        [record.amount, record.name, record.category, record.date]
    )
}

console.log(filenames)
filterLoaded(filenames).then(console.log).catch(err=> console.error(err))
    // .then(l=>console.log(l) || l)
    // .then(f=>Promise.all(f.map(csv=> parseCSV(csv))))
    // .then(flatten)
    // .then(log)
    // // .then(result => Promise.all(result.map(store)))
    // .catch(e=> console.error(e))


// data.forEach(file=> {
//     checksum.file(`./data/${file}`, (err, sh) => {
//         err && console.error(err)
//         console.log(sh)
//     })
// })