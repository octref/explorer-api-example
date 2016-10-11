'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TreeExplorerNodeProvider, TreeExplorerNode } from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  const rootPath = vscode.workspace.rootPath;

  vscode.workspace.registerTreeExplorerNodeProvider('pineTree', new DepNodeProvider(rootPath));
}

// this method is called when your extension is deactivated
export function deactivate() {
}

class DepNodeProvider implements TreeExplorerNodeProvider {
  constructor(public workspaceRoot: string) {
    
  }

  provideRootNode(): Thenable<DepNode> {
    const root = this.workspaceRoot;
    return new Promise((resolve, reject) => {
      resolve(new DepNode('root', root));
    })
  }
  
  resolveChildren(node: DepNode): Thenable<DepNode[]> {
    return new Promise((resolve, reject) => {
      // Virtual dep
      // Todo: acces package.json on npm and get deps
      if (!node.rootPath) {
        return resolve([]);
      }
      
      const nodeModulesPath = path.join(node.rootPath, 'node_modules');
      fs.access(nodeModulesPath, fs.F_OK, (err) => {
        // No node_modules, just read deps in package.json
        if (err) {
          const packageJson = JSON.parse(fs.readFileSync(path.join(node.rootPath, 'package.json'), 'utf-8'));
          const deps = _.map(packageJson.dependencies, (ver, dep) => {
            return new DepNode(dep + ' ' + ver, null);
          });
          return resolve(deps);
        // Has node_modules, read each folder in it as dep
        } else {
          const result = [];
          const deps = fs.readdirSync(nodeModulesPath);
          deps.forEach((dep) => {
            if (!dep.startsWith('.') && !dep.startsWith('@')) {
              const depRootPath = path.join(nodeModulesPath, dep);
              const packageJson = JSON.parse(fs.readFileSync(path.join(depRootPath, 'package.json'), 'utf-8'));
              result.push(new DepNode(dep + ' ' + packageJson.version, depRootPath));
            }
          });
          return resolve(result);
        }
      });

    });
  }
}

class DepNode implements TreeExplorerNode {
  constructor(
    public label: string,
    public rootPath: string,
    public shouldInitiallyExpand: boolean = true,
    public onClickCommand: string = null
  ) {
  }
}