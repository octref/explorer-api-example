'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TreeExplorerNodeProvider } from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as request from 'request';
import GH_TOKEN from './token';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const rootPath = vscode.workspace.rootPath;

  vscode.workspace.registerTreeExplorerNodeProvider('pineTree', new PineTreeExplorerNodeProvider());
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class PineTreeExplorerNodeProvider<T extends FollowerViewNode> implements TreeExplorerNodeProvider<T> {
  private tree: FollowerViewNode;

  constructor() {
    this.tree = new FollowerViewNode('octref');
  }
  
  getLabel(node: T) {
    return node.login;
  }
  
  getHasChildren(node: T) {
    return true;
  }

  provideRootNode(): Thenable<FollowerViewNode> {
    return new Promise((resolve, reject) => {
      resolve(this.tree);
    })
  }

  resolveChildren(node: FollowerViewNode): Thenable<FollowerViewNode[]> {
    const options = {
      url: `https://api.github.com/users/${node.login}/followers`,
      headers: {
        'User-Agent': 'pine',
        'Authorization': GH_TOKEN
      }
    };

    return new Promise((resolve, reject) => {
      request(options, (err, res, body) => {
        const followers = JSON.parse(body);
        resolve(followers.map(f => {
          return new FollowerViewNode(f.login);
        }));
      });
    });
  }
}

class FollowerViewNode {
  constructor(
    public login: string,
    public shouldInitiallyExpand: boolean = true
  ) {
  }
}