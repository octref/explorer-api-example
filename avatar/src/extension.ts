'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TreeExplorerNodeProvider, TreeExplorerNode } from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as request from 'request';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const rootPath = vscode.workspace.rootPath;

  vscode.workspace.registerTreeExplorerNodeProvider('pineTree', new PineTreeExplorerNodeProvider());
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class PineTreeExplorerNodeProvider implements TreeExplorerNodeProvider {
  private tree: FollowerViewNode;

  constructor() {
    this.tree = new FollowerViewNode('octref');
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
        'Authorization': 'token 9bbe8c7b62f3158f58f1339476cea116aeee9b16'
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

class FollowerViewNode implements TreeExplorerNode {
  public login: string;

  constructor(
    public label: string,
    public shouldInitiallyExpand: boolean = true
  ) {
    this.login = this.label;
  }
}