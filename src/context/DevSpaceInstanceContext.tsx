import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  DevSpaceInstanceProfile,
  ThemeOverrides,
  LayoutOverrides,
  TextOverrides,
  AetherPersonalityConfig,
  ChangeProposal,
  aetherInstanceEngine,
  EXPLORE_COMMUNITY_PROFILES,
} from '../lib/aetherInstanceEngine';

interface DevSpaceInstanceContextType {
  isEditableMode: boolean;
  toggleEditableMode: () => void;
  isSafeMode: boolean;
  toggleSafeMode: () => void;
  activeProfile: DevSpaceInstanceProfile;
  allProfiles: DevSpaceInstanceProfile[];
  updateProfile: (updates: Partial<DevSpaceInstanceProfile>, summary?: string) => void;
  setActiveProfileId: (id: string) => void;
  createNewProfile: (name: string, description: string) => void;
  createSnapshot: (label: string) => void;
  rollbackSnapshot: (version: string) => void;
  importProfile: (json: string) => { success: boolean; error?: string };
  exportProfile: () => string;
  getLabel: (defaultLabel: string) => string;
  executeCustomTool: (toolDef: any, input: string) => { success: boolean; result?: string; error?: string };
  executeCustomIntegration: (integDef: any, payloadJson?: string) => Promise<{ success: boolean; statusCode?: number; responseText?: string; error?: string }>;
  getSecurityLogs: () => any[];
  logSecurityEvent: (action: any, details: string, severity?: any, actor?: string) => void;
  getCapabilityManifest: (profile: any) => any;
  activeProposal: ChangeProposal | null;
  setProposal: (proposal: ChangeProposal | null) => void;
  applyProposal: (proposal: ChangeProposal) => void;
  communityProfiles: DevSpaceInstanceProfile[];
}

const DevSpaceInstanceContext = createContext<DevSpaceInstanceContextType | undefined>(undefined);

