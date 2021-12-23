import {
  TextDocument,
  Position,
  CancellationToken,
  CompletionList,
  CompletionItemKind,
} from "vscode";
import { ItemsRepository } from "../Backend/spItemsRepository";
import {
  GetLastFuncName,
  getLastEnumStructNameOrMethodMap,
} from "./spDefinitionProvider";

export function completionProvider(
  itemsRepo: ItemsRepository,
  document: TextDocument,
  position: Position,
  token: CancellationToken
): CompletionList {
  const text = document
    .lineAt(position.line)
    .text.substr(0, position.character);

  // If the trigger char is a space, check if there is a
  // "new" behind, and deal with the associated constructor.
  if (text[text.length - 1] === " ") {
    if (position.character > 0) {
      const line = document
        .lineAt(position.line)
        .text.substr(0, position.character);

      let match = line.match(
        /(\w*)\s+([\w.\(\)]+)(?:\[[\w+ \d]+\])*\s*\=\s*new\s+(\w*)$/
      );
      if (match) {
        var type;

        if (!match[1]) {
          // If the variable is not declared here, look up its type, as it
          // has not yet been parsed.
          let allItems = itemsRepo.getAllItems(document.uri);
          let lastFuncName = GetLastFuncName(position, document, allItems);
          let newPos = new Position(1, match[2].length + 1);
          let {
            lastEnumStructOrMethodMap,
            isAMethodMap,
          } = getLastEnumStructNameOrMethodMap(position, document, allItems);
          let { variableType, words } = itemsRepo.getTypeOfVariable(
            // Hack to use getTypeOfVariable
            match[2] + ".",
            newPos,
            allItems,
            lastFuncName,
            lastEnumStructOrMethodMap
          );
          type = variableType;
        } else {
          // If the variable is declared here, search its type directly.
          type = itemsRepo
            .getAllItems(document.uri)
            .find(
              (item) =>
                item.kind === CompletionItemKind.Class && item.name === match[1]
            ).name;
        }

        // Filter the item to only keep the constructors.
        let items = itemsRepo
          .getAllItems(document.uri)
          .filter((item) => item.kind === CompletionItemKind.Constructor);
        return new CompletionList(
          items.map((e) => {
            // Show the associated type's constructor first.
            if (e.name === type) {
              let tmp = e.toCompletionItem(document.uri.fsPath);
              tmp.preselect = true;
              return tmp;
            }
            return e.toCompletionItem(document.uri.fsPath);
          })
        );
      }
    }
    return undefined;
  }

  // Check if we are dealing with an include.
  let match = text.match(/^\s*#\s*include\s*(?:\<([^>]*)\>?)$/);
  if (!match) {
    match = text.match(/^\s*#\s*include\s*(?:\"([^\"]*)\"?)$/);
  }
  if (match) {
    return itemsRepo.getIncludeCompletions(document, match[1]);
  }
  match = text.match(
    /^\s*(?:HookEvent|HookEventEx)\s*\(\s*(\"[^\"]*|\'[^\']*)$/
  );
  if (match) {
    return itemsRepo.getEventCompletions();
  }
  if (['"', "'", "<", "/", "\\"].includes(text[text.length - 1]))
    return undefined;
  if (/[^:]\:$/.test(text)) {
    return undefined;
  }
  return itemsRepo.getCompletions(document, position);
}
