// Mapa dos lugares com OpenStreetMap (Leaflet numa WebView). Não precisa de chave de API.
// Endereço sigiloso (casa de acolhimento) nunca entra no mapa.
import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { WebView } from 'react-native-webview';
import type { ServicoResumo } from '@/lib/api/tipos';
import { CENTRO_SP } from '@/lib/localizacao';
import { raio } from '@/tema/tokens';
import { useSecao } from '@/tema/useTema';
import { Texto } from './base';

export type PontoMapa = { id: number; nome: string; lat: number; lon: number; aberto: boolean | null };

export function pontosDoMapa(servicos: ServicoResumo[]): PontoMapa[] {
  return servicos
    .filter((s) => !s.endereco.sigiloso && s.endereco.latitude !== null && s.endereco.longitude !== null)
    .map((s) => ({ id: s.id, nome: s.nome, lat: s.endereco.latitude!, lon: s.endereco.longitude!, aberto: s.abertoAgora }));
}

function html(pontos: PontoMapa[], cor: string): string {
  const centro = pontos.length ? pontos : [{ lat: CENTRO_SP.lat, lon: CENTRO_SP.lon }];
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#m{height:100%;margin:0}.p{background:${cor};border:3px solid #fff;border-radius:50%;box-shadow:0 1px 4px rgba(0,0,0,.3)}
.leaflet-tooltip{font:600 14px sans-serif;border-radius:10px}</style></head><body><div id="m"></div><script>
var pts=${JSON.stringify(pontos)};
var m=L.map('m',{zoomControl:false,attributionControl:true});
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap'}).addTo(m);
var g=[];pts.forEach(function(p){var i=L.divIcon({className:'p',iconSize:[22,22]});
var k=L.marker([p.lat,p.lon],{icon:i,title:p.nome}).addTo(m).bindTooltip(p.nome,{direction:'top',offset:[0,-10]});
k.on('click',function(){window.ReactNativeWebView.postMessage(String(p.id))});g.push([p.lat,p.lon]);});
var c=${JSON.stringify(centro.map((p) => [p.lat, p.lon]))};
if(c.length>1){m.fitBounds(c,{padding:[40,40]})}else{m.setView(c[0],15)}
</script></body></html>`;
}

export function Mapa({ servicos, altura = 360 }: { servicos: ServicoResumo[]; altura?: number }) {
  const s = useSecao();
  const pontos = useMemo(() => pontosDoMapa(servicos), [servicos]);
  const pagina = useMemo(() => html(pontos, s.acao), [pontos, s.acao]);
  return (
    <View style={{ gap: 6 }}>
      <View
        style={{ height: altura, borderRadius: raio.bloco, overflow: 'hidden' }}
        accessible
        accessibilityLabel={`Mapa com ${pontos.length} lugares. A lista abaixo tem os mesmos lugares.`}
      >
        <WebView
          originWhitelist={['*']}
          source={{ html: pagina }}
          onMessage={(e) => router.push({ pathname: '/servico/[id]', params: { id: e.nativeEvent.data } })}
          javaScriptEnabled
          setSupportMultipleWindows={false}
          style={{ flex: 1 }}
        />
      </View>
      <Texto v="apoio" suave>
        Toque num ponto para abrir. Mapa © OpenStreetMap.
      </Texto>
    </View>
  );
}
