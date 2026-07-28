import fs from 'node:fs';

import type { Config } from '../types';

export class ConfigProvider {
    private config: Config = {
        global: {
            lookup_all: false
        },
        users: {}
    };
    private ready = false;

    constructor(path = './config.json') {
        try {
            const data = fs.readFileSync(path, 'utf8');
            this.config = JSON.parse(data);
            this.ready = true;
        } catch (err) {
            console.error('[ConfigProvider]', err);
        }
    }

    public getConfig(): Config {
        return this.config;
    }

    public isReady(): boolean {
        return this.ready;
    }
}

export default new ConfigProvider();
