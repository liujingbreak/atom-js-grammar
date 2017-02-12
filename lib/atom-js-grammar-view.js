var parseJS = require('./es-parser');
var $ = require('../vendor/jquery-1.12.0');
//var _ = require('lodash');

var fs = require('fs');
var Path = require('path');

module.exports = AtomJsGrammarView;
var console = {log: function() {}};
var angular;

function AtomJsGrammarView(pane) {
	this.editorDisposer = null;
	this.needRender = true;
	this.visible = false;
	this.paneDisposers = [];
	this.editorDisposers = [];
	this.id = pane.id;
	window.jQuery = $;
	require('../vendor/angular');
	angular = window.angular ? window.angular : global.angular;

	var self = this;
	$ = $ ? $ : window.$;
	var container = $('body').find('atom-pane.active').eq(0);
	this.container = container;
	this.el = container.find('.atom-js-grammar');
	if (this.el.length === 0) {
		this.element = document.createElement('div');
		this.element.classList.add('atom-js-grammar');
		this.el = $(this.element);
		container.append(this.el);
		this.el.attr('tabIndex', '1');
		container.on('keydown.AtomJsGrammarView', function(evt) {
			if (evt.keyCode === 27 || evt.keyCode === 13) { //press ESC
				self.setVisible(false);
				//self.emit('close');
			}
		});
		this._bootstrapNg();
	} else {
		this.element = this.el[0];
		console.log('find existing DOM');
	}

	self._onEditorChange(atom.workspace.getActiveTextEditor());
	self.currEditor = atom.workspace.getActiveTextEditor();

	this.paneDisposers.push(pane.onDidChangeActiveItem(function(item) {
		if (!atom.workspace.isTextEditor(item))
			return;
		console.log('switch editor %s -> %s', self.currEditor.id, item.id);
		self._offEditorChange(self.currEditor);
		self._onEditorChange(item);
		self.currEditor = item;
		self._maybeRender();
	}));

	// $('body').on('click', this.bodyEvtHandler);
	// this.bodyEvtHandler = function(evt) {
	// 	if ($(evt.target).closest('.atom-js-grammar').length === 0) {
	// 		self.setVisible(false);
	// 	}
	// };
}
AtomJsGrammarView.prototype = {
	_bootstrapNg: function() {
		var self = this;
		var appEl = $(fs.readFileSync(Path.resolve(__dirname, 'view.html'), 'utf8'));
		this.el.append(appEl);
		this.ngPromise = new Promise(function(resolve, reject) {
			angular.module('atomJsGrammar', [])
			.controller('MainController', function($rootScope, $scope) {
				var mainVm = self.mainVm = this;
				$scope.$watch('mainVm.fileName', (value, old) => {
					mainVm.title = value;
				});
				mainVm.title = mainVm.fileName;
				mainVm.jumpTo = function(line, column, start) {
					var activeEditor = atom.workspace.getActiveTextEditor();
					activeEditor.setCursorBufferPosition([line - 1, column]);
					activeEditor.scrollToCursorPosition();
					//self.setVisible(false);
					//self.emit('close');
				};
				self.scope = $rootScope;
				resolve(mainVm);
			})
			.filter('functionName', function() {
				return function(input) {
					return input ? input : '( )';
				};
			});
		});

		require('./directives')(angular, 'atomJsGrammar');
		angular.bootstrap(this.element, ['atomJsGrammar']);
		return this.ngPromise;
	},
	_onEditorChange: function(editor) {
		//var editor = atom.workspace.getActiveTextEditor();
		var self = this;
		this.editorDisposers.push(editor.onDidStopChanging(() => {
			console.log('editor ' + editor.getPath() + ' is changed');
			self._maybeRender();
		}));
	},

	_offEditorChange: function() {
		this.editorDisposers.forEach(function(d) { d.dispose(); });
		this.editorDisposers.splice(0, this.editorDisposers.length);
	},

	_maybeRender: function() {
		var self = this;
		if (self.visible) {
			self._render();
		} else
			self.needRender = true;
	},

	_render: function() {
		console.log('_render() %s', this.id);
		var editor = this.currEditor;
		this.getState().then((mainVm) => {
			var fileName = editor.getPath();
			mainVm.fileName = Path.basename(fileName);
			var ext = Path.extname(fileName).toLowerCase();
			if (ext === '.js' || ext === '.jsx') {
				mainVm.tree = parseJS(editor.getText());
			} else {
				mainVm.tree = {child: []};
			}
			this.apply();
		});
	},
	getState: function() {
		return this.ngPromise;
	},

	setVisible: function(visible) {
		if (this.visible === visible)
			return;
		if (visible) {
			console.log('show');
			if (this.needRender) {
				this._render();
				this.needRender = false;
			}
			this.el.removeClass('invisible');
		} else {
			this.el.addClass('invisible');
		}
		this.visible = visible;
	},

	serialize: function() {},

	// Do not name to "destory", it won't work, don't know why
	release: function() {
		console.log('release view %s', this.id);
		this.container.off('.AtomJsGrammarView');
		delete this.container;
		//$('body').off('click', this.bodyEvtHandler);
		this.el.remove();
		delete this.element;
		delete this.el;
		this.paneDisposers.forEach(function(d) {
			d.dispose();
		});
		this.paneDisposers.splice(0, this.paneDisposers.length);
		this._offEditorChange();
	},

	focus: function() {
		this.el.focus();
	},

	apply: function() {
		this.scope.$apply();
	},

	_createFunctionEl: function(li, node) {
		li.addClass('list-item');
		var spanEl = $('<span>');
		spanEl.addClass('fname');
		spanEl.html(node.name ? node.name : '( )');
		li.append(spanEl);
		return li;
	}
};
