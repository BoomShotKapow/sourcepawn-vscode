import {
  CompletionItemKind,
  Range,
  CompletionItem,
  SignatureInformation,
  Hover,
  DocumentSymbol,
  SymbolKind,
  LocationLink,
} from "vscode";
import { URI } from "vscode-uri";
import { basename } from "path";

import { descriptionToMD } from "../../spUtils";
import { SPItem } from "./spItems";

export class TypeDefItem implements SPItem {
  name: string;
  details: string;
  type: string;
  file: string;
  description: string;
  kind = CompletionItemKind.TypeParameter;
  range: Range;
  fullRange: Range;

  constructor(
    name: string,
    details: string,
    file: string,
    description: string,
    type: string,
    range: Range,
    fullRange: Range
  ) {
    this.name = name;
    this.details = details;
    this.file = file;
    this.type = type;
    this.description = description;
    this.range = range;
    this.fullRange = fullRange;
  }

  toCompletionItem(): CompletionItem {
    return {
      label: this.name,
      kind: this.kind,
      detail: basename(this.file),
    };
  }

  toDefinitionItem(): LocationLink {
    return {
      targetRange: this.range,
      targetUri: URI.file(this.file),
    };
  }

  toSignature(): SignatureInformation {
    return;
  }

  toHover(): Hover {
    if (!this.description) {
      return;
    }
    return new Hover([
      { language: "sourcepawn", value: this.details },
      descriptionToMD(this.description),
    ]);
  }

  toDocumentSymbol(): DocumentSymbol {
    if (this.fullRange === undefined) {
      return;
    }
    return new DocumentSymbol(
      this.name,
      this.description,
      SymbolKind.TypeParameter,
      this.fullRange,
      this.range
    );
  }
}
