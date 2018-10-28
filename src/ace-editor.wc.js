'use strict';

/* Adapted from http://juicy.github.io/juicy-ace-editor/ - MIT License */

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

(async () => {
	await addScript('https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.1/ace.js', {
		type:			'module',
		integrity:		'sha256-kCykSp9wgrszaIBZpbagWbvnsHKXo4noDEi6ra6Y43w=',
		crossorigin: 'anonymous',
	});
	await addScript('https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.1/ext-searchbox.js', {
		type:			'module',
		integrity:		'sha256-CWdhVnlijNeIstIAGsFtPksw/R1MRJ+P+QDUiuHlJ44=',
		crossorigin: 'anonymous',
	});
	await addScript('https://cdnjs.cloudflare.com/ajax/libs/ace/1.4.1/ext-statusbar.js', {
		type:			'module',
		integrity:		'sha256-eJp4OJTS2tgOy8cVLo+IP67Kk+2gTWjrf1k8tQ/YkUc=',
		crossorigin: 'anonymous',
	});

	window.customElements.define('ace-editor', AceEditor);
})();


let _, __,
	html = `
		<style>
			:host {
				margin:         0px;
				display:        flex;
				min-height:     15em;
				flex-direction: column;
			}
			#ace-editor-container {
				flex:	1;
				height: 100%;
			}
			#ace-status-bar {
				padding: 3px;
			}
			#ace-status-bar > div {
				float: right;
				margin-left: 15px;
			}
		</style>
		<div id="ace-editor-container"> </div>
		<div id="ace-status-bar">Edit Code, Click Terminal to See Result, Alt-\` to Toggle</div>
	`;

// Shim Shadow DOM styles if needed
// if (window.ShadowDOMPolyfill) {
//     WebComponents.ShadowCSS.shimStyling(template, 'ace-editor');
// }

// Creates an object based in the HTML Element prototype
class AceEditor extends HTMLElement {
	// Fires when an instance of the element is created
	constructor() {
		super();
		this.textContent = this.trim(this.textContent);

		// Polyfill ceveat we need to fetch the right context;
		// https://github.com/WebReflection/document-register-element/tree/master#v1-caveat
		// Creates the shadow root
		let shadowRoot;
		if(this.attachShadow && this.getRootNode) {
			shadowRoot = this.attachShadow({ mode: 'open' });
		} else {
			shadowRoot = this.createShadowRoot();
		}

		shadowRoot.innerHTML = html;

		this.container = shadowRoot.querySelector('#ace-editor-container');
	}

	// list of observable attributes
	static get observedAttributes() {
		return ['theme', 'mode', 'minlines', 'fontsize', 'softtabs', 'tabsize', 'readonly', 'wrapmode'];
	}

	// getter/setter for value property
	get value() {
		return this.editor && this.editor.getValue() || this.trim(this.textContent);
	}

	set value(value) {
		value = this.trim(value);
		if(this.editor) {
			this.editor.setValue(value);
			this.editor.selection.clearSelection();
		} else {
			this.textContent = value;
		}
	}

