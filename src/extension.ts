// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import replaceKeyValue from './core/replaceKeyValue';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Congratulations, your extension "createVueI18nConfigCommand" is now active!');
	const createVueI18nConfigCommand = vscode.commands.registerTextEditorCommand('extension.createVueI18nConfigCommand', (textEditor, edit) => {
		const text = textEditor.document.getText(textEditor.selection);
		const anchor = textEditor.selection.anchor;
		const active = textEditor.selection.active;
		const line: string = textEditor.document.lineAt(textEditor.selection.anchor).text; // 光标所在的行
		const prevText = line.substring(0, anchor.character);
		const tailText = line.substring(active.character);
		const prevMatches = prevText.match(/(:?)([\w\-]+)\s*=\s*"$/);
		if (prevMatches && tailText.match(/^"/)) {
			const [all, direct, propertyName] = prevMatches;
			// 替换起点位置
			const start = new vscode.Position(anchor.line, prevText.substring(0, prevText.length - all.length).length);
			// 替换终点位置
			const end = new vscode.Position(active.line, active.character);
			// 内容替换
			textEditor.edit(editBuilder => {
				const key = `${getVueI18Name()}.${Date.now()}`;
				editBuilder.replace(new vscode.Range(start, end), `${direct || ':'}${propertyName}="$t('${key}')`);
				replaceKeyValue(getProjectRoot(), key, text);
			});
		} else {
			// 替换起点位置
			const start = new vscode.Position(anchor.line, anchor.character);
			// 替换终点位置
			const end = new vscode.Position(active.line, active.character);
			// 内容替换
			textEditor.edit(editBuilder => {
				const key = `${getVueI18Name()}.${Date.now()}`;
				editBuilder.replace(new vscode.Range(start, end), `{{ $t("${key}") }}`);
				replaceKeyValue(getProjectRoot(), key, text);
			});
		}

		function getVueI18Name() {
			return textEditor.document.fileName.replace(/(\/[iI]ndex)?\.\w+$/, '').replace(/.*\/src\//, '').replace(/\//g, '.');
		}

		function getProjectRoot() {
			return textEditor.document.fileName.replace(/\/src\/.*/, '');
		}

  		// getWordRangeAtPosition获取光标所在单词的行列号范围；getText获取指定范围的文本
  		// const positionWord = textEditor.document.getText(textEditor.document.getWordRangeAtPosition(position));
  		// console.log('光标所在位置的单词是：', positionWord);

	});

	context.subscriptions.push(createVueI18nConfigCommand);

	const changeVueI18nConfigCommand = vscode.commands.registerTextEditorCommand('extension.changeVueI18nConfigCommand', (textEditor, edit) => {
		const position = textEditor.selection.active;
    	const uri = textEditor.document.uri;
		if(vscode.window.activeTextEditor){
			const executeDocumentRenameProvider = vscode.commands.executeCommand('vscode.executeDocumentRenameProvider',
				uri,
				position,
				'donkey').then((edit: any) => {
					debugger;
					if (!edit) {throw Error;}
					return vscode.workspace.applyEdit(edit);
				})
				.then(undefined, err => {
				   console.error('I am error');
				});
		}
	});
	context.subscriptions.push(createVueI18nConfigCommand);
}

// this method is called when your extension is deactivated
export function deactivate() {}


