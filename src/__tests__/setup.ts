// Jest setup file for mocking Obsidian and browser APIs

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {};

    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

global.localStorage = localStorageMock as any;

// Mock Obsidian Events class
class MockEvents {
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

// Mock Obsidian module
jest.mock('obsidian', () => ({
    Events: MockEvents,
    Plugin: class MockPlugin {},
    Notice: jest.fn(),
    ItemView: class MockItemView {},
    Modal: class MockModal {
        constructor(public app: any) {}
        open() {}
        close() {}
    },
    Setting: jest.fn(),
    PluginSettingTab: class MockPluginSettingTab {},
    requestUrl: jest.fn(),
    WorkspaceLeaf: class MockWorkspaceLeaf {}
}));
