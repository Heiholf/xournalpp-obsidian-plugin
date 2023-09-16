import { Plugin } from "obsidian";
import SampleSettingTab from "settings";
import addAllCommands from "commands";
import addRibbonIcon from "ribbon";
import addAllFileMenus from "filemenu";

// Remember to rename these classes and interfaces!

interface XournalPluginSettings {}

const DEFAULT_SETTINGS: XournalPluginSettings = {};

export default class XournalPlugin extends Plugin {
	settings: XournalPluginSettings = DEFAULT_SETTINGS;

	async onload() {
		await this.loadSettings();

		addAllFileMenus(this);
		addAllCommands(this);
		addRibbonIcon(this);

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
}
