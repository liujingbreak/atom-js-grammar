/* global waitsForPromise */
var fs = require('fs');
var AtomJsGrammar;

AtomJsGrammar = require('../lib/atom-js-grammar');


describe('AtomJsGrammar', function() {
    var activationPromise, ref, workspaceElement;
    ref = [], workspaceElement = ref[0], activationPromise = ref[1];
    beforeEach(function() {
      workspaceElement = atom.views.getView(atom.workspace);
      return activationPromise = atom.packages.activatePackage('atom-js-grammar');
    });
    describe('when the atom-js-grammar:toggle event is triggered', function() {
      xit('hides and shows the modal panel', function() {
        expect(workspaceElement.querySelector('.atom-js-grammar')).not.toExist();
        atom.commands.dispatch(workspaceElement, 'atom-js-grammar:toggle');
        waitsForPromise(function() {
          return activationPromise;
        });
        return runs(function() {
          var atomJsGrammarElement, atomJsGrammarPanel;
          expect(workspaceElement.querySelector('.atom-js-grammar')).toExist();
          atomJsGrammarElement = workspaceElement.querySelector('.atom-js-grammar');
          expect(atomJsGrammarElement).toExist();
          atomJsGrammarPanel = atom.workspace.panelForItem(atomJsGrammarElement);
          expect(atomJsGrammarPanel.isVisible()).toBe(true);
          atom.commands.dispatch(workspaceElement, 'atom-js-grammar:toggle');
          return expect(atomJsGrammarPanel.isVisible()).toBe(false);
        });
      });
      xit('hides and shows the view', function() {
        jasmine.attachToDOM(workspaceElement);
        expect(workspaceElement.querySelector('.atom-js-grammar')).not.toExist();
        atom.commands.dispatch(workspaceElement, 'atom-js-grammar:toggle');
        waitsForPromise(function() {
          return activationPromise;
        });
        return runs(function() {
          var atomJsGrammarElement;
          atomJsGrammarElement = workspaceElement.querySelector('.atom-js-grammar');
          expect(atomJsGrammarElement).toBeVisible();
          atom.commands.dispatch(workspaceElement, 'atom-js-grammar:toggle');
          return expect(atomJsGrammarElement).not.toBeVisible();
        });
      });

    });
});
