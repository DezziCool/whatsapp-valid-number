const fs = require('fs');
const { createSessions } = require('./modules/venomConnect.js')
const { updateOpers } = require('./modules/updateOpers.js')


const arrayOperators = JSON.parse(fs.readFileSync('arrayOperators.json', 'utf-8'));
const backupFile = 'backupNextSearchNumber.txt'
const sleepTime = 1000 * 60 * 5;
let startNumber = '+79000000000';

if (fs.existsSync(backupFile)) {
	if (fs.readFileSync(backupFile, 'utf-8')) {
		startNumber = fs.readFileSync(backupFile, 'utf-8');
	}
}
let	arraySearchNumber, counterGenNumber = 0, counterValidNumber = 0;

createSessions(getProxy=false)
.then((sessions) => {
	console.log(`\n\t=== Вхождение сессий - ${sessions.length} ===`);
	main(sessions, opers=arrayOperators, startNumber, searchInterval=5000)})
.catch((res) => console.log(res));

async function waiting(region, oper, num) {
	
	await checkCounters(); // ожидаем, пока все номера цикла не отвалидируются

	console.log('\n - Длина массива валидированных номеров - ', arraySearchNumber[oper].length)
	if ( arraySearchNumber[oper].length > 0) {
		await updateOpers(arraySearchNumber); // запись в БД
		arraySearchNumber[oper] = []; // обнуление массива номеров у текущего оператора
	} 
	// запись номера в бекап, с которого следует начинать следующую итерацию
	backupNextSearchNumber(region, oper, num);

	counterGenNumber = 0;
	counterValidNumber = 0;
	
	console.log('---Уходим в сон на', sleepTime / 1000 / 60, 'мин ---\n')
	await sleep(sleepTime); 
}

//Проверяем с помощью venom зарегистрирован ли номер
async function checkNumber(session, region, oper, num) {
	try {
		let res = await session.checkNumberStatus(`${region}${oper}${num}@c.us`);
		arraySearchNumber[oper].push(num);
	} catch(err) { 

	} finally { counterValidNumber++; }
}
// ожидаем, пока счетчик пройденных номеров не совпадет с счетчиком проверенных номеров
async function checkCounters(time=100) {
	await new Promise((resolve) => {
		performance.mark('start');
		let timedId = setInterval(() => {
			if (counterValidNumber == counterGenNumber) {
				clearInterval(timedId); // остановка интервала
				console.log('Отвалидировано - ',counterValidNumber)
				console.log('---совпадает!---');
			
				performance.mark('end');
				performance.measure('checkNumber', 'start', 'end');
				let speed = performance.getEntriesByName('checkNumber').pop()['duration'];
				speed = Math.round(speed) / 1000;
				console.log(' - Продолжительность ожидания гет-запросов = ', speed,'сек');
				console.log(' - Средняя скорость валидации = ', Math.round((counterGenNumber / speed)) * 100 / 100, 'номер/сек')

				resolve('');
			}
		}, time);
	})
}

async function sleep(time=15000) {
	await new Promise((resolve) => {
		setTimeout(() => { resolve('') }, time);
	});
}

function backupNextSearchNumber(region, oper, num) {
	if (num != '9999999') {
		num = String(Number(num) + 1)
		num = `${'0'.repeat((7 - num.length))}${num}`; // Добавление недастающих нулей
	}
	let lastNumber = `${region}${oper}${num}`
	console.log(`--- запись backup ==> ${lastNumber} ---\n`)
	fs.writeFile(backupFile, lastNumber, () =>{})
}

async function main(arraySession, opers=true, inputValue=false, searchInterval=5000, countLength=false) {
	let region = '7', oper = '900', startNumSearch = '0000000', lastNumber=10000000;

	if (inputValue) {
		// console.log(' - Восстановление с бекапа - ');
		const regexp = /\S+(\d{3})(\d{7})/g;
		let res = regexp.exec(inputValue);
		[, oper, startNumSearch] = res;
	}
	// Если не задан массив операторов - проходимся по оператору из бекапа или входного номера.
	if (!opers) {
		opers = [oper]
	}
	let indexOper = opers.indexOf(oper) 
	// определяем, до какого номера нам валидировать
	if (countLength) {
		lastNumber = Number(startNumSearch) + countLength;
	}
	
	
	for (let index = indexOper; index < opers.length; index++) {
		
		console.log(`=== Начало валидации с номера - ${region}${opers[index]}${startNumSearch} ===\n`);
		let number;
		arraySearchNumber = {};
		arraySearchNumber[opers[index]] = [];

		for(let num = startNumSearch; num < lastNumber; num++){
			number = String(num);
			number = `${'0'.repeat((7 - number.length))}${number}`; // Добавление недастающих нулей

			// рандомим сессию для каждого прохода
			let session =  arraySession[Math.floor(Math.random()*arraySession.length)];

			checkNumber(session, region, opers[index], number)
			counterGenNumber++;

			if (counterGenNumber == searchInterval) {
				console.log('Cгенерировано  - ', counterGenNumber)
				await waiting(region, opers[index], number);
			}
		}
		if (counterGenNumber > 0 | arraySearchNumber[opers[index]].length > 0 ) {
			await waiting(region, opers[index], number);
		}
		console.log(`=== Оператор - ${opers[index]} - отвалидирован ===`);
	}
	console.log('=== Скрипт валидации завершен!!! ===');
	setTimeout(() => {
		process.exit(-1);
	}, 5000);
}