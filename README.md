# Javascript file function structure viewer

Helps you to navigate a file structure based on *function* definition and jump to the line.

It has more structural view than what `cmd + R` has.

## Usage:
1. Focus on editor area

2. Press `cmd + F12` or `ctrl + F12` to toggle visibility, also press `cmd + F12`, `ctrl + F12` or `ESC` to hide.

![](https://github.com/liujingbreak/atom-js-grammar/raw/master/preview.png)

Excellent viewer for test spec-like file structure.
![](https://github.com/liujingbreak/atom-js-grammar/raw/master/preview2.jpg)

### Supported grammar structure
This plugin uses `acorn-jsx` to parse JS grammar structure, so it should support parsing all versions of ECMAScript and JSX script.

#### What will be shown in popup list
- Class decalaration node which has any member function
- Function type node
- Arrow function node
- Nested function type node
- Variable name which is assigned to a function type node
- JSON object literal which contains any property whose value is a function type node
- Object property whose value is a function type node
- Function call expression whose second argument is a function callback (helps to view Test spec-like file structure)
