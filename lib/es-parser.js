var esprima = require('esprima');
var estraverse = require('estraverse');
var _ = require('lodash');

module.exports = parseJS;


function parseJS(text) {
	var ast = esprima.parse(text, {range: true, loc: true});
	var parser = new Parser();
	console.log('\n---------\n%s', JSON.stringify(ast, null, '\t'));
	estraverse.traverse(ast, {
		enter: function(node, parent) {
			parser.handleAstEnter(node, parent);
		},

		leave: function(node, parent) {
			parser.handleAstLeave(node, parent);
		}
	});
	var model = parser.model;

	console.log('\n---------\n%s', JSON.stringify(model, null, '\t'));
	return model;
}

var functionTypes = {
	FunctionDeclaration: true,
	FunctionExpression: true,
	ArrowFunctionExpression: true
};

function AssignmentLeft(left) {
	if (left.name) {
		return left.name;
	} else if (left.value) {
		return left.value;
	} else if(left.type === 'MemberExpression') {
		return AssignmentLeft(left.object) + '.' + AssignmentLeft(left.property);
	}
}

function Parser(ast) {
	this.ast = ast;
	this.model = {};
	this.scopeStack = [this.model];
	this.lastNode = null;
}

Parser.prototype = {
	currNode: function() {
		return this.scopeStack[this.scopeStack.length - 1];
	},

	addFunc: function(name, range) {
		var curr = this.currNode();
		if (!_.has(curr, 'child')) {
			curr.child = [];
		}
		this.lastNode = {
			name: name,
			range: range
		};
		curr.child.push(this.lastNode);
	},

	handleAstEnter: function(node, parent) {
		if (!_.has(this.enterHandler, node.type)) {
			return;
		}
		return this.enterHandler[node.type].call(this, node, parent);
	},

	handleAstLeave: function(node, parent) {
		if (!_.has(this.leaveHandler, node.type)) {
			return;
		}
		return this.leaveHandler[node.type].call(this, node, parent);
	},

	enterHandler: {
		FunctionExpression: function(node, parent) {
			if (parent && parent.type === 'Property') {
				this.addFunc('.' + parent.key.name, node.range);
			} else if (parent && parent.type === 'VariableDeclarator') {
				this.addFunc(parent.id.name, node.range);
			} else if (parent && parent.type === 'AssignmentExpression') {
				this.addFunc(AssignmentLeft(parent.left), node.range);
			} else if (node.id && node.id.name) {
				this.addFunc(node.id.name, node.range);
			} else {
				this.addFunc('()', node.range);
			}
		},

		FunctionDeclaration: function(node, parent) {
			this.addFunc(node.id.name, node.range);
		},

		ArrowFunctionExpression: function(node, parent) {
			this.addFunc('=>', node.range);
		},

		BlockStatement: function(n, p) {
			if (p && _.has(functionTypes, p.type)) {
				this.scopeStack.push(this.lastNode);
			}
		}
	},

	leaveHandler: {
		BlockStatement: function(n, p) {
			if (p && _.has(functionTypes, p.type)) {
				this.scopeStack.pop();
			}
		}
	}
};
