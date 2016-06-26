var fs = require('fs');
var Path = require('path');
var _ = require('lodash');
var angular;
module.exports = function(_angular, moduleName) {
	angular = _angular;
	angular.module(moduleName)
	.directive('jsGrammaTree', jsGrammaTree)
	.directive('jsGrammaTreeContainer', function($compile, $parse) {
		var compiledLink;
		return {
			restrict: 'A',
			scope: false,
			link: function(scope, el, attrs) {
				if (!scope.node.hasVisibleChild) {
					return;
				}
				if (!compiledLink) {
					compiledLink = $compile('<ul js-gramma-tree="sub" tree="node"></ul>');
				}
				compiledLink(scope, function cloneAttachFn(clonedElement, scope) {
					el.append(clonedElement);
				});
			}
		};
	});
};

function jsGrammaTree($compile, $parse) {
	var template = fs.readFileSync(Path.resolve(__dirname, 'js-grammar-tree.html'), 'utf8');
	return {
		restrict: 'AE',
		template: template,
		scope: {
			tree: '=',
			type: '@jsGrammaTree',
			onSelectNode: '&'
		},
		compile: function(tElement, tAttrs, transclude) {
			if (tElement[0].tagName.toLowerCase() !== 'ul') {
				throw new Error('jsGrammaTree tag must be <ul>');
			}
			tElement.addClass('list-tree');
			// var onSelectNode;
			// if (tAttrs.onSelectNode) {
			// 	onSelectNode = $parse(tAttrs.onSelectNode);
			// }

			return function(scope, iElement, iAttrs) {
				scope.children = [];
				if (scope.onSelectNode) {
					//register event handle
					iElement.delegate('.list-item', 'click', function(evt) {
						var scp = angular.element(evt.currentTarget).scope();
						scope.onSelectNode({
							line: scp.node.loc.start.line,
							column: scp.node.loc.start.column,
							start: scp.node.loc.start
						});
					});
				}
				scope.$watch('tree', function(tree) {
					if (!tree) {
						return;
					}
					if (scope.type !== 'sub') {
						calculateVisableChild(tree);
					}
					scope.children = tree.child;
				});
			};
		}

	};
}

function calculateVisableChild(tree) {
	var count = 0;
	if (!tree.child) {
		tree.hasVisibleChild = false;
		return;
	}
	tree.child = _.filter(tree.child, function(child) {
		var visibleChildChildCount = 0;
		if (child.child && child.child.length > 0) {
			visibleChildChildCount = calculateVisableChild(child);
		}

		if (visibleChildChildCount > 0) {
			count++;
		} else {
			if (child.name && child.name !== '=>') {
				count++;
			} else {
				//remove this child
				return false;
			}
		}
		return true;
	});

	tree.hasVisibleChild = count > 0;
	return count;
}
