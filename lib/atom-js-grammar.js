var _ = require('lodash');
var console = {log: function() {}};
/**
 * - When user open plugin, it should parse and show language structure of current editor's file
 * - Viewed file's language structure should be cached
 * - When user switch to another editor and plugin is opened, it should parse and show new file's structure
 * - When file is changed, current file structure should be refreshed and re-cached
 */
//(function() {
var AtomJsGrammar, AtomJsGrammarView, CompositeDisposable;
CompositeDisposable = require('atom').CompositeDisposable;
AtomJsGrammarView = require('./atom-js-grammar-view');

module.exports = AtomJsGrammar = {
	views: {}, //key: pane.id, value: AtomJsGrammarView
	modalPanel: null,
	subscriptions: null,
	observedEditorSet: {},
	disposables: [],
	activate: function(state) {
		this.subscriptions = new CompositeDisposable();
		var self = this;
		return this.subscriptions.add(atom.commands.add('atom-workspace', {
			'js-func-viewer:toggle': function() {
				self.toggle();
			}
		}));
	},

	_ensureViewForActivePane: function() {
		if (!atom.workspace.getActiveTextEditor())
			return null;
		var pane = atom.workspace.getActivePane();
		var id = pane.id + '';
		// var currEditor = atom.workspace.getActiveTextEditor();
		var self = this;
		if (!_.has(this.views, id)) {
			var v = new AtomJsGrammarView(pane);
			console.log('create view for %s', id);
			self.views[id] = v;
			this.disposables.push(atom.workspace.onWillDestroyPane(function(evt) {
				if (!_.has(self, ['views', id]))
					return;
				delete self.views[id];
				console.log(evt.pane.id + ' will be destroyed');
				v.release();
			}));
			return v;
		} else
			return this.views[id];
	},
	deactivate: function() {
		_.each(this.views, function(view, id) {
			view.destroy();
		});
		this.disposables.forEach(function(it) {
			it.dispose();
		});
		this.subscriptions.dispose();
	},
	serialize: function() {
		return {};
	},
	toggle: function(state) {
		var view = this._ensureViewForActivePane();
		if (!view)
			return;
		if (!view.visible) {
			setTimeout(() => {
				view.focus();
			}, 200);
		}
		view.setVisible(!view.visible);
	}
};
