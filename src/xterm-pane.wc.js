'use strict';

async function addScript(src, attr = {}) {
	let el = document.createElement('SCRIPT');
	el.src = src;
	for(let [k, v] of Object.entries(attr))
		el.setAttribute(k, v);

	return new Promise((resolve, reject) => {
		el.addEventListener('load', (e) => {
			resolve();
		});
		document.head.appendChild(el);
	});
}

let _, __,
	term,
	xTheme = {
		black:			'rgb(0,0,0)',
		red:			'rgb(180,0,0)',
		green:			'rgb(0,147,0)',
		yellow:			'rgb(180,180,0)',
		blue:			'rgb(0,0,255)',
		magenta:		'rgb(156,0,156)',
		cyan:			'rgb(0,147,147)',
		white:			'rgb(210,210,210)',
		brightBlack:	'rgb(127,127,127)',
		brightRed:		'rgb(255,0,0)',
		brightGreen:	'rgb(0,252,0)',
		brightYellow:	'rgb(255,255,0)',
		brightBlue:		'rgb(100,100,255)',
		brightMagenta: 'rgb(255,0,255)',
		brightCyan:		'rgb(0,255,255)',
		brightWhite:	'rgb(255,255,255)',
	};

(async () => {
	await addScript('https://cdn.jsdelivr.net/npm/xterm@3.8.0/dist/xterm.js', {
		integrity:		'sha256-og/1ZYBbLxlsj8Il/va+lOmEi6KhOaRt3ljVuOLPups=',
		crossorigin: 'anonymous',
	});

	window.term = term = new Terminal({
		drawBoldTextInBrightColors: false,
		cursorBlink:				true,
		theme:						xTheme,
	});

	window.customElements.define('xterm-pane', xTermPane);
})();

// language=HTML
let template = `
	<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/xterm@3.8.0/lib/xterm.css"
		  integrity="sha256-OSfRj4jMeYVFSwgcvVvKj4V0+mwqSP9YJjyEJe7dmK0=" crossorigin="anonymous">
	<style>
		:host {
			display: block;
			/*min-height:     1em;*/
			/*flex-direction: column;*/
			margin:  0px 0px;
			height:  inherit;
		}

		#container {
			/*flex:   1;*/
			height: 300px;
		}

		#container .terminal.xterm {
			padding: 4px;
		}
	</style>
	<div id="container"></div>
`;

class xTermPane extends HTMLElement {

	constructor() {
		super();
		this.attachShadow({ mode: 'open' });
		this.shadowRoot.innerHTML = template;
	}

	// list of observable attributes
	static get observedAttributes() {
		return [];
	}

	connectedCallback() {
		term.open(this.shadowRoot.querySelector('#container'));		// Open the terminal in #container

		term.on('refresh', (...args) => {
			setTimeout(() => {
				term.resize(term.cols, term._core.buffer.lines.length);
			}, 25);
		});
	}

	exec(code) {
		let shim = `
			let console = {
				log: function log(...input) {
					term.write(input.join(' ')
						.replace(/\\n/g, '\\r\\n'));
				},
			};
			term.clear();
		`;

		if(this.lastScript)
			this.lastScript.remove();
		this.lastScript				= document.createElement('script');
		this.lastScript.type		= 'module';
		this.lastScript.innerHTML = shim + code;
		this.shadowRoot.appendChild(this.lastScript);
	}
}
