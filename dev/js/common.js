function appHeight() {
	const doc = document.documentElement;
	doc.style.setProperty("--app-height", `${window.innerHeight}px`);
}
window.addEventListener("resize", appHeight);
appHeight();

function sendData(form) {
	return new Promise((resolve, reject) => {
		var action = form.getAttribute("action");
		var XHR = new XMLHttpRequest();
		var FD = new FormData(form);

		XHR.onload = () => {
			if (XHR.status == 200) {
				resolve(XHR.response);
			}
		};

		XHR.onerror = () => reject(XHR.statusText);
		XHR.open(form.getAttribute("method") ? form.getAttribute("method") : "POST", action);
		XHR.send(FD);
	});
}
