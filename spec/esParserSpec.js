var parse = require('../lib/es-parser');
var fs = require('fs');
var Path = require('path');

describe('es-parser', function() {
	it('can recoganise Arraw function', function() {
		var result = parse(fs.readFileSync(Path.resolve(__dirname, 'samples/sample-arrow.js')));
		//console.log(result);
		expect(result).toEqual({
			child: [
				{
					name: '=>',
					loc: jasmine.anything(),
					child: [
						{
							name: 'func1',
							loc: jasmine.anything()
						}
					]
				}
			]
		});
	});

	it('can recoganise function as variable definition', function() {
		var result = parse(fs.readFileSync(Path.resolve(__dirname, 'samples/sample-defineVar.js')));
		//console.log(result);
		expect(result).toEqual({
			child: [
				{
					name: 'b',
					loc: jasmine.anything()
				}
			]
		});
	});

	it('can recoganise function in assignment expression', function() {
		var result = parse(fs.readFileSync(Path.resolve(__dirname, 'samples/sample-assignment.js')));
		console.log(result);
		expect(result).toEqual({
			child: [
				{name: 'abc.efg', loc: jasmine.anything()},
				{name: 'a.b.c.1', loc: jasmine.anything()},
				{name: 'efg', loc: jasmine.anything()},
				{name: 'this.xxx', loc: jasmine.anything()}
			]
		});
	});

	it('can recoganise function in another function block', function() {
		var result = parse(fs.readFileSync(Path.resolve(__dirname, 'samples/sample-nested.js')));
		//console.log(result);
		expect(result).toEqual({
			child: [
				{
					name: 'func5',
					loc: jasmine.anything(),
					child: [
						{
							name: 'func6',
							loc: jasmine.anything(),
						},
						{
							name: '=>',
							loc: jasmine.anything(),
							child: [
								{name: 'func1', loc: jasmine.anything()}
							]
						}
					]
				}
			]
		});
	});

	it('can recoganise function as object property', function() {
		var result = parse(fs.readFileSync(Path.resolve(__dirname, 'samples/sample-property.js')));
		//console.log(JSON.stringify(result, null, '\t'));
		expect(result).toEqual({
			child: [
				{name: 'obj.propertyA.func2', loc: jasmine.anything(),
					child: [{name: '', loc: jasmine.anything()}]
				}
			]
		});
	});

	it('can work for comprehensive case', function() {
		var result = parse(fs.readFileSync(Path.resolve(__dirname, 'samples/sample-comprehensive.js')));
		console.log(JSON.stringify(result, null, '  '));
		expect(result).toEqual({
			child: [
				{
					name: '.atom-js-grammar:toggle', loc: jasmine.anything()
				}, {
					name: '', loc: jasmine.anything()
				}
			]
		});
	});
});
