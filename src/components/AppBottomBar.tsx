import React from "react";
import { BottomBar } from "./BottomBar";
import { useTabNavigation } from "../hooks/useTabNavigation";

interface AppBottomBarProps {
  onCameraOpen?: () => void;
  onVoiceOpen?: () => void;
  onFormOpen?: () => void;
}

export default function AppBottomBar({
  onCameraOpen,
  onVoiceOpen,
  onFormOpen,
}: AppBottomBarProps) {
  const navigation = useTabNavigation({
    onCameraOpen,
    onVoiceOpen,
    onFormOpen,
  });

  return (
    <BottomBar
      active={navigation.activeTab}
      onHome={navigation.onHome}
      onStats={navigation.onStats}
      onTransaction={navigation.onTransaction}
      onAdd={navigation.onAdd}
      onWallet={navigation.onWallet}
      onProject={navigation.onProject}
      onProfile={navigation.onProfile}
      onAddByCamera={navigation.onAddByCamera}
      onAddByVoice={navigation.onAddByVoice}
      onAddByForm={navigation.onAddByForm}
    />
  );
}