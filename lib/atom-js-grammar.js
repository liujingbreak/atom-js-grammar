var parseJS = require('./es-parser');
var Path = require('path');
var LRU = require('lru');

(function() {
	var AtomJsGrammar, AtomJsGrammarView, CompositeDisposable;
	var cache = new LRU(8);

	AtomJsGrammarView = require('./atom-js-grammar-view');

	CompositeDisposable = require('atom').CompositeDisposable;

	module.exports = AtomJsGrammar = {
		atomJsGrammarView: null,
		modalPanel: null,
		subscriptions: null,
		activate: function(state) {
			var self = this;
			if (!state.atomJsGrammarViewState) {
				state.atomJsGrammarViewState = {};
			}
			this.atomJsGrammarView = new AtomJsGrammarView(state.atomJsGrammarViewState);

			// this.modalPanel = atom.workspace.addModalPanel({
			// 	item: this.atomJsGrammarView.getElement(),
			// 	visible: false
			// });
			this.subscriptions = new CompositeDisposable();
			// this.atomJsGrammarView.on('close', function() {
			// 	self.modalPanel.hide();
			// });

			return this.subscriptions.add(atom.commands.add('atom-workspace', {
				'atom-js-grammar:toggle': function() {
						return self.toggle(state);
					}
			}));
		},
		deactivate: function() {
			//this.modalPanel.destroy();
			this.subscriptions.dispose();
			return this.atomJsGrammarView.destroy();
		},
		serialize: function() {
			return {
				atomJsGrammarViewState: this.atomJsGrammarView.serialize()
			};
		},
		toggle: function(state) {
			var self = this;

			if (!this.atomJsGrammarView.visible) {
				onOpen(state);
				setTimeout(function() {
					self.atomJsGrammarView.focus();
				}, 200);
			}
			this.atomJsGrammarView.setVisible(!this.atomJsGrammarView.visible);
		}
	};

	function onOpen(state) {
		var editor = atom.workspace.getActiveTextEditor();
		if (!editor) {
			return;
		}
		var fileName = state.atomJsGrammarViewState.fileName = editor.getPath();
		if (Path.extname(fileName).toLowerCase() === '.js') {
			var cachedTree = cache.get(fileName);
			if (cachedTree) {
				state.atomJsGrammarViewState.tree = cachedTree;
			} else {
				state.atomJsGrammarViewState.tree = parseJS(editor.getText());
				cache.set(fileName, state.atomJsGrammarViewState.tree);

				editor.onDidChange(function() {
					//console.log(editor.getPath() + ' changed');
					if (cache.peek(editor.getPath())) {
						cache.remove(editor.getPath());
					}
				});
			}
		} else {
			state.atomJsGrammarViewState.tree = {child: []};
		}
	}
}).call(this);
