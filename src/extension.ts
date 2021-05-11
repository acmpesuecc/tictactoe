import * as fs from 'fs'
import * as path from 'path'
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
	let disposable = vscode.commands.registerCommand('tictactoe.start', () => {
		// Create and show a new webview
		const panel = vscode.window.createWebviewPanel(
			'tictactoe', // Identifies the type of the webview. Used internally
			'TicTacToe', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{ enableScripts: true } // Webview options. More on these later.
		);
		// panel.webview.html = getWebviewContent();
		const filePath: vscode.Uri = vscode.Uri.file(path.join(context.extensionPath, 'src', 'game.html'));
		panel.webview.html = fs.readFileSync(filePath.fsPath, 'utf8');

	});
	context.subscriptions.push(disposable);
}
