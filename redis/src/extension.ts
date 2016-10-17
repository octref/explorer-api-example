'use strict';

import * as vscode from 'vscode';
import { TreeExplorerNodeProvider } from 'vscode';
import * as IORedis from 'ioredis';

export function activate(context: vscode.ExtensionContext) {
  
  vscode.workspace.registerTreeExplorerNodeProvider('pineTree', new RedisNodeProvider());

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
  
  constructor(
    public key: string
  ) {

  }
}