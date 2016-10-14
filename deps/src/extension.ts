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
  
  vscode.commands.registerCommand('extension.openUri', (node: DepNode) => {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(node.packageJson.homepage));
  });
  vscode.commands.registerCommand('extension.openPackageOnNpm', (node: DepNode) => {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${node.name}`));
  });
}

export function deactivate() {
}

class DepNodeProvider<T extends DepNode> implements TreeExplorerNodeProvider<T> {
  constructor(public workspaceRoot: string) {
    
  }
  
  getLabel(node: T): string {
    return node.name + ' ' + node.packageJson.version;
  }
  
  getHasChildren(node: T): boolean {
    return node.hasChildren;
  }
  
  getClickCommand(node: T): string {
    if (this.getHasChildren(node)) {
      return null;
    } else if (node.packageJson.homepage) {
      return 'extension.openUri';
    } else {
      return 'extension.openPackageOnNpm';
    }
  }

  provideRootNode(): Thenable<DepNode> {
    const root = this.workspaceRoot;
    return new Promise((resolve, reject) => {
      resolve(new DepNode('root', { version: '1.0' }, root, true));
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
          const deps = _.map(packageJson.dependencies, (version, dep) => {
            return new DepNode(dep.toString(), { version }, null, false);
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
              result.push(new DepNode(dep, packageJson, depRootPath, hasChildren));
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
    public packageJson: any,
    public rootPath: string,
    public hasChildren: boolean,
    public shouldInitiallyExpand: boolean = true,
    public onClickCommand: string = null
  ) {
  }
}