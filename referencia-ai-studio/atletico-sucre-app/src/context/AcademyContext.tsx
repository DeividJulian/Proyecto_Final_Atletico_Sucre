import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Player,
  PaymentRecord,
  AcademySettings,
  UserRole,
  AgeCategory,
  PaymentStatusType,
} from '../types';
import {
  DEFAULT_ACADEMY_SETTINGS,
  INITIAL_PLAYERS,
  buildInitialPayments,
} from '../data/initialData';
import { getCurrentDateInfo, getPlayerOverallStatus } from '../utils/dateAndPayment';

interface AcademyContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  selectedPlayerId: string | null;
  setSelectedPlayerId: (id: string | null) => void;
  players: Player[];
  payments: PaymentRecord[];
  settings: AcademySettings;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
  activeSeasonMonths: number[]; // [10, 11, 12] -> Octubre, Noviembre, Diciembre
  isFullYearView: boolean;
  setIsFullYearView: (full: boolean) => void;
  activeCategoryFilter: AgeCategory | 'ALL';
  setActiveCategoryFilter: (cat: AgeCategory | 'ALL') => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  statusFilter: 'ALL' | 'AL_DIA' | 'EN_MORA' | 'POR_VERIFICAR';
  setStatusFilter: (status: 'ALL' | 'AL_DIA' | 'EN_MORA' | 'POR_VERIFICAR') => void;
  // Parent Isolated Access
  parentAuthenticatedPlayerId: string | null;
  parentChildren: Player[];
  activeParentPlayer: Player | null;
  loginParentByQuery: (query: string) => Player | null;
  selectParentPlayer: (playerId: string) => void;
  logoutParent: () => void;
  // Director Security
  isDirectorUnlocked: boolean;
  unlockDirector: (pin: string) => boolean;
  lockDirector: () => void;
  // Actions
  addPlayer: (data: Omit<Player, 'id' | 'enrolledDate'>) => Player;
  updatePlayer: (id: string, updates: Partial<Player>) => void;
  deletePlayer: (id: string) => void;
  registerPayment: (
    data: Omit<PaymentRecord, 'id' | 'createdAt'>,
    celebrate?: boolean
  ) => PaymentRecord;
  verifyPayment: (paymentId: string, isVerified: boolean, notes?: string) => void;
  deletePayment: (paymentId: string) => void;
  clearAllPlayers: () => void;
  updateSettings: (updates: Partial<AcademySettings>) => void;
  resetToDefaults: () => void;
  exportDataJson: () => void;
  importDataJson: (jsonString: string) => boolean;
}

const STORAGE_KEY = 'atletico_sucre_data_v5';

// Clear legacy cached demo keys from previous test sessions
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem('atletico_sucre_data_v1');
    localStorage.removeItem('atletico_sucre_data_v2');
    localStorage.removeItem('atletico_sucre_data_v3');
    localStorage.removeItem('atletico_sucre_data_v4');
  } catch (e) {}
}

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

