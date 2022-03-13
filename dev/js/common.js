function appHeight() {
	const doc = document.documentElement;
	doc.style.setProperty("--app-height", `${window.innerHeight}px`);
}
window.addEventListener("resize", appHeight);
appHeight();

function sendData(form) {
	let action = form.getAttribute("action");
	let method = form.getAttribute("method") ? form.getAttribute("method") : "POST"
	let FD = new FormData(form);

	return fetch(action, {
		method: method,
		body: FD,
	});
}