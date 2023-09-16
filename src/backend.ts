import {
	Plugin,
	FileSystemAdapter,
	TAbstractFile,
	TFile,
	Notice,
	Editor,
} from "obsidian";

import { exec } from "child_process";

import * as path from "path";

export async function compileXoppFile(
	file: TAbstractFile | string,
	plugin: Plugin
) {
	const file_path = file instanceof TAbstractFile ? file.path : file;
	const fs: FileSystemAdapter = plugin.app.vault.adapter as FileSystemAdapter;
	const full_path = fs.getFullPath(file_path).replace(".xopp.pdf", ".xopp");
	var cmd = `start xournalpp "${full_path}" -p "${full_path}.pdf"`;
	await exec(cmd, (err, stdout, stderr) => {
		console.log(err, stdout, stderr);
	});
	new Notice(`Compiled ${path.basename(full_path)}!`);
}

export async function compileAllXoppFiles(plugin: Plugin) {
	var files: TFile[] = await plugin.app.vault.getFiles();
	await files.map(async (file: TFile) => {
		const file_name = path.basename(file.path);
		if (file_name.endsWith(".xopp")) {
			await compileXoppFile(file, plugin);
		}
	});
	new Notice("Recompiled all!");
}

export async function openXoppFile(
	file: TAbstractFile | string,
	plugin: Plugin
) {
	const file_path = file instanceof TAbstractFile ? file.path : file;
	const fs: FileSystemAdapter = plugin.app.vault.adapter as FileSystemAdapter;
	const full_path = fs.getFullPath(file_path).replace(".xopp.pdf", ".xopp");
	var cmd = `start xournalpp "${full_path}"`;
	await exec(cmd, (err, stdout, stderr) => {
		console.log(err, stdout, stderr);
	});
}

export function getPluginDir(asset: string, plugin: Plugin) {
	return `${plugin.app.vault.configDir}/plugins/${plugin.manifest.id}/${asset}`;
}

export async function createAndEmbedFile(plugin: Plugin): Promise<void> {
	let file_path: string | null = await createNewFile(plugin);
	if (file_path != null) {
		const editor: Editor | undefined =
			plugin.app.workspace.activeEditor?.editor;
		editor?.replaceRange(
			`![[${file_path.replace("\\", "/")}]]\n![[${file_path.replace(
				"\\",
				"/"
			)}.pdf]]`,
			editor?.getCursor()
		);
	}
}

export async function createNewFile(plugin: Plugin): Promise<string | null> {
	if (!plugin.app.workspace.activeEditor) {
		new Notice("Missing cursor!");
		return null;
	}

	const fs: FileSystemAdapter = plugin.app.vault.adapter as FileSystemAdapter;

	const default_path: string = getPluginDir(`default.xopp`, plugin);
	const local_path: string = path.join(
		plugin.app.workspace.activeEditor?.file?.path! + ".1.xopp"
	);

	try {
		await fs.copy(default_path, local_path);
	} catch {
		new Notice("File already exists");
	}

	compileXoppFile(local_path, plugin);

	return local_path;
}
