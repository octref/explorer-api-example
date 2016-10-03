'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TreeContentProvider, ITreeNode } from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const rootPath = vscode.workspace.rootPath;

  vscode.workspace.registerTreeContentProvider('pineTree', new PineTreeContentProvider(rootPath));
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class PineTreeContentProvider implements vscode.TreeContentProvider {
  private tree: TreeViewNode;

  constructor(rootPath: string) {
    this.tree = getTree(rootPath);
  }

  provideTreeContent(): Thenable<ITreeNode> {
    return new Promise((resolve, reject) => {
      resolve(this.tree);
    })
  }
}

class TreeViewNode implements ITreeNode {
  label: string;
  isExpanded: boolean;
  children: vscode.ITreeNode[];

  constructor(
    label: string,
    isExpanded: boolean = true,
    children: vscode.ITreeNode[] = []) {
    this.label = label;
    this.isExpanded = isExpanded;
    this.children = children;
  }

  addChild(child: vscode.ITreeNode) {
    this.children.push(child);
  }
}

function getTree(rootPath: string): TreeViewNode {
  const root = new TreeViewNode('root');

  const items = fs.readdirSync(path.join(rootPath, 'node_modules'));
 
  items.forEach(item => {
    if (!item.startsWith('.') && !item.startsWith('@')) {
      const packageJson = JSON.parse(fs.readFileSync(path.join(rootPath, 'node_modules', item, 'package.json'), 'utf-8'));

      const node = new TreeViewNode(item + ' ' + packageJson.version);
      root.addChild(node);

      _.forEach(packageJson.dependencies, (ver, dep) => {
        node.addChild(new TreeViewNode(dep + ' ' + ver));
      });
    }
  });

  return root;
}