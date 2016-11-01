'use strict';

import * as vscode from 'vscode';
import { TreeExplorerNodeProvider, TreeExplorerNode } from 'vscode';

import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  const rootPath = vscode.workspace.rootPath;

  vscode.workspace.registerTreeExplorerNodeProvider('depTree', new DepNodeProvider(rootPath));
  
  vscode.commands.registerCommand('extension.openPackageOnNpm', (node: DepNode) => {
    if (node.kind === 'leaf') {
      vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${node.moduleName}`));
    }
  });
}

export function deactivate() {
}

class DepNodeProvider implements TreeExplorerNodeProvider {
  constructor(private workspaceRoot: string) {
    
  }
  
  provideRootNode(): DepNode {
    return new Root();
  }
  
  resolveChildren(node: DepNode): Thenable<DepNode[]> {
    return new Promise((resolve, reject) => {
      switch(node.kind) {
        case 'root':
          resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'package.json')));
          break;
        case 'node':
          resolve(this.getDepsInPackageJson(path.join(this.workspaceRoot, 'node_modules', node.moduleName, 'package.json')));
          break;
        case 'leaf':
          resolve([]);
      }
    });
  }
  
  private getDepsInPackageJson(filePath: string): DepNode[] {
    try {
      fs.accessSync(filePath);

      const packageJson = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    
      const deps = Object.keys(packageJson.dependencies).map(d => {
        try {
          fs.accessSync(path.join(this.workspaceRoot, 'node_modules', d));
          return new Node(d);
        } catch (err) {
          return new Leaf(d);
        }
      });
      const devDeps = Object.keys(packageJson.devDependencies).map(d => {
        try {
          fs.accessSync(path.join(this.workspaceRoot, 'node_modules', d));
          return new Node(d);
        } catch (err) {
          return new Leaf(d);
        }
      });

      return deps.concat(devDeps);
    } catch (err) { // No package.json at root
      return [];
    }
  }
}

type DepNode = Root | Node | Leaf;

class Root implements TreeExplorerNode {
  kind: "root" = "root";

  label: '';
  hasChildren: true;
}

class Node implements TreeExplorerNode {
  kind: "node" = "node";

  get label() { return this.moduleName; }
  hasChildren: true;
  
  constructor(
    public moduleName: string
  ) {
    
  }
}

class Leaf {
  kind: "leaf" = "leaf"

  get label() { return this.moduleName; }
  hasChildren: false;
  get onClickCommand() {
    return {
      title: "Open on NPM",
      command: "extension.openPackageOnNpm",
      arguments: [this]
    };
  }

  constructor(
    public moduleName: string
  ) {
    
  }
}