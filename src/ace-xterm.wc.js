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

addScript('ace-editor.wc.js', { type: 'module' });

let template = (new DOMParser()).parseFromString(`
	<template>
		<style>
			* {
				box-sizing: border-box;
			}
			:host {
				margin:	15px 0px;
				display: block;
			}
			
			body {
				/*background: url(https://subtlepatterns.com/patterns/use_your_illusion.png);*/
				/*color: #eee;*/
				/*font: 1em 'PT Sans', sans-serif;*/
			}
			
			::selection {
				background-color: #4EC6DE;
			}
			
			.tabbed {
				/*width: 700px;*/
				/*margin: 50px auto;*/
			}
			
			.tabbed > input {
				display: none;
			}
			
			.tabbed > label {
				display: block;
				float: left;
				padding: 6px 10px;
				margin-right: 5px;
				cursor: pointer;
				transition: background-color .3s;
				border: 1px solid #CCC;
				border-bottom: none;
			}
			
			.tabbed > label:hover {
				background: #DDD;
				border: 1px solid #CCC
				border-bottom: none;
			}
			.tabbed > input:checked + label {
				background: #EEE;
				border: 1px solid #CCC;
				border-bottom: none;
			}
			
			.tabs {
				clear: both;
				perspective: 600px;
			}
			
			.tabs > div {
				width: 100%;
				position: absolute;
				border: 1px solid #CCC;
				padding: 0px;
				line-height: 1.4em;
				opacity: 0;
				/*transform: rotateX(-20deg);*/
				/*transform-origin: top center;*/
				/*transition: opacity .3s, transform 1s;*/
				transition: opacity .2s;
				z-index: 0;
				height:	100%;
				max-height: 300px;
			}
			
			#tab-nav-1:checked ~ .tabs > div:nth-of-type(1),
			#tab-nav-2:checked ~ .tabs > div:nth-of-type(2),
			#tab-nav-3:checked ~ .tabs > div:nth-of-type(3),
			#tab-nav-4:checked ~ .tabs > div:nth-of-type(4) {
				/*transform: rotateX(0);*/
				opacity: 1;
				z-index: 1;
			}
			
			@media screen and (max-width: 700px) {
				.tabbed {
					width: 400px;
				}
			
				.tabbed > label {
					display: none;
				}
			
				.tabs > div {
					width: 400px;
					border: none;
					padding: 0;
					opacity: 1;
					position: relative;
					transform: none;
					margin-bottom: 60px;
				}
			
				.tabs > div h2 {
					border-bottom: 2px solid #4EC6DE;
					padding-bottom: .5em;
				}
			}
		</style>
		<div class="tabbed">
			<input type="radio" name="tabs" id="tab-nav-1" checked>
			<label for="tab-nav-1">JavaScript</label>
			<input type="radio" name="tabs" id="tab-nav-2">
			<label for="tab-nav-2">Terminal</label>
			<div class="tabs">
				<div>
					<ace-editor mode="ace/mode/javascript" theme="ace/theme/monokai" minlines="10"></ace-editor>
				</div>
				<div><xterm-pane></xterm-pane></div>
			</div>
		</div>
		</template>
	`, 'text/html').head.firstElementChild;


class AceTerminal extends HTMLElement {
	constructor() {
		super();
		this.aceCode		= this.firstChild.textContent;
		this.textContent = '';

		this.attachShadow({ mode: 'open' })
			.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {
		let pane	= this.shadowRoot.querySelector('xterm-pane');
		let editor = this.shadowRoot.querySelector('ace-editor');
		let tab1	= this.shadowRoot.querySelector('#tab-nav-1');
		let tab2	= this.shadowRoot.querySelector('#tab-nav-2');

		tab2.addEventListener('change', (e) => {
			pane.exec(editor.value);
		});

		(async () => {
			await customElements.whenDefined(editor.localName);
			editor.value = this.aceCode;

			await customElements.whenDefined(pane.localName);

			this.shadowRoot.addEventListener('keydown', (e) => {
				if(e.altKey && e.key == '`' && e.ctrlKey == false && e.shiftKey == false) {
					tab1.checked
					? tab2.click()
					: tab1.click();
					e.preventDefault();
					e.stopPropagation();
				}
			}, true);
		})();
	}
}

window.customElements.define('ace-xterm', AceTerminal);

addScript('xterm-pane.wc.js', { type: 'module' });

