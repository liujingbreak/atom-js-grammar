var parse = require('../lib/es-parser');
var fs = require('fs');
var Path = require('path');

describe('es-parser', function() {
	it('can recoganise test spec like function structure', ()=> {
		var result = parse(fs.readFileSync(Path.resolve(__dirname, 'samples/sample-spec-like.js')));
		//console.log(JSON.stringify(result, null, '\t'));
		expect(result).toEqual({
			child: [{
					"name": "describe('test1')", "longName": "describe('test1')",
					loc: jasmine.anything()
				}, {
					"name": "describe('test2')", "longName": "describe('test2')",
					loc: jasmine.anything()
				}, {
					name: 'ok.on(\'click\')', longName: 'ok.on(\'click\')',
					loc: jasmine.anything()
				}, {
					name: '.on(\'click\')', longName: '.on(\'click\')',
					loc: jasmine.anything()
				}
			]});
	});

	it('can recoganise Arraw function', function() {
		var result = parse(fs.readFileSync(Path.resolve(__dirname, 'samples/sample-arrow.js')));
		//console.log(result);
		expect(result).toEqual({
			child: [
				{
					name: '=>',
					longName: '=>',
					loc: jasmine.anything(),
					child: [
						{
							name: 'func1',
							longName: 'func1',
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
					longName: 'b',
					name: 'b',
					loc: jasmine.anything()
				}
			]
		});
	});

	it('can recoganise function in assignment expression', function() {
		var result = parse(fs.readFileSync(Path.resolve(__dirname, 'samples/sample-assignment.js')));
		//console.log(result);
		expect(result).toEqual({
			child: [
				{name: 'abc.efg', longName: 'abc.efg', loc: jasmine.anything()},
				{name: 'a.b.c.1', longName: 'a.b.c.1', loc: jasmine.anything()},
				{name: 'efg', longName: 'efg', loc: jasmine.anything()},
				{name: 'this.xxx', longName: 'this.xxx', loc: jasmine.anything()}
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
					longName: 'func5',
					loc: jasmine.anything(),
					child: [
						{
							name: 'func6',
							longName: 'func6',
							loc: jasmine.anything(),
						},
						{
							name: '=>',
							longName: '=>',
							loc: jasmine.anything(),
							child: [
								{longName: 'func1', name: 'func1', loc: jasmine.anything()}
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
				{
					name: 'obj', longName: jasmine.anything(), loc: jasmine.anything(),
					child: [
						{
							name: 'propertyA', longName: jasmine.anything(), loc: jasmine.anything(),
							child: [
								{
									name: 'func2', longName: 'obj.propertyA.func2', loc: jasmine.anything(),
									child: [
										{name: '', longName: '', loc: jasmine.anything()}
									]
								}
							]
						}
					]
				}
			]
		});
	});

	it('can work for comprehensive case', function() {
		var result = parse(fs.readFileSync(Path.resolve(__dirname, 'samples/sample-comprehensive.js')));
		//console.log(JSON.stringify(result, null, '  '));
		expect(result).toEqual({
			child: [
				{
					name: '{}', longName: '.', loc: jasmine.anything(),
					child: [{
						name: 'atom-js-grammar:toggle',
						longName: '.atom-js-grammar:toggle', loc: jasmine.anything()
					}]
				}, {
					name: '', longName: '', loc: jasmine.anything()
				}
			]
		});
	});

	it('can work for array of function case', function() {
		var result = parse(fs.readFileSync(Path.resolve(__dirname, 'samples/array-function.js')));
		//console.log(JSON.stringify(result, null, '  '));
		expect(result).toEqual({
			child: [
				{name: 'a', longName: 'a', loc: jasmine.anything()},
				{name: 'b', longName: 'b', loc: jasmine.anything()},
				{name: '=>', longName: '=>', loc: jasmine.anything()},
			]
		});
	});
});
