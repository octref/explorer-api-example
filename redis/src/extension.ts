'use strict';

import * as vscode from 'vscode';
import { TreeExplorerNodeProvider } from 'vscode';
import * as IORedis from 'ioredis';

export function activate(context: vscode.ExtensionContext) {

  vscode.window.registerTreeExplorerNodeProvider('redisTree', new RedisNodeProvider());
  
  vscode.commands.registerCommand('extension.redisGetVal', (node: KeyVal) => {
    node.getVal().then(val => {
      const uri = vscode.Uri.parse("redis://open/" + val);
      // Load the virtual document
      vscode.workspace.openTextDocument(uri).then(doc => {
        // Open the virtual document in a tab
        // Document content is provided by the `redis` TextDocumentContentProvider
        vscode.commands.executeCommand('vscode.open', uri);
      });
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
  
  getLabel(node: RedisNode): string {
    switch (node.kind) {
      case "root":
        return "root";
      case "db":
        return "DB " + node.index;
      case "keyval":
        return node.key;
    }
  }
  
  getHasChildren(node: RedisNode): boolean {
    return node.kind !== "keyval";
  }
  
  getClickCommand(node: RedisNode): string {
    if (node.kind === "keyval"){
      return "extension.redisGetVal";
    }
    else {
      return null;
    }
  }

  provideRootNode(): Root {
    return new Root();
  }
  
  resolveChildren(node: RedisNode): Thenable<RedisNode[]> {
    return new Promise((resolve, reject) => {
      switch(node.kind) {
        case "root":
          return resolve(this.getAllDBNodes());
        case "db":
          const redis = new IORedis();
          redis.select(node.index, () => {
            redis.keys('*', (err, keys: string[]) => {
              if (err) resolve([]);
              resolve(keys.map(key => {
                return new KeyVal(key);
              }));
            });
          });
          return;
        case "keyval":
          return resolve([]);
      }
    });

  }
  
  private getAllDBNodes() {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(index => {
      return new DB(index);
    });
  }
}

type RedisNode = Root | DB | KeyVal;

class Root {
  kind: "root" = "root";
  
  constructor(
  ) {
  }
}

class DB {
  kind: "db" = "db";
  
  constructor(
    public index: number
  ) {

  }

}

class KeyVal {
  kind: "keyval" = "keyval";
  
  constructor(
    public key: string
  ) {

  }

  getVal(): Thenable<string> {
    const redis = new IORedis();

    return new Promise((resolve) => {
      redis.get(this.key, (err, value) => {
        resolve(value);
      });
    });
  }
}