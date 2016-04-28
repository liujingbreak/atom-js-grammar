var esprima = require('esprima');
var estraverse = require('estraverse');
var _ = require('lodash');

module.exports = parseJS;


function parseJS(text) {
	var ast = esprima.parse(text, {range: false, loc: true});
	var parser = new Parser();
	//console.log('\n---------\n%s', JSON.stringify(ast, null, '  '));
	estraverse.traverse(ast, {
		enter: function(node, parent) {
			parser.handleAstEnter(node, parent);
		},

		leave: function(node, parent) {
			parser.handleAstLeave(node, parent);
		}
	});
	var model = parser.model;

	//console.log('\n---------\n%s', JSON.stringify(model, null, '\t'));
	return model;
}

var functionTypes = {
	FunctionDeclaration: true,
	FunctionExpression: true,
	ArrowFunctionExpression: true
};

var NameElementsType = {
	Property: true,
	ObjectExpression: true,
	VariableDeclarator: true
};

function AssignmentLeft(left) {
	if (left.name) {
		return left.name;
	} else if (left.value) {
		return left.value;
	} else if (left.type === 'MemberExpression') {
		return AssignmentLeft(left.object) + '.' + AssignmentLeft(left.property);
	}
}

function Parser(ast) {
	this.ast = ast;
	this.model = {};
	this.scopeStack = [this.model];
	this.lastNode = null;
	this.traversePathStack = [[]];
}

Parser.prototype = {
	currTraversePath: function() {
		return this.traversePathStack[this.traversePathStack.length - 1];
	},

	traversePath2Name: function() {
		var path = this.currTraversePath();
		var compareCount = 0;
		var index = _.findLastIndex(this.currTraversePath(), function(node) {
			compareCount++;
			return compareCount !== 1 && !_.has(NameElementsType, node.type);
		});
		// We don't want parent function's name become part of current function's name
		if (index >= 0) {
			path = path.slice(index);
		}
		return path.map(function(node) {
			var name;
			switch (node.type) {
				case 'VariableDeclarator':
					name = node.id.name;
					break;
				case 'ObjectExpression':
					name = '.';
					break;
				case 'Property':
					name = node.key.name ? node.key.name : node.key.value;
					break;
				case 'AssignmentExpression':
					name = AssignmentLeft(node.left);
					break;
				default:
					name = '';
			}
			return name;
		}).join('');
	},

	currNode: function() {
		return this.scopeStack[this.scopeStack.length - 1];
	},

	addFunc: function(name, loc) {
		var curr = this.currNode();
		if (!_.has(curr, 'child')) {
			curr.child = [];
		}
		this.lastNode = {
			name: name,
			loc: loc
		};
		curr.child.push(this.lastNode);
	},

	handleAstEnter: function(node, parent) {
		this.currTraversePath().push(node);
		if (!_.has(this.enterHandler, node.type)) {
			return;
		}
		return this.enterHandler[node.type].call(this, node, parent);
	},

	handleAstLeave: function(node, parent) {
		this.currTraversePath().pop();
		if (!_.has(this.leaveHandler, node.type)) {
			return;
		}
		return this.leaveHandler[node.type].call(this, node, parent);
	},

	enterHandler: {
		FunctionExpression: function(node, parent) {
			// console.log('!! ' + this.currTraversePath().map(function(node) {
			// 	return node.type;
			// }));
			this.addFunc(this.traversePath2Name(), node.loc);
		},

		FunctionDeclaration: function(node, parent) {
			this.addFunc(node.id.name, node.loc);
		},

		ArrowFunctionExpression: function(node, parent) {
			this.addFunc('=>', node.loc);
		},

		BlockStatement: function(n, p) {
			if (p && _.has(functionTypes, p.type)) {
				this.scopeStack.push(this.lastNode);
			}
		},

		/**
			Property type node's parent is undefined, so I have make my own way to track parents chain
		 */
		ObjectExpression: function(n, p) {
			//this.objectExpStack.push(n);
		}
	},

	leaveHandler: {
		BlockStatement: function(n, p) {
			if (p && _.has(functionTypes, p.type)) {
				this.scopeStack.pop();
			}
		},

		ObjectExpression: function(n, p) {
		}
	},

	propertyKey: function(property) {
		var prop = '.' + property.key.name;

		// if (property.parent.parent && property.parent.parent.type === 'Property') {
		// 	prop = this.propertyKey(property.parent.parent) + prop;
		// }
		return prop;
	}
};
