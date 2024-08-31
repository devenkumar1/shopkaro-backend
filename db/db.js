const mysql = require("mysql");
const dotenv = require('dotenv');
dotenv.config();

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: process.env.PASSWORD,
    // database: 'xmarket'
})

connection.connect((err) => {
    if (err) {
        console.log(err);
    }
    else {
        console.log("Database is connected");
    }
})
const createDb = `CREATE DATABASE IF NOT EXISTS xmarket`;
connection.query(createDb, (err) => {
    if (err) {
        console.log(err);
    }
    else {
        console.log("Database is created ");
    }
})
const dbName = 'xmarket';

// Change the database
connection.query(`USE ${dbName}`, (err) => {
    if (err) {
        console.error('Error changing database:', err);
    } else {
        console.log(`Changed to database: ${dbName}`);
    }
})
module.exports = connection;