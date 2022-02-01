/* Модуль для обновелния строк таблицы соответствующих номеров */

const { pool } = require("./db_connect/validator.js");

async function updateOpers(array) {
	for (let oper in array) {
		if (array[oper].length == false) {
			console.log('--- Массив пуст!!! ---')
		} else {
			console.log('--- Запуск операции обновления! ---\n')
			console.log(`- Кол-во номеров в массиве = ${array[oper].length} -`)

			let nums = [];
			array[oper].forEach(num => nums.push(`'${num}'`));
			let request_sql = `update num set opers = array_append(opers, ${oper})
								where number in (${nums.join(', ')}) and 
								case when opers @> array[${oper}]::integer[] then False else True end`;

			await pool.query( request_sql )
			.then(result => {
				console.log(`- Кол-во измененнных строк = ${result['rowCount']} -\n`)
			}).catch((err) => {
				console.log(err.stack)
			})
			console.log('--- Обновление прошло успешно! ---')
		}
	};	
}

if (require.main === module) {
	let a = {'930': ['9999992', '9999993', '9999994', '9999997']}
	updateOpers(a);
}

module.exports = { updateOpers };
