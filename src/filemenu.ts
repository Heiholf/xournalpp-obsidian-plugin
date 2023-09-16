import { compileXoppFile, openXoppFile } from "src/backend";
import {
	FileSystemAdapter,
	ListedFiles,
	MenuItem,
	Notice,
	Plugin,
} from "obsidian";
import * as path from "path";

export default function addAllFileMenus(plugin: Plugin) {
	addPdfFileMenu(plugin);
}

function addPdfFileMenu(plugin: Plugin) {
	plugin.registerEvent(
		app.workspace.on("file-menu", async (menu, file) => {
			if (file.path.endsWith(".pdf")) {
				const fs = plugin.app.vault.adapter as FileSystemAdapter;

				menu.addItem((item: MenuItem) =>
					item
						.setTitle("Recompile")
						.setIcon("scroll")
						.onClick(async () => {
							const files: ListedFiles = await fs.list(
								path.dirname(file.path)
							);
							if (
								files.files.some(
									(x, _) =>
										path.relative(
											file.path.replace(
												".xopp.pdf",
												".xopp"
											),
											x
										) === ""
								)
							) {
								compileXoppFile(file, plugin);
							} else {
								new Notice("No .xopp file found");
							}
						})
				);

				menu.addItem((item: MenuItem) =>
					item
						.setTitle("Open .xopp")
						.setIcon("scroll")
						.onClick(async () => {
							const files: ListedFiles = await fs.list(
								path.dirname(file.path)
							);
							if (
								files.files.some(
									(x, _) =>
										path.relative(
											file.path.replace(
												".xopp.pdf",
												".xopp"
											),
											x
										) === ""
								)
							) {
								openXoppFile(file, plugin);
							} else {
								new Notice("No .xopp file found");
							}
						})
				);
			}
		})
	);
}
