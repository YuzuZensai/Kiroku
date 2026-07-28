import SteamAPI, { type UserSummary } from 'steamapi';

import ConfigProvider from './ConfigProvider';

class SteamProvider {
    private client: SteamAPI | undefined;
    private ready: boolean = false;

    constructor() {
        const apiKey = ConfigProvider.getConfig().global.steam_api_key;

        if (!apiKey) {
            console.error('[SteamProvider]', 'Missing steam_api_key in config');
            return;
        }

        this.client = new SteamAPI(apiKey);
        this.ready = true;
    }

    public async getProfile(id: string): Promise<UserSummary> {
        if (!this.client) throw new Error('SteamProvider is not ready');
        return this.client.getUserSummary(id);
    }

    public get isReady(): boolean {
        return this.ready;
    }
}

export default new SteamProvider();
