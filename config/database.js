const mysql = require('mysql');
const util = require('util');

const dbConf = mysql.createPool({
    connectionLimit: 1000,
    connectTimeout: 60 * 60 * 1000,
    acquireTimeout: 60 * 60 * 1000,
    timeout: 60 * 60 * 1000,
    host: process.env.DB_HOST_TEST,
    user: process.env.DB_USER_TEST,
    password: process.env.DB_PASSWORD_TEST,
    database: process.env.DB_NAME_TEST,
    port: process.env.DB_PORT
})

const dbQuery = util.promisify(dbConf.query).bind(dbConf);

module.exports = { dbConf, dbQuery };