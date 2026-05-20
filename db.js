const mysql = require('mysql2');
const config = require('./config.json');
const pool = mysql.createPool(config).promise();

module.exports = pool;