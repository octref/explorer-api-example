'use strict';

import * as vscode from 'vscode';
import { TreeExplorerNodeProvider } from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as ts from 'typescript';

export function activate(context: vscode.ExtensionContext) {
  const activeFilePath = vscode.window.activeTextEditor.document.uri.fsPath;

  vscode.workspace.registerTreeExplorerNodeProvider('pineTree', new OutlineNodeProvider(activeFilePath));

  const gotoDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: 'steelblue',
  });
  const highlightDecoration = vscode.window.createTextEditorDecorationType({
    backgroundColor: '#555',
    isWholeLine: true
  });

  vscode.commands.registerCommand('extension.goto', (node) => {
    const range = (<OutlineNode>node).getRange();
    vscode.window.activeTextEditor.revealRange(range, 1);
    vscode.window.activeTextEditor.setDecorations(gotoDecoration, [range]);
  });
  vscode.commands.registerCommand('extension.highlight', (node) => {
    const range = (<OutlineNode>node).getRange();
    vscode.window.activeTextEditor.revealRange(range, 1);
    vscode.window.activeTextEditor.setDecorations(highlightDecoration, [range]);
  });
}

export function deactivate() {
}

class OutlineNodeProvider<T extends OutlineNode> implements TreeExplorerNodeProvider<T> {
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
      return resolve(children);
    })
  }
}

class OutlineNode {
  clickCommand: string;

  constructor(
    public label: string,
    public tsNode: ts.Node,
    public tsSource: ts.SourceFile,
    public shouldInitiallyExpand: boolean = true
  ) {
    this.clickCommand = tsNode.getChildCount() === 0
                      ? 'extension.goto'
                      : 'extension.highlight';
  }

  getRange(): vscode.Range {
    const start = this.tsSource.getLineAndCharacterOfPosition(this.tsNode.getStart());
    const end   = this.tsSource.getLineAndCharacterOfPosition(this.tsNode.getEnd());

    const startPos = new vscode.Position(start.line, start.character);
    const endPos   = new vscode.Position(end.line, end.character);
    return new vscode.Range(startPos, endPos);
  }
}