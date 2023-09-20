import fs from 'fs';
import { Client, Events, GatewayIntentBits } from 'discord.js';

export interface Config {
    global: {
        lookup_all: boolean;
        discord_guild_id?: string;
        discord_bot_token?: string;
        steam_api_key?: string;
    };
    users: {
        [key: string]: any;
    };
}

class ConfigProvider {
    private config: Config = {
        global: {
            lookup_all: false
        },
        users: {}
    };
    private ready = false;

    constructor() {
        try {
            let data = fs.readFileSync('./config.json', 'utf8');
            this.config = JSON.parse(data);
            this.ready = true;
        } catch (err) {
            console.error('[ConfigProvider]', err);
            return;
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
