const fs = require('fs')
const csvparse = require('csv-parse')
const data = fs.readdirSync('./data')
const csvs = data.map(file => fs.readFileSync(`./data/${file}`))
const columns = [false,false,"date",false,"name","category","amount"]
const cast = (val, ctx) => 
    ctx.column === 'amount' ? val[1] === '-' ? parseFloat(val.slice(2)) : parseFloat(val) : val

function parse (file) {
    return new Promise((resolve, reject) => {
        return csvparse(file, { columns, cast }, (err, result) => {
            if (err) {
                return reject(err)
            }
            return resolve(result)
        })
    })
}

function flatten (arr) {
    return arr.reduce((array, cur) => {
        return [...array, ...cur]
    }, [])
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
}
function filterDeposits(transactions) {
    return transactions.filter(transaction => transaction.amount > 0)
}
Promise.all(csvs.map(csv=> parse(csv)))
    .then(flatten)
    .then(filterDeposits)
    .then(log)
    // .then((value) => {
    //     console.log(value)
    // })
