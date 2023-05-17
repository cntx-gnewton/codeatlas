import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('codeatlas.exportCodebase', () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace opened.');
            return;
        }

        // This will use the first workspace folder as the root path
        const rootPath = workspaceFolders[0].uri.fsPath;

        const outputPath = path.join(rootPath, 'codebase.txt');
        const writeStream = fs.createWriteStream(outputPath);

        const config = vscode.workspace.getConfiguration('codeatlas');
        const includePaths = config.get<string[]>('include', ["**/*"]).map(pattern => path.join(rootPath, pattern));
        const excludeExtensions = config.get<string[]>('exclude', []);

        includePaths.forEach(includePath => {
            if (fs.existsSync(includePath)) {
                traverseDirectory(includePath, '', writeStream, excludeExtensions);
            }
        });

        writeStream.end();
        vscode.window.showInformationMessage('Codebase exported successfully.');
    });

    let disposableMarkdown = vscode.commands.registerCommand('codeatlas.exportCodebaseToMarkdown', () => {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) {
            vscode.window.showErrorMessage('No workspace opened.');
            return;
        }

        const rootPath = workspaceFolders[0].uri.fsPath;

        const outputPath = path.join(rootPath, 'codebase.md');
        const writeStream = fs.createWriteStream(outputPath);

        const config = vscode.workspace.getConfiguration('codeatlas');
        const includePaths = config.get<string[]>('include', ["**/*"]).map(pattern => path.join(rootPath, pattern));
        const excludeExtensions = config.get<string[]>('exclude', []);

        includePaths.forEach(includePath => {
            if (fs.existsSync(includePath)) {
                traverseDirectoryMarkdown(includePath, '', writeStream, excludeExtensions);
            }
        });

        writeStream.end();
        vscode.window.showInformationMessage('Codebase exported to Markdown successfully.');
    });

    context.subscriptions.push(disposable, disposableMarkdown);
}



function traverseDirectory(dir: string, prefix: string, writeStream: fs.WriteStream, excludeExtensions: string[]) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const newPrefix = path.join(prefix, entry.name);

        if (entry.isDirectory()) {
            writeStream.write(`\n${newPrefix}/\n`);
            traverseDirectory(fullPath, newPrefix, writeStream, excludeExtensions);
        } else {
            if (excludeExtensions.some(ext => fullPath.endsWith(ext))) {
                continue;
            }

            writeStream.write(`\n${newPrefix}\n`);
            let content = fs.readFileSync(fullPath, 'utf-8');
            content = content.replace(/[\r|\n|\r\n]+/g, '\n').replace(/[\u0085\u2028\u2029]/g, '');
            writeStream.write(`${content}\n`);
        }
    }
}

function traverseDirectoryMarkdown(dir: string, prefix: string, writeStream: fs.WriteStream, excludeExtensions: string[]) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const newPrefix = path.join(prefix, entry.name);

        if (entry.isDirectory()) {
            writeStream.write(`\n# ${newPrefix}/\n`);
            traverseDirectoryMarkdown(fullPath, newPrefix, writeStream, excludeExtensions);
        } else {
            if (excludeExtensions.some(ext => fullPath.endsWith(ext))) {
                continue;
            }

            writeStream.write(`\n## ${newPrefix}\n`);
            let content = fs.readFileSync(fullPath, 'utf-8');
            content = content.replace(/[\r|\n|\r\n]+/g, '\n').replace(/[\u0085\u2028\u2029]/g, '');
            writeStream.write(`\n\`\`\`\n${content}\n\`\`\`\n`);
        }
    }
}


export function deactivate() {}
