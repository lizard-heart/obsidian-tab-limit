// Import necessary Obsidian modules
import { Plugin, PluginSettingTab, Setting, App, WorkspaceLeaf } from "obsidian";

// Define plugin settings
interface TabLimitSettings {
    globalTabLimit: number;
}

const DEFAULT_SETTINGS: TabLimitSettings = {
    globalTabLimit: 5, // Default global limit
};

export default class TabLimitPlugin extends Plugin {
    settings: TabLimitSettings;
    private tabAccessOrder = new Map<WorkspaceLeaf, number>();
    private accessCounter = 0;

    async onload() {
        // Load settings
        await this.loadSettings();

        // Add setting tab for configuration
        this.addSettingTab(new TabLimitSettingTab(this.app, this));

        this.app.workspace.onLayoutReady(() => {
            this.syncTrackedTabs();
            this.markLeafAsUsed(this.app.workspace.activeLeaf);
            this.enforceTabLimit();
        });

        this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
            this.markLeafAsUsed(leaf);
            this.enforceTabLimit();
        }));

        // Hook into the workspace to enforce the tab limit after layout changes
        this.registerEvent(this.app.workspace.on("layout-change", () => {
            this.syncTrackedTabs();
            this.enforceTabLimit();
        }));
    }

    enforceTabLimit() {
        const openTabs = this.syncTrackedTabs();
        const tabLimit = Math.max(1, this.settings.globalTabLimit);

        while (openTabs.length > tabLimit) {
            const oldestTab = this.getOldestTab(openTabs);

            if (!oldestTab) {
                break;
            }

            oldestTab.detach();
            this.tabAccessOrder.delete(oldestTab);

            const oldestTabIndex = openTabs.indexOf(oldestTab);
            if (oldestTabIndex !== -1) {
                openTabs.splice(oldestTabIndex, 1);
            }
        }
    }

    private syncTrackedTabs(): WorkspaceLeaf[] {
        const openTabs = this.app.workspace.getLeavesOfType("markdown");
        const openTabSet = new Set(openTabs);

        for (const trackedTab of this.tabAccessOrder.keys()) {
            if (!openTabSet.has(trackedTab)) {
                this.tabAccessOrder.delete(trackedTab);
            }
        }

        for (const tab of openTabs) {
            if (!this.tabAccessOrder.has(tab)) {
                this.markLeafAsUsed(tab);
            }
        }

        return openTabs;
    }

    private markLeafAsUsed(leaf: WorkspaceLeaf | null) {
        if (!leaf || leaf.view.getViewType() !== "markdown") {
            return;
        }

        this.tabAccessOrder.set(leaf, ++this.accessCounter);
    }

    private getOldestTab(openTabs: WorkspaceLeaf[]): WorkspaceLeaf | null {
        let oldestTab: WorkspaceLeaf | null = null;
        let oldestAccessOrder = Number.POSITIVE_INFINITY;

        for (const tab of openTabs) {
            const accessOrder = this.tabAccessOrder.get(tab) ?? 0;

            if (accessOrder < oldestAccessOrder) {
                oldestAccessOrder = accessOrder;
                oldestTab = tab;
            }
        }

        return oldestTab;
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

        new Setting(containerEl)
            .setName("Global maximum tab limit")
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
