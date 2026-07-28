import { ActivityType, Client, Events, GatewayIntentBits, type Presence, type User } from 'discord.js';

import ConfigProvider from './ConfigProvider';

const STATUS_REFRESH_INTERVAL = 5 * 60 * 1000;

class DiscordProvider {
    private client: Client;
    private guildId: string = '';
    private ready: boolean = false;

    constructor() {
        this.client = new Client({
            intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences]
        });

        this.client.once(Events.ClientReady, (client) => {
            console.log('[DiscordProvider]', `Ready! Logged in as ${client.user.tag}`);
            this.ready = true;

            const setStatus = () => {
                client.user.setPresence({
                    activities: [
                        {
                            name: 'custom',
                            type: ActivityType.Custom,
                            state: '🥺 Staring at a cutie'
                        }
                    ],
                    status: 'online',
                    afk: false
                });
            };
            setStatus();

            setInterval(setStatus, STATUS_REFRESH_INTERVAL);
        });

        const token = ConfigProvider.getConfig().global.discord_bot_token;
        const guildId = ConfigProvider.getConfig().global.discord_guild_id;

        if (!token || !guildId) {
            console.error('[DiscordProvider]', 'Missing token or guild_id in config.json');
            return;
        }

        this.guildId = guildId;

        this.client.login(token);
    }

    public async getUser(id: string): Promise<User> {
        return this.client.users.cache.get(id) ?? (await this.client.users.fetch(id));
    }

    public async getPresence(id: string): Promise<Presence | null> {
        const guild = this.client.guilds.cache.get(this.guildId) ?? (await this.client.guilds.fetch(this.guildId));
        const member = guild.members.cache.get(id) ?? (await guild.members.fetch(id));
        return member.presence;
    }

    public get isReady(): boolean {
        return this.ready;
    }
}

export default new DiscordProvider();
