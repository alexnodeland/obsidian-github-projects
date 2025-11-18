// Mock Obsidian module for testing

export class Events {
    private handlers: Map<string, Function[]> = new Map();

    on(event: string, handler: Function) {
        if (!this.handlers.has(event)) {
            this.handlers.set(event, []);
        }
        this.handlers.get(event)!.push(handler);
    }

    off(event: string, handler: Function) {
        const handlers = this.handlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    trigger(event: string, ...args: any[]) {
        const handlers = this.handlers.get(event);
        if (handlers) {
            handlers.forEach(handler => handler(...args));
        }
    }
}

export class Plugin {
    app: any;
    manifest: any;

    async loadData() { return {}; }
    async saveData(data: any) {}
    addCommand(command: any) {}
    addRibbonIcon(icon: string, title: string, callback: () => void) {}
    addSettingTab(tab: any) {}
    registerView(type: string, creator: any) {}
}

export class Notice {
    constructor(message: string, timeout?: number) {}
}

export class ItemView {
    containerEl: any = {
        children: [null, document.createElement('div')]
    };
    app: any;
    leaf: any;

    constructor(leaf: any) {
        this.leaf = leaf;
    }

    getViewType() { return ''; }
    getDisplayText() { return ''; }
    getIcon() { return ''; }
    async onOpen() {}
    async onClose() {}
}

export class Modal {
    contentEl: any = document.createElement('div');
    titleEl: any = document.createElement('div');

    constructor(public app: any) {}

    open() {}
    close() {}
    onOpen() {}
    onClose() {}
}

export class Setting {
    constructor(containerEl: any) {}
    setName(name: string) { return this; }
    setDesc(desc: string) { return this; }
    addText(callback: (text: any) => void) {
        callback({
            setPlaceholder: () => ({}),
            setValue: () => ({}),
            onChange: () => ({}),
            inputEl: {}
        });
        return this;
    }
    addButton(callback: (btn: any) => void) {
        callback({
            setButtonText: () => ({}),
            setWarning: () => ({}),
            setDisabled: () => {},
            onClick: () => ({})
        });
        return this;
    }
    addDropdown(callback: (dropdown: any) => void) {
        callback({
            addOption: () => ({}),
            setValue: () => ({}),
            onChange: () => ({})
        });
        return this;
    }
}

export class PluginSettingTab {
    app: any;
    plugin: any;
    containerEl: any = document.createElement('div');

    constructor(app: any, plugin: any) {
        this.app = app;
        this.plugin = plugin;
    }

    display() {}
}

export const requestUrl = jest.fn();

export class WorkspaceLeaf {}
