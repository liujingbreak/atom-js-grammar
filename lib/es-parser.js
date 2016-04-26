var esprima = require('esprima');
var estraverse = require('estraverse');
var _ = require('lodash');

module.exports = parseJS;


function parseJS(text) {
	var ast = esprima.parse(text, {range: true, loc: true});
	var parser = new Parser();
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

function Parser(ast) {
	this.ast = ast;
	this.model = {};
	this.scopeStack = [this.model];
}

Parser.prototype = {
	currNode: function() {
		return this.scopeStack[this.scopeStack.length - 1];
	},

	addFunc: function(name, range) {
		var curr = this.currNode();
		if (!_.has(curr, 'subs')) {
			curr.subs = [];
		}
		curr.subs.push([
			name, range]);
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
			}
		},

		FunctionDeclaration: function(node, parent) {
			console.log(node);
			this.addFunc(node.id.name, node.range);
		},

		BlockStatement: function(n, p) {
			if (p && p.type === 'FunctionDeclaration') {
				var child = {};
				this.currNode()[p.id.name] = child;
				this.scopeStack.push(child);
			}
		}
	},

	leaveHandler: {
		BlockStatement: function(n, p) {
			if (p && p.type === 'FunctionDeclaration') {
				this.scopeStack.pop();
			}
		}
	}
};
