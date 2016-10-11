'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TreeExplorerNodeProvider, TreeExplorerNode } from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as ts from 'typescript';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const activeFilePath = vscode.window.activeTextEditor.document.uri.fsPath;

  vscode.workspace.registerTreeExplorerNodeProvider('pineTree', new OutlineNodeProvider(activeFilePath));

  const deco = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'steelblue'
  });
  vscode.commands.registerCommand('extension.outlineJump', (node) => {
    const range = (<OutlineNode>node).getRange();
    vscode.window.activeTextEditor.revealRange(range, 1);
    vscode.window.activeTextEditor.setDecorations(deco, [range]);
  });
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class OutlineNodeProvider implements TreeExplorerNodeProvider {
  source: ts.SourceFile;

  constructor(filePath: string) {
    const file = fs.readFileSync(filePath, 'utf-8');
    this.source = ts.createSourceFile('outline.ts', file, ts.ScriptTarget.ES5, true);
  }

  provideRootNode(): Thenable<OutlineNode> {
    return new Promise((resolve, reject) => {
      resolve(new OutlineNode(ts.SyntaxKind[this.source.kind], this.source, this.source));
    })
  }

  resolveChildren(node: OutlineNode): Thenable<OutlineNode[]> {
    return new Promise((resolve, reject) => {
      const children = node.tsNode.getChildren().map(child => {
        return new OutlineNode(ts.SyntaxKind[child.kind], child, this.source);
      });
      const { line, character } = this.source.getLineAndCharacterOfPosition(node.tsNode.pos);
      return resolve(children);
    })
  }
}

class OutlineNode implements TreeExplorerNode {

  constructor(
    public label: string,
    public tsNode: ts.Node,
    public tsSource: ts.SourceFile,
    public onClickCommand: string = 'extension.outlineJump',
    public shouldInitiallyExpand: boolean = true
  ) {
  }

  getRange(): vscode.Range {
    const start = this.tsSource.getLineAndCharacterOfPosition(this.tsNode.getStart());
    const end   = this.tsSource.getLineAndCharacterOfPosition(this.tsNode.getEnd());

    const startPos = new vscode.Position(start.line, start.character);
    const endPos   = new vscode.Position(end.line, end.character);
    return new vscode.Range(startPos, endPos);
  }
}