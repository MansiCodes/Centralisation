import {
  IconDownload,
  IconShare,
  IconSync,
} from "@/components/icons/AppIcons";

export function ExportIcon({ size = 16 }: { size?: number }) {
  return <IconDownload size={size} />;
}

export function SyncIcon({ size = 16 }: { size?: number }) {
  return <IconSync size={size} />;
}

export function ShareIcon({ size = 16 }: { size?: number }) {
  return <IconShare size={size} />;
}