export function DevSpaceInstanceProvider({ children }: { children: ReactNode }) {
  const [isEditableMode, setIsEditableMode] = useState<boolean>(false);
  const [isSafeMode, setIsSafeMode] = useState<boolean>(aetherInstanceEngine.isSafeModeEnabled());
  const [activeProfile, setActiveProfileState] = useState<DevSpaceInstanceProfile>(aetherInstanceEngine.getActiveProfile());
  const [allProfiles, setAllProfiles] = useState<DevSpaceInstanceProfile[]>(aetherInstanceEngine.getAllProfiles());
  const [activeProposal, setProposal] = useState<ChangeProposal | null>(null);
  const [communityProfiles, setCommunityProfiles] = useState<DevSpaceInstanceProfile[]>(EXPLORE_COMMUNITY_PROFILES);

  // Sync Safe Mode
  useEffect(() => {
    aetherInstanceEngine.setSafeMode(isSafeMode);
  }, [isSafeMode]);

  // Inject Custom Theme CSS Variables dynamically into DOM root
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (isSafeMode) {
      // Clear custom CSS overrides when in Safe Mode
      document.documentElement.style.removeProperty('--custom-primary');
      document.documentElement.style.removeProperty('--custom-bg');
      document.documentElement.style.removeProperty('--custom-card-bg');
      document.documentElement.style.removeProperty('--custom-border-radius');
      document.body.style.fontFamily = '';
      return;
    }

    const { themeOverrides } = activeProfile;
    if (themeOverrides) {
      document.documentElement.style.setProperty('--custom-primary', themeOverrides.primaryColor);
      document.documentElement.style.setProperty('--custom-accent', themeOverrides.accentColor);
      document.documentElement.style.setProperty('--custom-bg', themeOverrides.backgroundColor);
      document.documentElement.style.setProperty('--custom-card-bg', themeOverrides.cardBackgroundColor);
      document.documentElement.style.setProperty('--custom-border-radius', `${themeOverrides.borderRadiusPx}px`);

      if (themeOverrides.fontFamily !== 'System Default') {
        document.body.style.fontFamily = `${themeOverrides.fontFamily}, sans-serif`;
      } else {
        document.body.style.fontFamily = '';
      }
    }
  }, [activeProfile, isSafeMode]);

  const toggleEditableMode = () => setIsEditableMode((prev) => !prev);

  const toggleSafeMode = () => {
    const next = !isSafeMode;
    setIsSafeMode(next);
    aetherInstanceEngine.setSafeMode(next);
    aetherInstanceEngine.logSecurityEvent(
      'SAFE_MODE_TOGGLED',
      `Safe Mode ${next ? 'ACTIVATED (Custom extensions, JS tools, & themes suspended)' : 'DEACTIVATED'}`,
      next ? 'info' : 'warn'
    );
  };

  const updateProfile = (updates: Partial<DevSpaceInstanceProfile>, summary?: string) => {
    const updated = aetherInstanceEngine.updateActiveProfile(updates, summary);
    setActiveProfileState(updated);
    setAllProfiles(aetherInstanceEngine.getAllProfiles());
  };

  const setActiveProfileId = (id: string) => {
    const active = aetherInstanceEngine.setActiveProfileId(id);
    setActiveProfileState(active);
    setAllProfiles(aetherInstanceEngine.getAllProfiles());
  };

  const createNewProfile = (name: string, description: string) => {
    const created = aetherInstanceEngine.createNewProfile(name, description);
    setActiveProfileState(created);
    setAllProfiles(aetherInstanceEngine.getAllProfiles());
  };

  const createSnapshot = (label: string) => {
    const updated = aetherInstanceEngine.createVersionSnapshot(activeProfile, label);
    setActiveProfileState(updated);
  };

  const rollbackSnapshot = (version: string) => {
    const updated = aetherInstanceEngine.rollbackToSnapshot(activeProfile, version);
    setActiveProfileState(updated);
  };

  const importProfile = (json: string) => {
    const res = aetherInstanceEngine.importProfileFromJson(json);
    if (res.success && res.profile) {
      setActiveProfileState(res.profile);
      setAllProfiles(aetherInstanceEngine.getAllProfiles());
    }
    return res;
  };

  const exportProfile = () => {
    return aetherInstanceEngine.exportProfileToJson(activeProfile);
  };

  const getLabel = (defaultLabel: string): string => {
    if (isSafeMode) return defaultLabel;
    const textOverrides = activeProfile.textOverrides || {};
    return textOverrides[defaultLabel] || defaultLabel;
  };

  const applyProposal = (proposal: ChangeProposal) => {
    const updates: Partial<DevSpaceInstanceProfile> = {};

    if (proposal.proposedTheme) {
      updates.themeOverrides = { ...activeProfile.themeOverrides, ...proposal.proposedTheme };
    }
    if (proposal.proposedLayout) {
      updates.layoutOverrides = { ...activeProfile.layoutOverrides, ...proposal.proposedLayout };
    }
    if (proposal.proposedText) {
      updates.textOverrides = { ...activeProfile.textOverrides, ...proposal.proposedText };
    }
    if (proposal.proposedPersonality) {
      updates.aetherPersonality = { ...activeProfile.aetherPersonality, ...proposal.proposedPersonality };
    }

    updateProfile(updates, `Applied Aether Change Proposal: "${proposal.title}"`);
    setProposal(null);
  };

  const executeCustomTool = (toolDef: any, input: string) => {
    return aetherInstanceEngine.executeCustomTool(toolDef, input, isSafeMode);
  };

  const executeCustomIntegration = (integDef: any, payloadJson?: string) => {
    return aetherInstanceEngine.executeCustomIntegration(integDef, payloadJson, isSafeMode);
  };

  const getSecurityLogs = () => {
    return aetherInstanceEngine.getSecurityLogs();
  };

  const logSecurityEvent = (action: any, details: string, severity?: any, actor?: string) => {
    aetherInstanceEngine.logSecurityEvent(action, details, severity, actor);
  };

  const getCapabilityManifest = (profile: any) => {
    return aetherInstanceEngine.getProfileCapabilityManifest(profile);
  };

  return (
    <DevSpaceInstanceContext.Provider
      value={{
        isEditableMode,
        toggleEditableMode,
        isSafeMode,
        toggleSafeMode,
        activeProfile,
        allProfiles,
        updateProfile,
        setActiveProfileId,
        createNewProfile,
        createSnapshot,
        rollbackSnapshot,
        importProfile,
        exportProfile,
        getLabel,
        executeCustomTool,
        executeCustomIntegration,
        getSecurityLogs,
        logSecurityEvent,
        getCapabilityManifest,
        activeProposal,
        setProposal,
        applyProposal,
        communityProfiles,
      }}
    >
      {children}
    </DevSpaceInstanceContext.Provider>
  );
}

export function useDevSpaceInstance() {
  const context = useContext(DevSpaceInstanceContext);
  if (!context) {
    throw new Error('useDevSpaceInstance must be used within a DevSpaceInstanceProvider');
  }
  return context;
}
