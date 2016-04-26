var parse = require('../lib/es-parser');
var fs = require('fs');
var Path = require('path');

describe('es-parser', function() {
	it('can parse js file to correct structure', function() {
		var result = parse(fs.readFileSync(Path.resolve(__dirname, 'sample01.js')));
		console.log(result);
	});
});
