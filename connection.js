const { Client } = require('pg');
require('dotenv').config();

var connection = new Client({
    port: process.env.DB_PORT,
    host: process.env.DB_HOST,
    user: process.env.DB_USERNAME, // Changed 'username' to 'user'
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

connection.connect((err) => {
    if (!err) {
        console.log("Database connected");
    } else {
        console.log("Error in database connection:", err);
    }
});

module.exports = connection;