import React from 'react';
import { spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { MacWindow } from '../components/MacWindow';

interface SwitchRowProps {
  icon: string;
  title: string;
  description: string;
  isActive: boolean;
  activeColor?: string;
}

const SwitchRow: React.FC<SwitchRowProps> = ({
  icon,
  title,
  description,
  isActive,
  activeColor = '#2563EB',
}) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: isActive ? 'rgba(37, 99, 235, 0.08)' : 'rgba(2, 6, 23, 0.4)',
        border: isActive ? `1px solid ${activeColor}` : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 12,
        marginBottom: 12,
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: 10,
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>{title}</div>
          <div style={{ fontSize: 13, color: 'rgba(255, 255, 255, 0.65)' }}>{description}</div>
        </div>
      </div>

      {/* Toggle Switch */}
      <div
        style={{
          width: 52,
          height: 28,
          borderRadius: 999,
          backgroundColor: isActive ? activeColor : 'rgba(255, 255, 255, 0.2)',
          padding: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isActive ? 'flex-end' : 'flex-start',
          boxShadow: isActive ? `0 0 16px ${activeColor}` : 'none',
        }}
      >
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        />
      </div>
    </div>
  );
};

export const Scene06Security: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enterSpring = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 },
  });

  // Sequential toggles
  const toggle1 = frame >= 35;
  const toggle2 = frame >= 65;
  const toggle3 = frame >= 95;
  const toggle4 = frame >= 125;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 80px',
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: 32,
          transform: `translateY(${(1 - enterSpring) * 30}px)`,
          opacity: enterSpring,
        }}
      >
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#10B981',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            display: 'block',
            marginBottom: 8,
          }}
        >
          Sécurité & Contrôle Avancé
        </span>
        <h2 style={{ fontSize: 46, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
          Protection de niveau entreprise.{' '}
          <span style={{ color: '#34D399' }}>PathLock™ inclus.</span>
        </h2>
      </div>

      {/* MacWindow Container */}
      <div
        style={{
          transform: `scale(${enterSpring})`,
          opacity: enterSpring,
        }}
      >
        <MacWindow title="Paramètres de sécurité & protection" width={880} badge="Chiffrement AES-256">
          <div style={{ padding: '28px 36px' }}>
            <SwitchRow
              icon="🔒"
              title="Protection par mot de passe"
              description="Exige un code secret ou PIN pour accéder au contenu VIP."
              isActive={toggle1}
              activeColor="#10B981"
            />
            <SwitchRow
              icon="⏳"
              title="Expiration automatique du lien"
              description="Redirige automatiquement vers une page d'offre expirée à la fin du compte à rebours."
              isActive={toggle2}
              activeColor="#38BDF8"
            />
            <SwitchRow
              icon="🛡️"
              title="PathLock™ (Verrouillage du tunnel)"
              description="Empêche l'utilisateur de quitter le funnel d'achat ou de naviguer ailleurs."
              isActive={toggle3}
              activeColor="#818CF8"
            />
            <SwitchRow
              icon="👁️"
              title="Cloaking & Masquage de domaine"
              description="Conserve votre nom de domaine court dans la barre d'adresse sans révéler l'URL cible."
              isActive={toggle4}
              activeColor="#EC4899"
            />
          </div>
        </MacWindow>
      </div>
    </div>
  );
};