	connectedCallback() {
		const text		= this.childNodes[0];
		const container = this.container;
		const element	= this;
		let editor;

		if(this.editor) {
			editor = this.editor;
		} else {
			container.textContent = this.value;

			this.editor = editor = ace.edit(container);

			this.CreateStatusBar();

			this.dispatchEvent(new CustomEvent('editor-ready', { bubbles: true, composed: true, detail: editor }));

			// inject base editor styles
			this.injectTheme('#ace_editor\\.css');
			this.injectTheme('#ace-tm');
			this.injectTheme('#ace_searchbox');

			editor.getSession()
				.on('change', (event) => {
					element.dispatchEvent(new CustomEvent('change', { bubbles: true, composed: true, detail: event }));
					if(!this.hasAttribute('maxLines'))
						editor.renderer.setOption('maxLines', session.getDocument()
							.getAllLines().length);
				});
		}

		// handle theme changes
		editor.renderer.addEventListener('themeLoaded', this.onThemeLoaded.bind(this));

		// initial attributes
		editor.setTheme(this.getAttribute('theme'));
		editor.setFontSize(parseInt(this.getAttribute('fontsize')) || 12);
		editor.setReadOnly(this.hasAttribute('readonly'));
		const session = editor.getSession();
		session.setMode(this.getAttribute('mode'));
		session.setUseSoftTabs(this.getAttribute('softtabs'));
		this.getAttribute('tabsize') && session.setTabSize(this.getAttribute('tabsize'));
		session.setUseWrapMode(this.hasAttribute('wrapmode'));
		editor.setShowPrintMargin(false);
		editor.renderer.setOptions({
			minLines: this.getAttribute('minLines'),
			maxLines: this.getAttribute('maxLines'),
		});

		// Observe input textNode changes
		// Could be buggy as editor was also added to Light DOM;
		const observer = new MutationObserver(function(mutations) {
			mutations.forEach(function(mutation) {
				// console.log("observation", mutation.type, arguments, mutations, editor, text);
				if(mutation.type == 'characterData') {
					element.value = text.data;
				}
			});
		});
		text && observer.observe(text, { characterData: true });
		// container.appendChild(text);
		this._attached = true;
	}

	disconnectedCallback() {
		this._attached = false;
	}

	attributeChangedCallback(attr, oldVal, newVal) {
		if(!this._attached) {
			return false;
		}
		console.log(attr);
		switch(attr) {
			case 'theme':
				this.editor.setTheme(newVal);
				break;
			case 'minLines':
			case 'maxLines':
				this.editor
					.renderer
					.setOption(attr, newVal);
				break;
			case 'mode':
				this.editor.getSession()
					.setMode(newVal);
				break;
			case 'fontsize':
				this.editor.setFontSize(newVal);
				break;
			case 'softtabs':
				this.editor.getSession()
					.setUseSoftTabs(newVal);
				break;
			case 'tabsize':
				this.editor.getSession()
					.setTabSize(newVal);
				break;
			case 'readonly':
				this.editor.setReadOnly(newVal === '' || newVal);
				break;
			case 'wrapmode':
				this.editor.getSession()
					.setUseWrapMode(newVal !== null);
				break;

		}
	}

	/**
	 * Finds the first line with indented whitespace and trims all lines of
	 * the leading white-space
	 *
	 * @param {string} text        The text to trim
	 *
	 * @return {string}
	 */
	trim(text) {
		let tLines = text.split(/\r?\n/g);
		tLines.shift();	// Drop Empty First Line

		let reIndent;
		tLines.find((line) => {
			if(!(_ = line.match(/^(\s+).+/)))
				return false;
			reIndent = new RegExp('^' + _[1]);
			return true;
		});

		tLines = tLines.map((line) => {
			return line.replace(reIndent, '');
		});
		if(tLines.length > 0 && tLines[tLines.length - 1].trim().length == 0)
			tLines.pop();
		return tLines.join('\n');
	}

	onThemeLoaded(e) {
		const themeId = '#' + e.theme.cssClass;
		this.injectTheme(themeId);
		// Workaround Chrome stable bug, force repaint
		this.container.style.display = 'none';
		this.container.offsetHeight;
		this.container.style.display = '';

		this.statusBar.className = this.container.className;
	}

	injectTheme(themeId) {
		const n = document.querySelector(themeId);
		this.shadowRoot.appendChild(cloneStyle(n));
	}

	CreateStatusBar() {
		this.statusBar = this.shadowRoot.querySelector('#ace-status-bar');

		let StatusBar			= ace.require('ace/ext/statusbar').StatusBar;
		// create a simple selection status indicator
		this.statusBar.aceClass = new StatusBar(this.editor, this.statusBar);
	}
}

//helper function to clone a style
function cloneStyle(style) {
	const s			= document.createElement('style');
	s.id			= style.id;
	s.textContent = style.textContent;
	return s;
}
