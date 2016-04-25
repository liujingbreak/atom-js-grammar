/*
jshint curly: false
 */
var _ = require('lodash');

function JSParser(pegParser, logfunc) {
	this.text = null;
	this.pegParser = pegParser;
	this.result = {
		child: []
	};
	this.logfunc = logfunc;
}

JSParser.prototype = {
	parse: function(text) {
		this.text = text;
		this._stack = [this.result];
		var now = new Date().getTime();
		var tree = this.pegParser.parse(text);
		if (this.logfunc)
			this.logfunc('duration of peg: ' + (new Date().getTime() - now));
		//console.log(JSON.stringify(process.memoryUsage()));
		this._travelTree(tree);
		//console.log(JSON.stringify(tree, null, '  '));
		delete this.text;
		return this.result.child;
	},
	currNode: function() {
		if (!this._currNode)
			this._currNode = this._stack[this._stack.length - 1];
		return this._currNode;
	},
	_addNode: function(node) {
		var p = this.currNode();
		if (!(p.child instanceof Array))
			p.child = [];
		p.child.push(node);
		this._lastNode = node;
	},
	_inScope: function() {
		this._stack.push(this._lastNode);
		this._currNode = null;
	},
	_outScope: function() {
		this._stack.pop();
		this._currNode = null;
	},
	_travelTree: function(tree) {
		if (tree instanceof Array) {
			tree.forEach(function(node, i) {
				travelTree(node);
			});
			return;
		}
		var type = tree.type;
		var v;
		var isFunction = type === 'Function';
		if (isFunction) {
			var item = {
				name: tree.name,
				line: tree.line,
				fullName: tree.longName,
				start: tree.offset,
				stop: tree.end
			};
			this._addNode(item);
		} else if (type === 'AssignmentExpression') {
			var right = tree.right;
			if (tree.operator === '=' && right != null && right.type === 'Function') {
				this._setFunctionName(tree.left, right);
			}
		} else if (type === 'PropertyAssignment') {
			v = tree.value;
			if (v != null && v.type === 'Function') {
				v.name = tree.name;
				v.longName = '.' + tree.name;
			}
		} else if (type == 'VariableDeclaration' && tree.value != null && tree.value.type == 'Function') {
			tree.value.name = tree.name;
		}
		if (isFunction) {
			this._inScope();
		}
		for (var f in tree) {
			if (!{}.hasOwnProperty.call(tree,f)) {
				continue;
			}
			v = tree[f], t;

			if (f !== 'type') {
				//treePath.push(type+'.'+ f);
				t = typeof(v);
				if (t === 'object' && v != null) {
					if (v instanceof Array) {
						for (var i = 0, l = v.length; i < l; i++) {
							this._travelTree(v[i]);
						}
					} else {
						this._travelTree(v);
					}
				}
				//treePath.pop();
			}
		}
		if (isFunction) {
			this._outScope();
		}
	},
	_text: function(offset, end) {
		return this.text.substring(offset, end);
	},

	_setFunctionName: function(leftTree, funcTree) {
		switch (leftTree.type) {
			case 'Variable':
				funcTree.name;
				break;
			case 'PropertyAccess':

				funcTree.longName = this._text(leftTree.offset, leftTree.end);
				funcTree.name = leftTree.name.type == 'StringLiteral' ? leftTree.name.value : leftTree.name;
				break;
			default:
				funcTree.name = '<' + leftTree.type + '>';
		}
	}
}

function EsprimaJSParser(esprima) {
	this.text = null;
	this.esprima = esprima;
	this.result = {
		child: []
	};
	this.logfunc = function(text) {
		console.log(text);
	};
}
EsprimaJSParser.prototype = Object.create(JSParser.prototype);
_.assign(EsprimaJSParser.prototype, {
	parse: function(text) {
		this.text = text;
		this._stack = [this.result];
		var now = new Date().getTime();
		var tree = this.esprima.parse(text, {
			range: true,
			loc: true
		});
		if (this.logfunc)
			this.logfunc('duration of esprima: ' + (new Date().getTime() - now));
		this._travelTree(tree);
		delete this.text;
		return this.result.child;
	},
	_travelTree: function(tree) {
		if (tree instanceof Array) {
			tree.forEach(function(node, i) {
				travelTree(node);
			});
			return;
		}
		var type = tree.type;
		var isFunction = (type === 'FunctionDeclaration' || type === 'FunctionExpression');
		if (isFunction) {
			var item = {
				name: tree.id ? tree.id.name : null,
				line: tree.loc.start.line,
				fullName: tree.longName,
				start: tree.range[0],
				stop: tree.range[1]
			};
			this._addNode(item);
		} else if (type == 'AssignmentExpression') {
			var right = tree.right;
			if (tree.operator == '=' && right != null && right.type == 'FunctionExpression') {
				this._setFunctionName(tree.left, right);
			}
		} else if (type == 'Property') {
			var v = tree.value;
			if (v != null && v.type == 'FunctionExpression') {
				var keyName = tree.key.name ? tree.key.name : tree.key.value;
				if (v.id == null) v.id = {};
				v.id.name = keyName;
				v.longName = '.' + keyName;
			}
		} else if (type == 'VariableDeclarator' && tree.init != null && tree.init.type == 'FunctionExpression') {
			if (tree.init.id == null)
				tree.init.id = {};
			tree.init.id.name = tree.id.name;
		}
		if (isFunction) {
			this._inScope();
		}
		_.forOwn(tree, function(f) {
			var v = tree[f],
				t;

			if (f !== 'type') {
				//treePath.push(type+'.'+ f);
				t = typeof(v);
				if (t === 'object' && v != null) {
					if (v instanceof Array) {
						for (var i = 0, l = v.length; i < l; i++) {
							this._travelTree(v[i]);
						}
					} else {
						this._travelTree(v);
					}
				}
				//treePath.pop();
			}
		}
		if (isFunction) {
			this._outScope();
		}
	},
	_setFunctionName: function(leftTree, funcTree) {
		switch (leftTree.type) {
			case 'Identifier':
				funcTree.name;
				break;
			case 'MemberExpression':

				funcTree.longName = this._text(leftTree.range[0], leftTree.range[1]);
				if (!funcTree.id)
					funcTree.id = {};
				funcTree.id.name = leftTree.property.type == 'Identifier' ? leftTree.property.name : leftTree.property.value;
				break;
			default:
				funcTree.name = '<' + leftTree.type + '>';
		}
	}
});

exports.EsJSParser = EsprimaJSParser;
exports.JSParser = JSParser;
