import SteamAPI from 'steamapi';

import ConfigProvider from './ConfigProvider';

class SteamProvider {
    private client: SteamAPI;
    private ready: boolean = false;

    constructor() {
        this.client = new SteamAPI('dummy');
        const token = ConfigProvider.getConfig().global.steam_api_key;

        if (!token) {
            console.error('[SteamProvider]', 'Missing steam_api_key in config');
            return;
        }

        this.client = new SteamAPI(token);
        this.ready = true;
    }

    public async getProfile(id: string) {
        let profile = await this.client.getUserSummary(id);
        return profile;
    }

    public get isReady(): boolean {
        return this.ready;
    }
}

export default new SteamProvider();
