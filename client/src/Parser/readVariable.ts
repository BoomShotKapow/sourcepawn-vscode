﻿import { addVariableItem } from "./addVariableItem";
import { Parser } from "./spParser";

export function readVariable(
  parser: Parser,
  match: RegExpMatchArray,
  line: string
) {
  let match_variables = [];
  let match_variable: RegExpExecArray;
  // Check if it's a multiline declaration
  let commentMatch = line.match(/\/\//);
  let croppedLine = line;
  if (commentMatch) {
    croppedLine = line.slice(0, commentMatch.index);
  }
  if (/(;)(?:\s*|)$/.test(croppedLine)) {
    // Separate potential multiple declarations
    let re = /\s*(?:(?:const|static|public|stock)\s+)*(\w*)\s*(?:\[(?:[A-Za-z_0-9+* ]*)\])*\s+(\w+)(?:\[(?:[A-Za-z_0-9+* ]*)\])*(?:\s*=\s*(?:(?:\"[^]*\")|(?:\'[^]*\')|(?:[^,]+)))?/g;
    while ((match_variable = re.exec(line)) != null) {
      match_variables.push(match_variable);
    }
    for (let variable of match_variables) {
      let variable_completion = variable[2].match(
        /(?:\s*)?([A-Za-z_,0-9]*)(?:(?:\s*)?(?:=(?:.*)))?/
      )[1];
      if (!parser.IsBuiltIn) {
        addVariableItem(parser, variable_completion, line, variable[1]);
      }
    }
  } else {
    let parseLine: boolean = true;
    while (parseLine) {
      parseLine = !match[1].match(/(;)\s*$/);
      // Separate potential multiple declarations
      match_variables = match[1].match(
        /(?:\s*)?([A-Za-z0-9_\[`\]]+(?:\s+)?(?:\=(?:(?:\s+)?(?:[\(].*?[\)]|[\{].*?[\}]|[\"].*?[\"]|[\'].*?[\'])?(?:[A-Za-z0-9_\[`\]]*)))?(?:\s+)?|(!,))/g
      );
      if (!match_variables) {
        break;
      }
      for (let variable of match_variables) {
        let variable_completion = variable.match(
          /(?:\s*)?([A-Za-z_,0-9]*)(?:(?:\s*)?(?:=(?:.*)))?/
        )[1];
        if (!parser.IsBuiltIn) {
          addVariableItem(parser, variable_completion, line, "");
        }
      }
      match[1] = parser.lines.shift();
      line = match[1];
      parser.lineNb++;
    }
  }
  return;
}
