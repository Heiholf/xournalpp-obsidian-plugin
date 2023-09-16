import { compileAllXoppFiles, createAndEmbedFile } from "backend";
import XournalPlugin from "main";
import { Editor, MarkdownView, MarkdownFileInfo } from "obsidian";

export default function addAllCommands(plugin: XournalPlugin) {
	command_new_file(plugin);
	command_compile_all(plugin);
}

function command_new_file(plugin: XournalPlugin) {
	plugin.addCommand({
		id: "xournalpp-new-file",
		name: "Xournal++: Create and embed new xournalpp file",
		editorCallback: (
			editor: Editor,
			view: MarkdownView | MarkdownFileInfo
		) => {
			createAndEmbedFile(plugin);
			console.log(editor.getSelection());
			editor.replaceSelection("Sample Editor Command");
		},
	});
}

function command_compile_all(plugin: XournalPlugin) {
	plugin.addCommand({
		id: "xournalpp-compile-all",
		name: "Xournal++: Compile all .xopp files in vault.",
		editorCallback: async (
			editor: Editor,
			view: MarkdownView | MarkdownFileInfo
		) => {
			await compileAllXoppFiles(plugin);
		},
	});
}
