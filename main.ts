import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
	FileSystemAdapter,
	Menu,
	TFile,
	MenuItem,
	ListedFiles,
} from "obsidian";

import { exec } from "child_process";

import * as path from "path";

// Remember to rename these classes and interfaces!

interface XournalPluginSettings {}

const DEFAULT_SETTINGS: XournalPluginSettings = {};

export default class XournalPlugin extends Plugin {
	settings: XournalPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerEvent(
			app.workspace.on("file-menu", async (menu, file) => {
				if (file.path.endsWith(".pdf")) {
					const fs = this.app.vault.adapter as FileSystemAdapter;

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
										(x, index) =>
											path.relative(
												file.path.replace(
													".xopp.pdf",
													".xopp"
												),
												x
											) === ""
									)
								) {
									const full_path = fs
										.getFullPath(file.path)
										.replace(".xopp.pdf", ".xopp");
									var cmd = `start xournalpp "${full_path}" -p "${full_path}.pdf"`;
									await exec(cmd, (err, stdout, stderr) => {
										console.log(err, stdout, stderr);
									});
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
										(x, index) =>
											path.relative(
												file.path.replace(
													".xopp.pdf",
													".xopp"
												),
												x
											) === ""
									)
								) {
									const full_path = fs
										.getFullPath(file.path)
										.replace(".xopp.pdf", ".xopp");
									var cmd = `start xournalpp "${full_path}"`;
									await exec(cmd, (err, stdout, stderr) => {
										console.log(err, stdout, stderr);
									});
								} else {
									new Notice("No .xopp file found");
								}
							})
					);

					/*menu.addItem((item: MenuItem) =>
							item
								.setTitle("Create")
								.setIcon("scroll")
								.onClick(() => {})
						);*/
				}
			})
		);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"scroll",
			"Xournalpp",
			(evt: MouseEvent) => {
				const menu = new Menu();

				menu.addItem((item) =>
					item
						.setTitle("New file")
						.setIcon("plus")
						.onClick(() => {
							this.create_and_embed_file();
						})
				);

				menu.addItem((item) =>
					item
						.setTitle("Reload all")
						.setIcon("list-restart")
						.onClick(async () => {
							const fs = this.app.vault
								.adapter as FileSystemAdapter;
							var files = await this.app.vault.getFiles();
							files.map(async (file) => {
								const file_name = path.basename(file.path);
								if (file_name.endsWith(".xopp")) {
									const full_path = fs.getFullPath(file.path);
									var cmd = `start xournalpp "${full_path}" -p "${full_path}.pdf"`;
									await exec(cmd, (err, stdout, stderr) => {
										console.log(err, stdout, stderr);
									});
								}
							});
							new Notice("Recompiled all!");
						})
				);

				if (this.app.workspace.activeEditor) {
					menu.addItem((item) =>
						item
							.setTitle("Reload in current editor")
							.setIcon("rotate-cw")
							.onClick(async () => {
								const current_file = path.basename(
									this.app.workspace.activeEditor!.file?.path!
								);
								const folder = path.join(
									this.app.workspace.activeEditor!.file
										?.path!,
									".."
								);
								const fs = this.app.vault
									.adapter as FileSystemAdapter;
								var files = await fs.list(folder);
								files.files.map(async (file, index) => {
									const file_name = path.basename(file);
									if (
										file_name.startsWith(current_file) &&
										file_name.endsWith(".xopp")
									) {
										const full_path = fs.getFullPath(file);
										var cmd = `start xournalpp "${full_path}" -p "${full_path}.pdf"`;
										await exec(
											cmd,
											(err, stdout, stderr) => {
												console.log(
													err,
													stdout,
													stderr
												);
											}
										);
									}
								});

								new Notice("Recompiled");
							})
					);
				}

				menu.showAtMouseEvent(evt);
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		//const statusBarItemEl = this.addStatusBarItem();
		//statusBarItemEl.setText("Status Bar Text");

		this.addCommand({
			id: "xournalpp-new-file",
			name: "Create and add new xournalpp file",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.create_and_embed_file();
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			//console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	create_and_embed_file(): void {
		this.create_new_file();
	}

	async create_new_file(): Promise<void> {
		if (!this.app.workspace.activeEditor) {
			new Notice("Missing cursor!");
			return;
		}

		const fs = this.app.vault.adapter as FileSystemAdapter;
		const editor = this.app.workspace.activeEditor?.editor;

		const default_path = this.getPluginDir(`default.xopp`);
		const local_path = path.join(
			//fs.getBasePath(),
			this.app.workspace.activeEditor?.file?.path! + ".1.xopp"
		);

		console.log(local_path);
		try {
			await fs.copy(default_path, local_path);
		} catch {
			new Notice("File already exists");
		}

		const full_path = fs.getFullPath(local_path);
		var cmd = `start xournalpp "${full_path}" -p "${full_path}.pdf"`;
		await exec(cmd, (err, stdout, stderr) => {
			console.log(err, stdout, stderr);
			editor?.replaceRange(
				`![[${local_path.replace("\\", "/")}]]\n![[${local_path.replace(
					"\\",
					"/"
				)}.pdf]]`,
				editor?.getCursor()
			);
		});
		console.log(cmd);
	}

	getPluginDir(asset: string) {
		return `${this.app.vault.configDir}/plugins/${this.manifest.id}/${asset}`;
	}

	recompile_files(files: string[]) {}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: XournalPlugin;

	constructor(app: App, plugin: XournalPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();
	}
}
