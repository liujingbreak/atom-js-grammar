this.subscriptions.add(atom.commands.add('atom-workspace', {
	'atom-js-grammar:toggle': function() {
			return self.toggle(state);
		}
}));

var s = call(function() {});
