import React, { useState, useEffect } from 'react';
import { AcademyProvider, useAcademy } from './context/AcademyContext';
import { Navbar } from './components/Navbar';
import { WeeklyReminderBanner } from './components/WeeklyReminderBanner';
import { DirectorDashboard } from './components/DirectorDashboard';
import { ParentView } from './components/ParentView';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptViewerModal } from './components/ReceiptViewerModal';
import { PlayerModal } from './components/PlayerModal';
import { PlayerCarnetModal } from './components/PlayerCarnetModal';
import { WhatsAppBatchModal } from './components/WhatsAppBatchModal';
import { SettingsModal } from './components/SettingsModal';
import { ShareRegistrationModal } from './components/ShareRegistrationModal';
import { DirectorPinModal } from './components/DirectorPinModal';
import { Player, PaymentRecord } from './types';
import { getCurrentDateInfo } from './utils/dateAndPayment';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';

function AcademyApp() {
  const {
    role,
    setRole,
    settings,
    players,
    selectedPlayerId,
    loginParentByQuery,
    isDirectorUnlocked,
  } = useAcademy();
  const { month: currentMonth } = getCurrentDateInfo();

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [targetPaymentPlayer, setTargetPaymentPlayer] = useState<Player | undefined>(undefined);
  const [paymentInitialMonth, setPaymentInitialMonth] = useState<number | undefined>(undefined);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [viewingPayment, setViewingPayment] = useState<PaymentRecord | undefined>(undefined);
  const [viewingPlayer, setViewingPlayer] = useState<Player | undefined>(undefined);

  const [isPlayerModalOpen, setIsPlayerModalOpen] = useState(false);
  const [playerToEdit, setPlayerToEdit] = useState<Player | undefined>(undefined);

  const [isCarnetOpen, setIsCarnetOpen] = useState(false);
  const [carnetPlayer, setCarnetPlayer] = useState<Player | undefined>(undefined);

  const [isBatchWhatsAppOpen, setIsBatchWhatsAppOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isDirectorPinModalOpen, setIsDirectorPinModalOpen] = useState(false);

  // Auto-detect shared registration URL or private player access from parent
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const requestedRole = params.get('role');
      const playerParam = params.get('player');
      const docParam = params.get('doc');

      if (playerParam) {
        setRole('padre');
        loginParentByQuery(playerParam);
      } else if (docParam) {
        setRole('padre');
        loginParentByQuery(docParam);
      } else if (requestedRole === 'padre') {
        setRole('padre');
      }

      if (action === 'registro') {
        setRole('padre');
        setPlayerToEdit(undefined);
        setIsPlayerModalOpen(true);
      }
    }
  }, [setRole, loginParentByQuery]);

  // Handlers
  const handleOpenPaymentModal = (player: Player, month?: number) => {
    setTargetPaymentPlayer(player);
    setPaymentInitialMonth(month || currentMonth);
    setIsPaymentModalOpen(true);
  };

  const handleOpenPaymentForCurrent = () => {
    const selected = players.find((p) => p.id === selectedPlayerId) || players[0];
    if (selected) {
      handleOpenPaymentModal(selected, currentMonth);
    }
  };

  const handleViewReceipt = (payment: PaymentRecord, player: Player) => {
    setViewingPayment(payment);
    setViewingPlayer(player);
    setIsReceiptModalOpen(true);
  };

  const handleOpenPlayerModal = (player?: Player) => {
    setPlayerToEdit(player);
    setIsPlayerModalOpen(true);
  };

  const handleOpenCarnet = (player: Player) => {
    setCarnetPlayer(player);
    setIsCarnetOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col text-slate-800 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenBatchWhatsApp={() => setIsBatchWhatsAppOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        onOpenDirectorPinModal={() => setIsDirectorPinModalOpen(true)}
      />

      {/* PWA Install Promo Banner (on mobile devices where not installed) */}
      <PWAInstallButton variant="banner" />

      {/* Persistent Weekly Reminder Bar */}
      <WeeklyReminderBanner
        onOpenBatchWhatsApp={() => setIsBatchWhatsAppOpen(true)}
        onOpenPaymentModalForCurrent={handleOpenPaymentForCurrent}
      />

      {/* Main Content: Switches between Director and Padre de Familia views */}
      <main className="flex-1 pb-16">
        {role === 'director' ? (
          <DirectorDashboard
            onOpenPlayerModal={handleOpenPlayerModal}
            onOpenPaymentModal={handleOpenPaymentModal}
            onViewReceipt={handleViewReceipt}
            onOpenCarnet={handleOpenCarnet}
            onOpenBatchWhatsApp={() => setIsBatchWhatsAppOpen(true)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />
        ) : (
          <ParentView
            onOpenPaymentModal={handleOpenPaymentModal}
            onViewReceipt={handleViewReceipt}
            onOpenCarnet={handleOpenCarnet}
            onOpenRegisterPlayer={() => handleOpenPlayerModal()}
            onOpenEditPlayer={(player) => handleOpenPlayerModal(player)}
            onOpenShareModal={() => setIsShareModalOpen(true)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt={settings.name}
                className="w-8 h-9 object-contain shrink-0"
              />
            ) : (
              <span className="text-xl">⚽</span>
            )}
            <div className="text-left">
              <span className="text-white font-black block">{settings.name}</span>
              <span className="text-emerald-400 text-[11px] font-medium flex items-center gap-1">
                <span className="text-rose-500">❤️</span> «{settings.slogan}»
              </span>
            </div>
          </div>
          <p className="text-slate-400">
            Formando campeones dentro y fuera de la cancha • Contacto: {settings.phone}
          </p>
        </div>
      </footer>

      {/* Modals */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        targetPlayer={targetPaymentPlayer}
        initialMonth={paymentInitialMonth}
      />

      <ReceiptViewerModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        payment={viewingPayment}
        player={viewingPlayer}
      />

      <PlayerModal
        isOpen={isPlayerModalOpen}
        onClose={() => setIsPlayerModalOpen(false)}
        playerToEdit={playerToEdit}
      />

      <PlayerCarnetModal
        isOpen={isCarnetOpen}
        onClose={() => setIsCarnetOpen(false)}
        player={carnetPlayer}
      />

      <WhatsAppBatchModal
        isOpen={isBatchWhatsAppOpen}
        onClose={() => setIsBatchWhatsAppOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ShareRegistrationModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      <DirectorPinModal
        isOpen={isDirectorPinModalOpen}
        onClose={() => setIsDirectorPinModalOpen(false)}
      />

      {/* Network status toast */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AcademyProvider>
      <AcademyApp />
    </AcademyProvider>
  );
}
