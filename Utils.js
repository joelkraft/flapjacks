const csvparse = require('csv-parse')

function parseCSV (file) {
    const columns = [false,false,"date",false,"name","category","amount"]
    const cast = (val, ctx) => 
        ctx.column === 'amount' ? val[1] === '-' ? parseFloat(val.slice(2)) : parseFloat(val) : val
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

module.exports = {
    flatten,
    parseCSV
}