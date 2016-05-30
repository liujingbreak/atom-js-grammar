var parseJS = require('./es-parser');
var Path = require('path');
var LRU = require('lru');

/**
 * - When user open plugin, it should parse and show language structure of current editor's file
 * - Viewed file's language structure should be cached
 * - When user switch to another editor and plugin is opened, it should parse and show new file's structure
 * - When file is changed, current file structure should be refreshed and re-cached
 */
(function() {
	var AtomJsGrammar, AtomJsGrammarView, CompositeDisposable;
	var cache = new LRU(8);

	AtomJsGrammarView = require('./atom-js-grammar-view');

	CompositeDisposable = require('atom').CompositeDisposable;

	module.exports = AtomJsGrammar = {
		atomJsGrammarView: null,
		modalPanel: null,
		subscriptions: null,
		observedEditorSet: {},
		activate: function(state) {
			var self = this;
			if (!state.viewModel) {
				state.viewModel = {};
			}
			this.atomJsGrammarView = new AtomJsGrammarView();
			this.subscriptions = new CompositeDisposable();

			// When user switch to another editor
			atom.workspace.onDidStopChangingActivePaneItem(item => {
				if (atom.workspace.isTextEditor(item)) {
					console.log('change active editor ' + item.getPath());
					// and plugin is opened
					if (this.atomJsGrammarView.visible) {
						this.renderView();
					}
				}
			});

			return this.subscriptions.add(atom.commands.add('atom-workspace', {
				'atom-js-grammar:toggle': function() {
						return self.toggle(state);
					}
			}));
		},
		deactivate: function() {
			if (this.editorChangeHandler) {
				this.editorChangeHandler.dispose();
			}
			this.subscriptions.dispose();
			return this.atomJsGrammarView.destroy();
		},
		serialize: function() {
			return {
				viewModel: this.atomJsGrammarView.serialize()
			};
		},
		toggle: function(state) {
			var self = this;

			if (!this.atomJsGrammarView.visible) {
				this.onOpen(state);
				setTimeout(function() {
					self.atomJsGrammarView.focus();
				}, 200);
			} else {
				this.onClose(state);
			}
			this.atomJsGrammarView.setVisible(!this.atomJsGrammarView.visible);
		},

		onOpen: function(state) {
			this.renderView();
		},

		renderView: function() {
			console.log('renderView');
			var editor = atom.workspace.getActiveTextEditor();
			var fileName = this.atomJsGrammarView.getState().fileName = editor.getPath();
			if (Path.extname(fileName).toLowerCase() === '.js') {
				var cachedTree = cache.get(fileName);
				if (cachedTree) {
					console.log('read from cache');
					this.atomJsGrammarView.getState().tree = cachedTree;
				} else {
					this.atomJsGrammarView.getState().tree = parseJS(editor.getText());
					cache.set(fileName, this.atomJsGrammarView.getState().tree);
				}
			} else {
				this.atomJsGrammarView.getState().tree = {child: []};
			}
			this.atomJsGrammarView.apply();
			this.observeEditorChange();
		},

		observeEditorChange: function() {
			var editor = atom.workspace.getActiveTextEditor();
			if (this.observedEditorSet.hasOwnProperty(editor.id)) {
				return;
			}

			var editorDisposer = {};
			this.observedEditorSet[editor.id] = editorDisposer;

			editorDisposer.onEditorChange = editor.onDidStopChanging(() => {
				console.log(editor.getPath() + ' changed');
				if (cache.peek(editor.getPath())) {
					cache.remove(editor.getPath());
				}
				if (this.atomJsGrammarView.visible) {
					this.renderView();
				}
			});

			editorDisposer.onEditorDestory = editor.onDidDestroy(()=> {
				console.log(editor.getPath() + ' destroied');
				editorDisposer.onEditorChange.dispose();
				editorDisposer.onEditorDestory.dispose();
				delete this.observedEditorSet[editor.id];
			});
		},

		onClose: function(state) {
		}
	};
}).call(this);
