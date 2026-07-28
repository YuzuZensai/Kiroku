import ConfigProviderSingleton from '../providers/ConfigProvider';
import DiscordProviderSingleton from '../providers/DiscordProvider';
import SteamProviderSingleton from '../providers/SteamProvider';
import type { ConfigSource, DiscordSource, PresenceData, SteamSource } from '../types';

const POLL_INTERVAL = 500;
const STEAM_CACHE_TTL = 60 * 1000;

export class PresenceAggregator {
    private data: PresenceData = {};
    private timer: ReturnType<typeof setInterval> | undefined;

    constructor(
        private readonly config: ConfigSource = ConfigProviderSingleton,
        private readonly discord: DiscordSource = DiscordProviderSingleton,
        private readonly steam: SteamSource = SteamProviderSingleton
    ) {}

    public start(): void {
        if (this.timer) return;
        this.timer = setInterval(() => this.refresh(), POLL_INTERVAL);
    }

    public stop(): void {
        clearInterval(this.timer);
        this.timer = undefined;
    }

    public getAll(): PresenceData {
        return this.data;
    }

    public get(user: string): PresenceData[string] | undefined {
        return this.data[user];
    }

    public async refresh(): Promise<void> {
        const newData: PresenceData = {};

        for (const [rawKey, userConfig] of Object.entries(this.config.getConfig().users)) {
            const key = rawKey.toLowerCase();
            newData[key] = {};

            if (userConfig.discord && this.discord.isReady) {
                const [user, presence] = await Promise.all([
                    this.discord.getUser(userConfig.discord),
                    this.discord.getPresence(userConfig.discord)
                ]);
                newData[key].discord = { user, presence, updatedAt: new Date() };
            }

            if (userConfig.steam && this.steam.isReady) {
                const cached = this.data[key]?.steam;
                if (cached && cached.updatedAt.getTime() > Date.now() - STEAM_CACHE_TTL) {
                    newData[key].steam = cached;
                } else {
                    const user = await this.steam.getProfile(userConfig.steam);
                    newData[key].steam = { user, updatedAt: new Date() };
                }
            }
        }

        this.data = newData;
    }
}

export default new PresenceAggregator();
