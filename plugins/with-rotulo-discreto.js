// O expo-alternate-app-icons troca o ícone criando um <activity-alias> por ícone,
// mas o alias herda o nome do app ("Aquenda"). Aqui o alias do ícone discreto
// ganha o rótulo "Clima", para nome e ícone mudarem juntos na tela inicial.
// Precisa vir ANTES do expo-alternate-app-icons na lista de plugins: os mods de
// manifest rodam do último plugin para o primeiro, então este roda depois do alias existir.
const { withAndroidManifest, AndroidConfig } = require('expo/config-plugins');

module.exports = function withRotuloDiscreto(config, { alias = 'Clima', rotulo = 'Clima' } = {}) {
  return withAndroidManifest(config, (cfg) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(cfg.modResults);
    for (const a of app['activity-alias'] ?? []) {
      if (a.$['android:name'] === `.MainActivity${alias}`) a.$['android:label'] = rotulo;
    }
    return cfg;
  });
};
