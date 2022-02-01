const { Pool } = require('pg')
const dotenv = require('dotenv')
dotenv.config();

const pool = new Pool({
	database: process.env.DB_MAILER_NAME,
	user: process.env.DB_MAILER_USER,
	password: process.env.DB_MAILER_PASSWORD,
	port: process.env.DB_MAILER_PORT, 
	host:  process.env.DB_MAILER_HOST,
})

module.exports = { pool };
