var parseJS = require('./es-parser');

(function() {
	var AtomJsGrammar, AtomJsGrammarView, CompositeDisposable;

	AtomJsGrammarView = require('./atom-js-grammar-view');

	CompositeDisposable = require('atom').CompositeDisposable;

	module.exports = AtomJsGrammar = {
		atomJsGrammarView: null,
		modalPanel: null,
		subscriptions: null,
		activate: function(state) {
			var self = this;
			console.log('activated');
			if (!state.atomJsGrammarViewState) {
				state.atomJsGrammarViewState = {};
			}
			this.atomJsGrammarView = new AtomJsGrammarView(state.atomJsGrammarViewState);

			this.modalPanel = atom.workspace.addModalPanel({
				item: this.atomJsGrammarView.getElement(),
				visible: false
			});
			this.subscriptions = new CompositeDisposable();
			this.atomJsGrammarView.on('close', function() {
				self.modalPanel.hide();
			});

			return this.subscriptions.add(atom.commands.add('atom-workspace', {
				'atom-js-grammar:toggle': function() {
						return self.toggle(state);
					}
			}));
		},
		deactivate: function() {
			this.modalPanel.destroy();
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
			console.log('AtomJsGrammar was toggled! ' + this.modalPanel.isVisible());
			if (this.modalPanel.isVisible()) {
				return this.modalPanel.hide();
			} else {
				var ret = this.modalPanel.show();
				var editor = atom.workspace.getActiveTextEditor();
				state.atomJsGrammarViewState.fileName = editor.getTitle();
				self.atomJsGrammarView.render();
				parseJS(editor.getText());
				//self.atomJsGrammarView.emit('stateChanged');
				setTimeout(function() {
					self.atomJsGrammarView.focus();
				}, 100);
				return ret;
			}
		}
	};
}).call(this);
