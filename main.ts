// Import necessary Obsidian modules
import { Plugin, PluginSettingTab, Setting, Notice, App, WorkspaceLeaf, MarkdownView } from "obsidian";

// Define plugin settings
interface TabLimitSettings {
    globalTabLimit: number;
}

const DEFAULT_SETTINGS: TabLimitSettings = {
    globalTabLimit: 5, // Default global limit
};

export default class TabLimitPlugin extends Plugin {
    settings: TabLimitSettings;

    async onload() {
        // Load settings
        await this.loadSettings();

        // Add setting tab for configuration
        this.addSettingTab(new TabLimitSettingTab(this.app, this));

        // Hook into the workspace to intercept tab openings
        this.registerEvent(this.app.workspace.on("layout-change", () => {
            this.enforceTabLimit();
        }));
    }

    enforceTabLimit() {
        const openTabs = this.app.workspace.getLeavesOfType("markdown")


        console.log(openTabs)
        // Empty string to get all leaves

        if (openTabs.length > this.settings.globalTabLimit) {
            // Close the latest opened tab to enforce the limit
            openTabs[openTabs.length - 1].detach();

            // Notify the user
            new Notice("Tab limit reached. Unable to open more tabs.");
        }
    }


    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }
}


class TabLimitSettingTab extends PluginSettingTab {
    plugin: TabLimitPlugin;

    constructor(app: App, plugin: TabLimitPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;

        containerEl.empty();

        containerEl.createEl("h2", { text: "Tab Limit Settings" });

        new Setting(containerEl)
            .setName("Global Maximum Tab Limit")
            .setDesc("Set the maximum number of tabs you can open across all windows.")
            .addSlider(slider => {
                const valueLabel = containerEl.createEl("span", { text: `${this.plugin.settings.globalTabLimit}` });
                valueLabel.style.marginLeft = "10px";

                slider
                    .setLimits(1, 20, 1)
                    .setValue(this.plugin.settings.globalTabLimit)
                    .onChange(async (value) => {
                        valueLabel.setText(`${value}`);
                        this.plugin.settings.globalTabLimit = value;
                        await this.plugin.saveSettings();
                    });

                slider.sliderEl.parentElement?.appendChild(valueLabel);
            });

    }
}
