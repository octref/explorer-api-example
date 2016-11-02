'use strict';

import * as vscode from 'vscode';
import { TreeExplorerNodeProvider } from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';
import * as request from 'request';
import GH_TOKEN from './token';

export function activate(context: vscode.ExtensionContext) {
  vscode.workspace.registerTreeExplorerNodeProvider('followerTree', new FollowerNodeProvider('octref'));
}

export function deactivate() {
}

class FollowerNodeProvider implements TreeExplorerNodeProvider<FollowerNode> {

  constructor(
    public rootLogin: string 
  ) {
  }
  
  getLabel(node: FollowerNode) {
    return node.login;
  }
  
  getHasChildren(node: FollowerNode) {
    return true;
  }

  provideRootNode(): FollowerNode {
    return new FollowerNode(this.rootLogin);
  }

  resolveChildren(node: FollowerNode): Thenable<FollowerNode[]> {
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
          return new FollowerNode(f.login);
        }));
      });
    });
  }
}

class FollowerNode {
  constructor(
    public login: string
  ) {
  }
}