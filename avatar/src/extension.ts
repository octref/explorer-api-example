'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TreeContentProvider, ITreeNode } from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as request from 'request';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const rootPath = vscode.workspace.rootPath;

  vscode.workspace.registerTreeContentProvider('pineTree', new PineTreeContentProvider());
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class PineTreeContentProvider implements vscode.TreeContentProvider {
  private tree: FollowerViewNode;

  constructor() {
    this.tree = new FollowerViewNode('octref');
  }

  provideTreeContent(): Thenable<ITreeNode> {
    return new Promise((resolve, reject) => {
      resolve(this.tree);
    })
  }

  resolveChildren(node: ITreeNode): Thenable<ITreeNode[]> {
    return new Promise((resolve, reject) => {
      var fNode = new FollowerViewNode(node.label);
      fNode.resolveChildren().then(followers => {
        resolve(followers);
      });
    });
  }
}

class FollowerViewNode implements ITreeNode {
  constructor(
    public label: string,
    public isExpanded: boolean = true,
    public children: vscode.ITreeNode[] = [],
    public isChildrenResolved: boolean = false) {
  }

  private getFollowers(login: string): Thenable<FollowerViewNode[]> {
    const options = {
      url: `https://api.github.com/users/${login}/followers`,
      headers: {
        'User-Agent': 'pine'
      }
    };

    return new Promise((resolve, reject) => {
      request(options, (err, res, body) => {
        const followers = JSON.parse(body);
        resolve(followers.map(follower => {
          return new FollowerViewNode(follower.login);
        }));
      })
    });
  }

  resolveChildren(): Thenable<FollowerViewNode[]> {
    return new Promise((resolve, reject) => {
      this.getFollowers(this.label).then(followers => {
        this.children = followers;
        this.isChildrenResolved = true;
        resolve(followers);
      });
    });
  }
}