const { Pool } = require('pg')

const pool = new Pool({
	database: process.env.DB_VALIDATOR_NAME,
	user: process.env.DB_VALIDATOR_USER,
	password: process.env.DB_VALIDATOR_PASSWORD,
	port: process.env.DB_VALIDATOR_PORT, 
	host: process.env.DB_VALIDATOR_HOST,
})

module.exports = { pool };
