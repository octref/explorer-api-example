'use strict';

import * as vscode from 'vscode';
import { TreeExplorerNodeProvider } from 'vscode';

import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  const rootPath = vscode.workspace.rootPath;

  vscode.workspace.registerTreeExplorerNodeProvider('depTree', new DepNodeProvider(rootPath));
  
  vscode.commands.registerCommand('extension.openPackageOnNpm', (node: Leaf) => {
    vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(`https://www.npmjs.com/package/${node.moduleName}`));
  });
}

export function deactivate() {
}

class DepNodeProvider implements TreeExplorerNodeProvider<DepNode> {
  constructor(private workspaceRoot: string) {
    
  }
  
  getLabel(node: DepNode): string {
    switch (node.kind) {
      case 'root':
        return '';
      case 'node':
        return node.moduleName;
      case 'leaf':
        return node.moduleName;
    }
  }
  
  getHasChildren(node: DepNode): boolean {
    return node.kind !== 'leaf';
  }
  
  getClickCommand(node: DepNode): string {
    if (node.kind === "leaf") {
      return 'extension.openPackageOnNpm';
    } else {
      return null;
    }
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
  }
}

type DepNode = Root | Node | Leaf;

class Root {
  kind: "root" = "root";
}

class Node {
  kind: "node" = "node";
  
  constructor(
    public moduleName: string
  ) {
    
  }
}

class Leaf {
  kind: "leaf" = "leaf"

  constructor(
    public moduleName: string
  ) {
    
  }
}