import React from 'react';
import { Audio, Series, staticFile } from 'remotion';
import { Background } from './components/Background';
import { Scene01Hook } from './scenes/Scene01Hook';
import { Scene02Logo } from './scenes/Scene02Logo';
import { Scene03Dashboard } from './scenes/Scene03Dashboard';
import { Scene04CreateLink } from './scenes/Scene04CreateLink';
import { Scene05GeoRouting } from './scenes/Scene05GeoRouting';
import { Scene06QRCode } from './scenes/Scene06QRCode';
import { Scene07Security } from './scenes/Scene07Security';
import { Scene08Stream } from './scenes/Scene08Stream';
import { Scene09Revenue } from './scenes/Scene09Revenue';
import { Scene10WorldMap } from './scenes/Scene10WorldMap';
import { Scene11Outro } from './scenes/Scene11Outro';

export const TOTAL_VIDEO_FRAMES = 1380; // 46s à 30 FPS

export const LShorterPromo: React.FC = () => {
  return (
    <Background>
      {/* Background Music from Reference Video */}
      <Audio src={staticFile('audio/music.mp3')} volume={0.85} />

      <Series>
        {/* Scène 1 : Le Problème (0s - 4.5s = 135 frames) */}
        <Series.Sequence durationInFrames={135}>
          <Scene01Hook />
        </Series.Sequence>

        {/* Scène 2 : Logo Reveal (4.5s - 7.5s = 90 frames) */}
        <Series.Sequence durationInFrames={90}>
          <Scene02Logo />
        </Series.Sequence>

        {/* Scène 3 : Dashboard Réel (7.5s - 11.5s = 120 frames) */}
        <Series.Sequence durationInFrames={120}>
          <Scene03Dashboard />
        </Series.Sequence>

        {/* Scène 4 : Création de Lien Réelle (11.5s - 15.5s = 120 frames) */}
        <Series.Sequence durationInFrames={120}>
          <Scene04CreateLink />
        </Series.Sequence>

        {/* Scène 5 : Smart Edge Routing Réel (15.5s - 20s = 135 frames) */}
        <Series.Sequence durationInFrames={135}>
          <Scene05GeoRouting />
        </Series.Sequence>

        {/* Scène 6 : QR Code Studio Réel (20s - 24.5s = 135 frames) */}
        <Series.Sequence durationInFrames={135}>
          <Scene06QRCode />
        </Series.Sequence>

        {/* Scène 7 : Sécurité & PathLock Réel (24.5s - 28.5s = 120 frames) */}
        <Series.Sequence durationInFrames={120}>
          <Scene07Security />
        </Series.Sequence>

        {/* Scène 8 : Télémétrie Edge & 2.4 ms Réel (28.5s - 32.5s = 120 frames) */}
        <Series.Sequence durationInFrames={120}>
          <Scene08Stream />
        </Series.Sequence>

        {/* Scène 9 : Revenus & Acheteurs Réels (32.5s - 37s = 135 frames) */}
        <Series.Sequence durationInFrames={135}>
          <Scene09Revenue />
        </Series.Sequence>

        {/* Scène 10 : Carte Mondiale Réelle (37s - 41s = 120 frames) */}
        <Series.Sequence durationInFrames={120}>
          <Scene10WorldMap />
        </Series.Sequence>

        {/* Scène 11 : Outro & CTA Final (41s - 46s = 150 frames) */}
        <Series.Sequence durationInFrames={150}>
          <Scene11Outro />
        </Series.Sequence>
      </Series>
    </Background>
  );
};
