/**
 * Отправляет или запрашивает данные.
 * @param {?HTMLElement} form - Форма. Или можно передать data.
 * @param {?string} action - URL сервера. Если не передано - берётся у form.
 * @param {?data} data - Данные, которые надо передать (если нет form).
 * @param {?string} method - Метод. По умолчанию "POST".
 */

async function sendData(form, action, data, method) {
	let url = action ? action : form.action;

	let options = {
		method: method ? method : "POST",
	};

	let formData = null;

	if (date) {
		formData = JSON.stringify(data);
	} else {
		formData = new FormData(form);
	}

	if (options.method.toUpperCase() != "GET") {
		options.body = formData;
	}

	const res = await fetch(url, options);

	if (!res.ok) {
		console.warn(res);
		let err = new Error("HTTP status code: " + res.status);
		throw err;
	}

	return res;
}
