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
      onAdd={navigation.onAdd}
      onTransaction={navigation.onTransaction}
      onAnalysis={navigation.onAnalysis}
      onProfile={navigation.onChat}
      onAddByCamera={navigation.onAddByCamera}
      onAddByVoice={navigation.onAddByVoice}
      onAddByForm={navigation.onAddByForm}
    />
  );
}