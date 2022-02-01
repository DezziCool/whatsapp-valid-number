/* Модуль для создания или инициализации сессии для дальнейшего взаимодействия с Whatsapp*/

const fs = require('fs');
const venom = require('venom-bot');
const { getValidSessions } = require('./getProxy.js')


async function createSessions(getProxy=true, dirSessions='./tokens') {
	let arraySessions = [];
	if (getProxy) {
		let validSessions = await getValidSessions();
		let sessionNames = fs.readdirSync(dirSessions);
		for (let ses of validSessions) {
			if (sessionNames.includes(ses['number'])) {
				await venom.create( {
					session: ses['number'],
					browserArgs: [`--proxy-server=http://${ses['ip']}:${ses['protocols']['http']}`],
				}).then((client) => {
					arraySessions.push(client)
				}).catch((erro) => console.error(erro))
			}
		}
	} else {
		let sessionNames = fs.readdirSync(dirSessions);
		for (let index in sessionNames) {
			await venom.create( sessionNames[index] )
			.then((client) => 
			arraySessions.push(client))
			.catch((erro) => { 
				console.log(erro)});
		}
	}

	if (arraySessions.length > 0) {
		return arraySessions;
	} else {
		throw '\n--- Ниодна из возможных сессий не была инициализирована! ---\n';
	}
}

module.exports = { createSessions };
