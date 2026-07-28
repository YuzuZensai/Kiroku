import { afterEach, describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { ConfigProvider } from '../ConfigProvider';

let tmpFile: string | undefined;

function writeTempConfig(contents: string): string {
    tmpFile = path.join(os.tmpdir(), `kiroku-config-test-${Date.now()}-${Math.random()}.json`);
    fs.writeFileSync(tmpFile, contents);
    return tmpFile;
}

describe('ConfigProvider', () => {
    afterEach(() => {
        if (tmpFile) {
            fs.rmSync(tmpFile, { force: true });
            tmpFile = undefined;
        }
    });

    test('loads and parses a valid config file', () => {
        const configPath = writeTempConfig(
            JSON.stringify({
                global: { lookup_all: true, steam_api_key: 'abc' },
                users: { alice: { discord: '123' } }
            })
        );

        const provider = new ConfigProvider(configPath);

        expect(provider.isReady()).toBe(true);
        expect(provider.getConfig().global.lookup_all).toBe(true);
        expect(provider.getConfig().users.alice?.discord).toBe('123');
    });

    test('is not ready and falls back to defaults when the file is missing', () => {
        const provider = new ConfigProvider('./does-not-exist.json');

        expect(provider.isReady()).toBe(false);
        expect(provider.getConfig()).toEqual({ global: { lookup_all: false }, users: {} });
    });

    test('is not ready when the file contains invalid JSON', () => {
        const configPath = writeTempConfig('{ not valid json');

        const provider = new ConfigProvider(configPath);

        expect(provider.isReady()).toBe(false);
    });
});
