const fs = require('fs')
const path = require('path')
const checksum = require('checksum')
const getDataPath = filename => `${__dirname}/data${filename ? `/${filename}` : ''}`
const filenames = fs.readdirSync(getDataPath())
const { flatten, parseCSV, pReadFile } = require('./Utils')
const {query, pQuery} = require('./db')

function pFileChecksum(filename) {
    return new Promise((resolve, reject) => {
        checksum.file(getDataPath(filename), (err, sha) => {
            if (err) {
                return reject(err)
            }
            return resolve(sha)
        })
    })
}

function isChecksumSaved(checksum) {
    return pQuery(`SELECT EXISTS(SELECT 1 FROM filesloaded WHERE checksum=$1)`, [checksum])
        .then(result => result.rows[0].exists)
}

function getQuery({headers, records}) {
    const values = records.reduce((vals, record)=>[...vals, ...headers.map(header=> record[header])], [])
    let placeholders = records.map((record, index) => {
        const mult = index * headers.length
        return `(${headers.map((h,index) => `$${mult + index + 1}`).join(',')})`
    }).join(',')
    return {
        placeholders,
        values
    }
}

async function filterLoaded(filenames, verbose=true) {
    // map over filenames for checksums
    const checksums = await Promise.all(filenames.map(pFileChecksum))
    const matches = await Promise.all(checksums.map(isChecksumSaved))
    const fileData = filenames.map((filename, index) =>({
        name: filename,
        checksum: checksums[index],
        isSaved: matches[index]
    }))
    if (verbose) {
        if (matches.some(m=>m)) {
            console.log('The following files have been saved, and will be skipped:')
            fileData.forEach(file => {
                file.isSaved && console.log('\t', file.name)
            })
            console.log('\n')
        }
    }
    const filteredFileData = fileData.filter(file => !file.isSaved)
    if (filteredFileData.length === 0) {
        if (verbose) console.log('There are no new files to process. Exiting...\n')
        return process.exit(0)
    }
    return filteredFileData
}

function getDataPaths(files) {
    return files.map(file => Object.assign({}, file, {path: getDataPath(file.name)}))
}

async function getFileContents(files) {
    const contents = await Promise.all(files.map(file=>pReadFile(file.path)))
    return files.map((file, index) => Object.assign({}, file, { contents: contents[index] }))
}

async function parseFiles(files) {
    const parsedFiles = await Promise.all(files.map(file=> parseCSV(file.contents)))
    return files.map((file, index) => Object.assign({}, file, { parsed: parsedFiles[index]}))
}

async function storeRecords(files) {
    const headers = ['amount', 'name', 'category', 'date']
    const records = files.reduce((records, file) => [...records, ...file.parsed], [])
    const queryGuts = getQuery({headers, records})
    const result = await pQuery( //, document_checksum, document_name
        `
            INSERT INTO transactions (amount, default_description, category, transaction_date)
                VALUES ${queryGuts.placeholders};
        `,
        queryGuts.values
    )
    return { files, result }
}

async function saveChecksums({ files }) {
    const headers = ['checksum', 'filename']
    const records = files.map(({ checksum, name }) => ({ checksum, filename: name }))
    const queryGuts = getQuery({headers, records})
    const result = await pQuery(
        `
            INSERT INTO filesloaded (${headers.join(',')})
                VALUES ${queryGuts.placeholders};
        `,
        queryGuts.values
    )
    return { files, result }
}

function report({files}) {
    console.log(`
Import of ${files.length} files complete:
\t${files.map(file => file.name).join('\n\t')}

Exiting...
    `)
}

console.log('Beginning import\n')
filterLoaded(filenames)
    .then(getDataPaths)
    .then(getFileContents)
    .then(parseFiles)
    .then(storeRecords)
    .then(saveChecksums)
    .then(report)
    .then(() => process.exit(0))
    .catch(err=> console.error(err) || process.exit(1))
