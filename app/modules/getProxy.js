/* Модуль для получения параметров подключения к проксям для кажой сессии */

const { pool } = require('./db_connect/mailer.js');

async function getValidSessions() {
	let res;
	await pool.query(
		"select number, ip, protocols from whatsapps \
		 inner join proxies on whatsapps.proxy_id = proxies.id \
		 where whatsapps.status='validator' and \
		 whatsapps.is_banned=false"
	).then(result => {
		res = result.rows;
		// console.log(result.rows);		
	}).catch((err) => {
		console.log(err.stack)
	}).then(() => {
		pool.end();
	})
	return res;
}
if (require.main === module) {
	getValidSessions();
}

module.exports = { getValidSessions };
