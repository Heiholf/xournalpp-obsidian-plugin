import XournalPlugin from "main";
import { App, PluginSettingTab } from "obsidian";

export default class SampleSettingTab extends PluginSettingTab {
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
