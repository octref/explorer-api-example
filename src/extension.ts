'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TreeContentProvider, ITreeNode } from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

  vscode.workspace.registerTreeContentProvider('pineTree', new PineTreeContentProvider());
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class PineTreeContentProvider implements vscode.TreeContentProvider {

  constructor() {
  }

  provideTreeContent(): Thenable<ITreeNode> {
    return new Promise((resolve, reject) => {
      resolve(getTree());
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


function getTree(): TreeViewNode {
	const root   = randomNode();
  const node1  = randomNode();
  const node2  = randomNode();
  const node11 = randomNode();

  root.addChild(node1);
  root.addChild(node2);
  node1.addChild(node11);

  for (let i = 0; i < randomInt(20); i++) {
    root.addChild(randomNode());
  }

  for (let i = 0; i < randomInt(20); i++) {
    node1.addChild(randomNode());
  }

  for (let i = 0; i < randomInt(20); i++) {
    node2.addChild(randomNode());
  }

  for (let i = 0; i < randomInt(20); i++) {
    node11.addChild(randomNode());
  }

	return root;
}

function randomNode() {
  const digit = 5 + randomInt(5); 
  const label = Math.random().toString(36).substring(2, 2 + digit);
  return new TreeViewNode(label);
}

function randomInt(top: number) {
  return Math.floor(Math.random() * top);
}