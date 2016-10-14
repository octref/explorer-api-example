'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { TreeExplorerNodeProvider } from 'vscode';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'lodash';

export function activate(context: vscode.ExtensionContext) {
  const rootPath = vscode.workspace.rootPath;

  vscode.workspace.registerTreeExplorerNodeProvider('pineTree', new DepNodeProvider(rootPath));
}

export function deactivate() {
}

class DepNodeProvider<T extends DepNode> implements TreeExplorerNodeProvider<T> {
  constructor(public workspaceRoot: string) {
    
  }
  
  getLabel(node: T): string {
    return node.name + ' ' + node.version;
  }
  
  getHasChildren(node: T): boolean {
    return node.hasChildren;
  }

  provideRootNode(): Thenable<DepNode> {
    const root = this.workspaceRoot;
    return new Promise((resolve, reject) => {
      resolve(new DepNode('root', null, root, true));
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
            return new DepNode(dep.toString(), ver.toString(), null, false);
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
              const hasChildren = !_.isEmpty(packageJson.dependencies);
              result.push(new DepNode(dep, packageJson.version, depRootPath, hasChildren));
            }
          });
          return resolve(result);
        }
      });
    });
  }
}

class DepNode {
  constructor(
    public name: string,
    public version: string,
    public rootPath: string,
    public hasChildren: boolean,
    public shouldInitiallyExpand: boolean = true,
    public onClickCommand: string = null
  ) {
  }
}