var esprima = require('esprima');
var estraverse = require('estraverse');
var _ = require('lodash');

module.exports = parseJS;

function parseJS(text) {
	if (_.startsWith(text, '#!')) {
		text = text.substring(text.indexOf('\n'));
	}
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
	} else if (left.type === 'ThisExpression') {
		return 'this';
	} else {
		return '';
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
	/**
	 * Last time entered AST node, will be popped after leaving
	 */
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
		return path.map(this.getNodeName, this).join('');
	},

	getNodeName: function(node, funcExpNode) {
		var name;
		switch (node.type) {
			case 'VariableDeclarator':
				name = node.id.name;
				break;
			case 'ObjectExpression':
				name = '.';
				break;
			case 'ArrayExpression':
				if (funcExpNode) {
					name = _.get(funcExpNode, 'id.name');
				} else
					name = '';
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
	},

	currNode: function() {
		return this.scopeStack[this.scopeStack.length - 1];
	},

	addChildFuncNode: function(name, loc, longName) {
		this.addChildNode({
			name: name,
			longName: longName ? longName : name,
			loc: loc
		});
	},

	addChildNode: function(node) {
		var curr = this.currNode();
		if (!_.has(curr, 'child')) {
			curr.child = [];
		}
		this.lastNode = node;
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

	name4TestSpecLikeFunc: function(name, node, parentNode) {
		if (!name &&
		parentNode.type === 'CallExpression' &&
		parentNode.arguments[1] === node  &&
		parentNode.arguments[0].type === 'Literal' &&
		(parentNode.arguments[0].raw.charAt(0) === '"' || parentNode.arguments[0].raw.charAt(0) === '\'')) {
			var firstArg = AssignmentLeft(parentNode.callee);
			if (firstArg)
				return firstArg + '(\'' + parentNode.arguments[0].value + '\')';
		}
		return false;
	},

	enterHandler: {
		FunctionExpression: function(node, parent) {
			var path = this.currTraversePath();
			var lastPathNode = path[path.length - 2];
			var name = this.getNodeName(lastPathNode, node);
			var testSpecLikeName = this.name4TestSpecLikeFunc(name, node, parent);
			if (testSpecLikeName) {
				name = testSpecLikeName;
			}
			this.addChildFuncNode(name, node.loc, this.traversePath2Name());
		},

		FunctionDeclaration: function(node, parent) {
			this.addChildFuncNode(node.id.name, node.loc);
		},

		ArrowFunctionExpression: function(node, parent) {
			var testSpecLikeName = this.name4TestSpecLikeFunc(false, node, parent);
			this.addChildFuncNode(testSpecLikeName ? testSpecLikeName : '=>', node.loc);
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
			var path = this.currTraversePath();
			var lastPathNode = path[path.length - 2]; // -1 is '.'
			var name = this.getNodeName(lastPathNode);
			this.scopeStack.push({
				longName: this.traversePath2Name(),
				name: name ? name : '{}',
				loc: n.loc
			});
		}
	},

	leaveHandler: {
		BlockStatement: function(n, p) {
			if (p && _.has(functionTypes, p.type)) {
				this.scopeStack.pop();
			}
		},

		ObjectExpression: function(n, p) {
			var objectNode = this.scopeStack.pop();
			if (_.get(objectNode, 'child.length') > 0) {
				this.addChildNode(objectNode);
			}
		}
	}
};
