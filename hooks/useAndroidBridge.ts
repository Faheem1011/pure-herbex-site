"use client";

import { useEffect } from "react";
import type { ViewMode } from "@/app/inbox/types";

type AndroidBridge = {
  setChatOpen?: (open: boolean) => void;
  setKeepScreenOn?: (on: boolean) => void;
  getSession?: () => string | null;
  saveSession?: (token: string) => void;
  requestMicrophonePermission?: () => boolean;
  openAppSettings?: () => void;
};

export function getAndroidBridge(): AndroidBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { Android?: AndroidBridge }).Android;
}

type AndroidBridgeOptions = {
  isLoggedIn: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeChatOpen: boolean;
  activeCampaignChatOpen: boolean;
  isSelectMode: boolean;
  setIsSelectMode: (v: boolean) => void;
  setSelectedMessageIds: (v: Set<string>) => void;
  isForwardModalOpen: boolean;
  setIsForwardModalOpen: (v: boolean) => void;
  isNewChatOpen: boolean;
  setIsNewChatOpen: (v: boolean) => void;
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (v: boolean) => void;
  contactMenuOpen: boolean;
  setContactMenuOpen: (v: boolean) => void;
  showAttachMenu: boolean;
  setShowAttachMenu: (v: boolean) => void;
  showEmojiPicker: boolean;
  setShowEmojiPicker: (v: boolean) => void;
  onCloseActiveChat: () => void;
  onCloseCampaignChat: () => void;
  selectedMarketingLeadOpen?: boolean;
  onCloseMarketingLead?: () => void;
};

export function useAndroidBridge(options: AndroidBridgeOptions) {
  const {
    isLoggedIn,
    viewMode,
    setViewMode,
    activeChatOpen,
    activeCampaignChatOpen,
    isSelectMode,
    setIsSelectMode,
    setSelectedMessageIds,
    isForwardModalOpen,
    setIsForwardModalOpen,
    isNewChatOpen,
    setIsNewChatOpen,
    isLocationModalOpen,
    setIsLocationModalOpen,
    contactMenuOpen,
    setContactMenuOpen,
    showAttachMenu,
    setShowAttachMenu,
    showEmojiPicker,
    setShowEmojiPicker,
    onCloseActiveChat,
    onCloseCampaignChat,
    selectedMarketingLeadOpen = false,
    onCloseMarketingLead,
  } = options;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const android = getAndroidBridge();
    if (android?.setKeepScreenOn) {
      android.setKeepScreenOn(isLoggedIn);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const android = getAndroidBridge();
    if (android?.setChatOpen) {
      android.setChatOpen(activeChatOpen || activeCampaignChatOpen);
    }
  }, [activeChatOpen, activeCampaignChatOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleBack = (): boolean => {
      if (showEmojiPicker) {
        setShowEmojiPicker(false);
        return true;
      }
      if (showAttachMenu) {
        setShowAttachMenu(false);
        return true;
      }
      if (isLocationModalOpen) {
        setIsLocationModalOpen(false);
        return true;
      }
      if (isForwardModalOpen) {
        setIsForwardModalOpen(false);
        return true;
      }
      if (isNewChatOpen) {
        setIsNewChatOpen(false);
        return true;
      }
      if (contactMenuOpen) {
        setContactMenuOpen(false);
        return true;
      }
      if (isSelectMode) {
        setIsSelectMode(false);
        setSelectedMessageIds(new Set());
        return true;
      }
      if (activeCampaignChatOpen) {
        onCloseCampaignChat();
        return true;
      }
      if (activeChatOpen) {
        onCloseActiveChat();
        return true;
      }
      if (selectedMarketingLeadOpen && onCloseMarketingLead) {
        onCloseMarketingLead();
        return true;
      }
      if (viewMode !== "inbox") {
        setViewMode("inbox");
        return true;
      }
      return false;
    };

    (window as Window & { handleAndroidBack?: () => boolean }).handleAndroidBack =
      handleBack;

    return () => {
      delete (window as Window & { handleAndroidBack?: () => boolean })
        .handleAndroidBack;
    };
  }, [
    viewMode,
    setViewMode,
    activeChatOpen,
    activeCampaignChatOpen,
    isSelectMode,
    setIsSelectMode,
    setSelectedMessageIds,
    isForwardModalOpen,
    setIsForwardModalOpen,
    isNewChatOpen,
    setIsNewChatOpen,
    isLocationModalOpen,
    setIsLocationModalOpen,
    contactMenuOpen,
    setContactMenuOpen,
    showAttachMenu,
    setShowAttachMenu,
    showEmojiPicker,
    setShowEmojiPicker,
    onCloseActiveChat,
    onCloseCampaignChat,
    selectedMarketingLeadOpen,
    onCloseMarketingLead,
  ]);
}
