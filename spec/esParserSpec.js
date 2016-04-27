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
					range: jasmine.any(Object),
					child: [
						{
							name: 'func1',
							range: jasmine.any(Object)
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
					range: jasmine.any(Array)
				}
			]
		});
	});

	it('can recoganise function in assignment expression', function() {
		var result = parse(fs.readFileSync(Path.resolve(__dirname, 'samples/sample-assignment.js')));
		//console.log(result);
		expect(result).toEqual({
			child: [
				{name: 'abc.efg', range: jasmine.any(Array)},
				{name: 'a.b.c.1', range: jasmine.any(Array)},
				{name: 'efg', range: jasmine.any(Array)}
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
					range: jasmine.any(Array),
					child: [
						{
							name: 'func6',
							range: jasmine.any(Array),
						},
						{
							name: '=>',
							range: jasmine.any(Array),
							child: [
								{name: 'func1', range: jasmine.any(Array)}
							]
						}
					]
				}
			]
		});
	});

	it('can recoganise function as object property', function() {
		var result = parse(fs.readFileSync(Path.resolve(__dirname, 'samples/sample-property.js')));
		expect(result).toEqual({
			child: [
				{name: 'obj.propertyA.func2', range: jasmine.any(Array),
					child: [{name: '', range: jasmine.any(Array)}]
				}
			]
		});
	});
});
