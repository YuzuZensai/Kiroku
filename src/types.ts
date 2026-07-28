import type { Presence, User } from 'discord.js';
import type { UserSummary } from 'steamapi';

export interface UserConfig {
    discord?: string;
    steam?: string;
}

export interface Config {
    global: {
        lookup_all: boolean;
        discord_guild_id?: string;
        discord_bot_token?: string;
        steam_api_key?: string;
    };
    users: {
        [key: string]: UserConfig;
    };
}

export interface DiscordEntry {
    user: User;
    presence: Presence | null;
    updatedAt: Date;
}

export interface SteamEntry {
    user: UserSummary;
    updatedAt: Date;
}

export interface UserData {
    discord?: DiscordEntry;
    steam?: SteamEntry;
}

export type PresenceData = {
    [key: string]: UserData;
};

export interface ConfigSource {
    getConfig(): Config;
}

export interface DiscordSource {
    readonly isReady: boolean;
    getUser(id: string): Promise<User>;
    getPresence(id: string): Promise<Presence | null>;
}

export interface SteamSource {
    readonly isReady: boolean;
    getProfile(id: string): Promise<UserSummary>;
}

export interface PresenceStore {
    getAll(): PresenceData;
    get(user: string): PresenceData[string] | undefined;
}
