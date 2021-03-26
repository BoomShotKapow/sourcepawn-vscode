import * as vscode from "vscode";
import { registerSMLinter } from "./smLinter";
import * as glob from "glob";
import { SM_MODE } from "./smMode";
import { Providers } from "./Providers/smProviders";
import { registerSMCommands } from "./Commands/registerCommands"; 
import { DocumentFormattingEditProvider } from "./smFormater";


let getDirectories = function (src, callback) {
  glob(src + '/**/*.sp', callback);
};


export function activate(context: vscode.ExtensionContext) {
  let providers = new Providers(context.globalState);
  let formatter = new DocumentFormattingEditProvider();
  // Parse files at document opening.
  let sm_home : string = vscode.workspace.getConfiguration("sourcepawnLanguageServer").get(
		"sourcemod_home");
  providers.parse_sm_api(sm_home);
  let workspace : vscode.WorkspaceFolder = vscode.workspace.workspaceFolders[0];
  if(typeof workspace != "undefined")
  {
    getDirectories(workspace.uri.fsPath, function (err, res) {
      if (err) {
        console.log("Couldn't read .sp file, ignoring : ", err);
      } else {
        for(let file of res)
        {
          providers.handle_document_opening(file);
        }
      }
    });
  }

  context.subscriptions.push(providers.completionsProvider);
	context.subscriptions.push(vscode.languages.registerCompletionItemProvider(SM_MODE , providers.completionsProvider));
	context.subscriptions.push(vscode.languages.registerSignatureHelpProvider(SM_MODE, providers.completionsProvider, "("));
  context.subscriptions.push(vscode.languages.registerDefinitionProvider(SM_MODE, providers.definitionsProvider));
  context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(SM_MODE, formatter));
  // Passing providers as an arguments is required to be able to use 'this' in the callbacks.
	vscode.workspace.onDidChangeTextDocument(providers.handle_document_change, providers, context.subscriptions);
	vscode.workspace.onDidOpenTextDocument(providers.handle_new_document, providers, context.subscriptions);
  
  // Register SM Commands
  registerSMCommands(context);

	// Register SM linter
  registerSMLinter(context);
}
