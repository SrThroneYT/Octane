import { FC, useEffect, useState } from 'react';
import { GetConfigurationValue } from '../../api';
import { PluginEntry, PluginScript, resolvePluginScripts } from '../../api/utils/resolvePluginScripts';
import { subscribePlugins } from './OctanePluginApi';

import './OctanePluginApi';

export const ExternalPluginLoader: FC<{}> = () => {
    const [, forceUpdate] = useState(0);
    const [pluginScripts, setPluginScripts] = useState<PluginScript[]>([]);

    useEffect(() => {
        return subscribePlugins(() => forceUpdate((n) => n + 1));
    }, []);

    useEffect(() => {
        let entries: PluginEntry[] = [];
        let allowedHosts: string[] = [];

        try {
            entries = GetConfigurationValue<PluginEntry[]>('external.plugins', []) || [];
            allowedHosts = GetConfigurationValue<string[]>('external.plugins.allowed.hosts', []) || [];
        } catch (e) {
            console.warn('[OctanePlugins] Could not read external.plugins config:', e);
            return;
        }

        if (!Array.isArray(entries) || !entries.length) {
            console.log('[OctanePlugins] No external plugins configured');
            return;
        }

        const scripts = resolvePluginScripts(
            entries,
            Array.isArray(allowedHosts) ? allowedHosts : [],
            window.location.origin,
            (message) => console.warn(`[OctanePlugins] ${message}`)
        );

        console.log(
            '[OctanePlugins] Loading external plugins:',
            scripts.map((script) => script.src)
        );
        setPluginScripts(scripts);
    }, []);

    if (!pluginScripts.length) return null;

    return (
        <>
            {pluginScripts.map((script) => (
                <script
                    key={script.src}
                    async
                    src={script.src}
                    integrity={script.integrity}
                    crossOrigin={script.integrity ? 'anonymous' : undefined}
                    onLoad={() => console.log(`[OctanePlugins] Loaded: ${script.src}`)}
                    onError={() => console.warn(`[OctanePlugins] Failed to load: ${script.src}`)}
                />
            ))}
        </>
    );
};
