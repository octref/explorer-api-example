'use strict';

import * as vscode from 'vscode';
import { TreeExplorerNodeProvider } from 'vscode';
import * as IORedis from 'ioredis';

export function activate(context: vscode.ExtensionContext) {

  vscode.workspace.registerTreeExplorerNodeProvider('redisTree', new RedisNodeProvider());
  
  vscode.commands.registerCommand('extension.redis', (node: RedisValueNode) => {
    const uri = vscode.Uri.parse("redis://open/" + node.value);
    vscode.workspace.openTextDocument(uri).then(doc => {
      vscode.commands.executeCommand('vscode.open', uri);
    });
  });

  vscode.workspace.registerTextDocumentContentProvider('redis', {
    provideTextDocumentContent: (uri: vscode.Uri): string => {
      return uri.path.slice(1);
    }
  });
}

export function deactivate() {

}

class RedisNodeProvider implements TreeExplorerNodeProvider<RedisNode> {
  private redis: IORedis.Redis;
  
  constructor() {
    this.redis = new IORedis();
  }
  
  getLabel(node: RedisNode): string {
    return node.label;
  }
  
  getHasChildren(node: RedisNode): boolean {
    return node.kind !== "value";
  }
  
  getClickCommand(node: RedisNode): string {
    if (node.kind === "value"){
      this.redis.get(node.key, (err, value) => {
        node.value = value;
      });
      return "extension.redis";
    }
    else
      return null;
  }

  provideRootNode(): RedisRootNode {
    return new RedisRootNode();
  }
  
  resolveChildren(node: RedisNode): Thenable<RedisNode[]> {
    return new Promise((resolve, reject) => {
      switch(node.kind) {
        case "root":
          return resolve(this.getAllDBNodes());
        case "db":
          this.redis.select(node.index, () => {
            this.redis.keys('*', (err, keys: string[]) => {
              if (err) resolve([]);
              resolve(keys.map(key => {
                return new RedisValueNode(key);
              }));
            });
          });
          return;
        case "value":
          return resolve([]);
      }
    });

  }
  
  private getAllDBNodes() {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(index => {
      return new RedisDBNode(index);
    });
  }
}

type RedisNode = RedisRootNode | RedisDBNode | RedisValueNode;

class RedisRootNode {
  kind: "root" = "root";
  label: string = "root";
  
  constructor(
  ) {
  }
}

class RedisDBNode {
  kind: "db" = "db";
  get label() { return "db " + this.index }
  
  constructor(
    public index: number
  ) {

  }

}

class RedisValueNode {
  kind: "value" = "value";
  get label() { return this.key }
  value: string;
  
  constructor(
    public key: string
  ) {

  }
}