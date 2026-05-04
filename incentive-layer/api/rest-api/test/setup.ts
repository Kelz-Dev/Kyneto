// Test setup: silence console output during tests unless DEBUG is set
if (!process.env.DEBUG) {
    global.console = {
        ...console,
        log: jest.fn(),
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
    };
}
