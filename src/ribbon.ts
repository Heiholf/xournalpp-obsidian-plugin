import {
	compileAllXoppFiles,
	compileXoppFile,
	createAndEmbedFile,
} from "src/backend";
import { FileSystemAdapter, Menu, Notice, Plugin } from "obsidian";
import * as path from "path";

export default function addRibbonIcon(plugin: Plugin) {
	const ribbonIconEl: HTMLElement = plugin.addRibbonIcon(
		"scroll",
		"Xournalpp",
		(evt: MouseEvent) => {
			const menu: Menu = new Menu();

			menu.addItem((item) =>
				item
					.setTitle("New file")
					.setIcon("plus")
					.onClick(() => {
						createAndEmbedFile(plugin);
					})
			);

			menu.addItem((item) =>
				item
					.setTitle("Reload all")
					.setIcon("list-restart")
					.onClick(async () => {
						compileAllXoppFiles(plugin);
					})
			);

			if (plugin.app.workspace.activeEditor) {
				menu.addItem((item) =>
					item
						.setTitle("Reload in current editor")
						.setIcon("rotate-cw")
						.onClick(async () => {
							const current_file = path.basename(
								plugin.app.workspace.activeEditor!.file?.path!
							);
							const folder = path.join(
								plugin.app.workspace.activeEditor!.file?.path!,
								".."
							);
							const fs = plugin.app.vault
								.adapter as FileSystemAdapter;
							var files = await fs.list(folder);
							files.files.map(async (file, index) => {
								const file_name = path.basename(file);
								if (
									file_name.startsWith(current_file) &&
									file_name.endsWith(".xopp")
								) {
									compileXoppFile(file, plugin);
								}
							});

							new Notice("Recompiled");
						})
				);
			}
			menu.showAtMouseEvent(evt);
		}
	);
}