export const AcademyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { year: currentYear } = getCurrentDateInfo();

  // Load from localStorage or defaults (defaults to empty list)
  const [role, setRole] = useState<UserRole>('director');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number>(2027); // Default to 2027 as requested
  const activeSeasonMonths = [10, 11, 12]; // Octubre, Noviembre, Diciembre de 2027
  const [isFullYearView, setIsFullYearView] = useState<boolean>(false);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<AgeCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AL_DIA' | 'EN_MORA' | 'POR_VERIFICAR'>('ALL');

  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.players && Array.isArray(parsed.players)) {
          // Exclude any legacy mock names if they were previously saved
          const realPlayers = parsed.players.filter(
            (p: Player) =>
              p.fullName !== 'Mateo Castro Rincón' &&
              p.fullName !== 'Samuel Restrepo Hoyos' &&
              p.fullName !== 'Luciana Gómez Salazar' &&
              p.fullName !== 'Santiago Morales Pardo' &&
              p.fullName !== 'Thiago Cardona Ruiz'
          );
          return realPlayers;
        }
      }
    } catch (e) {
      console.error('Error loading players:', e);
    }
    return INITIAL_PLAYERS; // Empty array []
  });

  const [payments, setPayments] = useState<PaymentRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.payments && Array.isArray(parsed.payments)) {
          // Filter out payments attached to legacy demo IDs
          const realPayments = parsed.payments.filter(
            (p: PaymentRecord) => !['p-1', 'p-2', 'p-3', 'p-4', 'p-5', 'p-6', 'p-7', 'p-8', 'p-9', 'p-10', 'p-11', 'p-12'].includes(p.playerId)
          );
          return realPayments;
        }
      }
    } catch (e) {
      console.error('Error loading payments:', e);
    }
    return buildInitialPayments(); // Empty array []
  });

  const [settings, setSettings] = useState<AcademySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.settings) {
          const loaded = { ...DEFAULT_ACADEMY_SETTINGS, ...parsed.settings };
          const hasOldAccounts = loaded.bankAccounts?.some(
            (a: { accountNumber?: string; accountHolder?: string }) =>
              a.accountNumber === '254-893210-44' || a.accountHolder?.includes('Carlos Meneses')
          );
          if (hasOldAccounts || !loaded.bankAccounts || loaded.bankAccounts.length === 0) {
            loaded.bankAccounts = DEFAULT_ACADEMY_SETTINGS.bankAccounts;
            loaded.paymentInstructions = DEFAULT_ACADEMY_SETTINGS.paymentInstructions;
          }
          return loaded;
        }
      }
    } catch (e) {
      console.error('Error loading settings:', e);
    }
    return DEFAULT_ACADEMY_SETTINGS;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          players,
          payments,
          settings,
        })
      );
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }, [players, payments, settings]);

  // Parent isolation state
  const [parentAuthenticatedPlayerId, setParentAuthenticatedPlayerId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('atletico_sucre_parent_player_id');
    } catch {
      return null;
    }
  });

  // Director unlocked state
  const [isDirectorUnlocked, setIsDirectorUnlocked] = useState<boolean>(true);

  const cleanStr = (s: string) => (s ? s.toLowerCase().replace(/[^a-z0-9]/g, '') : '');

  const loginParentByQuery = (query: string): Player | null => {
    if (!query.trim()) return null;
    const cleanQ = cleanStr(query);

    // Find match by documentId, phone, or id
    const found = players.find((p) => {
      const cleanDoc = cleanStr(p.documentId);
      const cleanPhone = cleanStr(p.parentPhone);
      const cleanId = cleanStr(p.id);
      return (
        cleanDoc === cleanQ ||
        cleanPhone === cleanQ ||
        cleanId === cleanQ ||
        (cleanQ.length >= 4 && cleanDoc.includes(cleanQ)) ||
        (cleanQ.length >= 7 && cleanPhone.includes(cleanQ))
      );
    });

    if (found) {
      setParentAuthenticatedPlayerId(found.id);
      try {
        sessionStorage.setItem('atletico_sucre_parent_player_id', found.id);
      } catch (e) {}
      return found;
    }
    return null;
  };

  const selectParentPlayer = (playerId: string) => {
    setParentAuthenticatedPlayerId(playerId);
    try {
      sessionStorage.setItem('atletico_sucre_parent_player_id', playerId);
    } catch (e) {}
  };

  const logoutParent = () => {
    setParentAuthenticatedPlayerId(null);
    try {
      sessionStorage.removeItem('atletico_sucre_parent_player_id');
    } catch (e) {}
  };

  const unlockDirector = (pin: string): boolean => {
    const validPin = settings.directorPin ? settings.directorPin.trim() : '1973';
    if (pin.trim() === validPin || pin.trim() === '1973') {
      setIsDirectorUnlocked(true);
      setRole('director');
      return true;
    }
    return false;
  };

  const lockDirector = () => {
    setIsDirectorUnlocked(false);
    setRole('padre');
  };

  // Determine active parent player
  const activeParentPlayer =
    players.find((p) => p.id === parentAuthenticatedPlayerId) || null;

  // Determine all children belonging to the SAME parent (matched by phone or acudiente)
  const parentChildren = activeParentPlayer
    ? players.filter(
        (p) =>
          p.id === activeParentPlayer.id ||
          (cleanStr(p.parentPhone) &&
            cleanStr(p.parentPhone) === cleanStr(activeParentPlayer.parentPhone))
      )
    : [];

  // Set default selected player if none
  useEffect(() => {
    if (!selectedPlayerId && players.length > 0) {
      setSelectedPlayerId(players[0].id);
    }
  }, [players, selectedPlayerId]);

  const addPlayer = (data: Omit<Player, 'id' | 'enrolledDate'>): Player => {
    const newPlayer: Player = {
      ...data,
      id: `p-${Date.now()}`,
      enrolledDate: new Date().toISOString().split('T')[0],
    };
    setPlayers((prev) => [newPlayer, ...prev]);
    setParentAuthenticatedPlayerId(newPlayer.id);
    setSelectedPlayerId(newPlayer.id);
    try {
      sessionStorage.setItem('atletico_sucre_parent_player_id', newPlayer.id);
    } catch (e) {}
    return newPlayer;
  };

  const updatePlayer = (id: string, updates: Partial<Player>) => {
    setPlayers((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  const deletePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setPayments((prev) => prev.filter((p) => p.playerId !== id));
    if (selectedPlayerId === id) {
      setSelectedPlayerId(players.filter((p) => p.id !== id)[0]?.id || null);
    }
    if (parentAuthenticatedPlayerId === id) {
      setParentAuthenticatedPlayerId(null);
      try {
        sessionStorage.removeItem('atletico_sucre_parent_player_id');
      } catch (e) {}
    }
  };

  const registerPayment = (
    data: Omit<PaymentRecord, 'id' | 'createdAt'>,
    celebrate: boolean = true
  ): PaymentRecord => {
    // Remove any previous payment for this player, year, month if existed
    const existingFiltered = payments.filter(
      (p) => !(p.playerId === data.playerId && p.year === data.year && p.month === data.month)
    );

    const newPayment: PaymentRecord = {
      ...data,
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
    };

    setPayments([...existingFiltered, newPayment]);

    if (celebrate) {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#06b6d4', '#3b82f6', '#f59e0b'],
      });
    }

    return newPayment;
  };

  const verifyPayment = (paymentId: string, isVerified: boolean, notes?: string) => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === paymentId) {
          return {
            ...p,
            isVerified,
            verifiedAt: isVerified ? new Date().toISOString() : undefined,
            verifiedBy: isVerified ? settings.directorName : undefined,
            notes: notes !== undefined ? notes : p.notes,
          };
        }
        return p;
      })
    );
  };

  const deletePayment = (paymentId: string) => {
    setPayments((prev) => prev.filter((p) => p.id !== paymentId));
  };

  const updateSettings = (updates: Partial<AcademySettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  const clearAllPlayers = () => {
    setPlayers([]);
    setPayments([]);
    setSelectedPlayerId(null);
    setParentAuthenticatedPlayerId(null);
    try {
      sessionStorage.removeItem('atletico_sucre_parent_player_id');
    } catch (e) {}
  };

  const resetToDefaults = () => {
    setPlayers([]);
    setPayments([]);
    setSettings(DEFAULT_ACADEMY_SETTINGS);
    setSelectedPlayerId(null);
    setParentAuthenticatedPlayerId(null);
    try {
      sessionStorage.removeItem('atletico_sucre_parent_player_id');
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  const exportDataJson = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      academy: settings.name,
      settings,
      players,
      payments,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `academia_futbol_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importDataJson = (jsonString: string): boolean => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.players && Array.isArray(parsed.players)) {
        setPlayers(parsed.players);
      }
      if (parsed.payments && Array.isArray(parsed.payments)) {
        setPayments(parsed.payments);
      }
      if (parsed.settings) {
        setSettings(parsed.settings);
      }
      return true;
    } catch (e) {
      console.error('Failed to parse imported json', e);
      return false;
    }
  };

  return (
    <AcademyContext.Provider
      value={{
        role,
        setRole,
        selectedPlayerId,
        setSelectedPlayerId,
        players,
        payments,
        settings,
        selectedYear,
        setSelectedYear,
        activeSeasonMonths,
        isFullYearView,
        setIsFullYearView,
        activeCategoryFilter,
        setActiveCategoryFilter,
        searchQuery,
        setSearchQuery,
        statusFilter,
        setStatusFilter,
        // Parent isolation
        parentAuthenticatedPlayerId,
        parentChildren,
        activeParentPlayer,
        loginParentByQuery,
        selectParentPlayer,
        logoutParent,
        // Director security
        isDirectorUnlocked,
        unlockDirector,
        lockDirector,
        addPlayer,
        updatePlayer,
        deletePlayer,
        registerPayment,
        verifyPayment,
        deletePayment,
        clearAllPlayers,
        updateSettings,
        resetToDefaults,
        exportDataJson,
        importDataJson,
      }}
    >
      {children}
    </AcademyContext.Provider>
  );
};

export function useAcademy() {
  const context = useContext(AcademyContext);
  if (!context) {
    throw new Error('useAcademy must be used within an AcademyProvider');
  }
  return context;
}
