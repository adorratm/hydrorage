// Node 22+ global localStorage, --localstorage-file yokken uyarı basar.
// Web SSR, debug paketinin tarayıcı sürümünü bu süreçte çalıştırır.
const nodeHasStorageFile = process.execArgv.some((arg) =>
  arg.startsWith('--localstorage-file'),
);
if (!nodeHasStorageFile) {
  const memory = new Map();
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: {
        getItem: (key) => (memory.has(key) ? memory.get(key) : null),
        setItem: (key, value) => {
          memory.set(String(key), String(value));
        },
        removeItem: (key) => {
          memory.delete(key);
        },
        clear: () => {
          memory.clear();
        },
        key: (index) => Array.from(memory.keys())[index] ?? null,
        get length() {
          return memory.size;
        },
      },
    });
  } catch {
    /* özellik kilitliyse dokunma */
  }
}

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];
config.resolver.disableHierarchicalLookup = true;
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/')) {
    const target = path.join(projectRoot, moduleName.slice(2));
    return context.resolveRequest(context, target, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
