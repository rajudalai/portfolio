// Data Cache Service - caches project data locally with configurable duration

const CACHE_KEY = 'portfolio_projects_cache';
const SETTINGS_KEY = 'portfolio_cache_settings';

interface CacheData {
    projects: any[];
    featuredProjects: any[];
    typeOrders: any[];
    cachedAt: number;
}

interface CacheSettings {
    enabled: boolean;
    durationHours: number;
    fetchedAt: number;
}

// Get cached data
export const getCachedData = (): CacheData | null => {
    try {
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            return JSON.parse(cached);
        }
        return null;
    } catch {
        return null;
    }
};

// Set cached data
export const setCachedData = (data: Omit<CacheData, 'cachedAt'>): void => {
    try {
        const cacheData: CacheData = {
            ...data,
            cachedAt: Date.now()
        };
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (error) {
        console.error('Error caching data:', error);
    }
};

// Get cached settings (avoids Firebase call if fresh)
export const getCachedSettings = (): CacheSettings | null => {
    try {
        const cached = localStorage.getItem(SETTINGS_KEY);
        if (cached) {
            const settings = JSON.parse(cached) as CacheSettings;
            // Settings are valid for 5 minutes
            const settingsAgeMs = Date.now() - settings.fetchedAt;
            if (settingsAgeMs < 5 * 60 * 1000) {
                return settings;
            }
        }
        return null;
    } catch {
        return null;
    }
};

// Cache settings
export const setCachedSettings = (enabled: boolean, durationHours: number): void => {
    try {
        const settings: CacheSettings = {
            enabled,
            durationHours,
            fetchedAt: Date.now()
        };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Error caching settings:', error);
    }
};

// Clear cache (both data and settings)
export const clearDataCache = (): void => {
    try {
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(SETTINGS_KEY); // Also clear settings to force fresh fetch
    } catch (error) {
        console.error('Error clearing cache:', error);
    }
};

// Check if cache is valid (not older than specified hours)
// If cache is expired, clear it and return false
export const isCacheValid = (cacheDurationHours: number): boolean => {
    const cached = getCachedData();
    if (!cached) return false;

    const cacheAgeMs = Date.now() - cached.cachedAt;
    const maxAgeMs = cacheDurationHours * 60 * 60 * 1000;

    if (cacheAgeMs >= maxAgeMs) {
        // Cache is expired - clear it automatically
        console.log('Cache expired, clearing automatically...');
        clearDataCache();
        return false;
    }

    return true;
};

// Get cache age in hours
export const getCacheAgeHours = (): number | null => {
    const cached = getCachedData();
    if (!cached) return null;

    const cacheAgeMs = Date.now() - cached.cachedAt;
    return Math.round(cacheAgeMs / (60 * 60 * 1000) * 10) / 10;
};
