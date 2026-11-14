/**
 * Bold / filled icon theme for P&L (react-icons).
 * Keep weight consistent app-wide — do not mix thin outline sets here.
 */
import type { IconType } from "react-icons";
import {
  FaBars,
  FaCalendarAlt,
  FaChartBar,
  FaDownload,
  FaBolt,
  FaFileAlt,
  FaFileDownload,
  FaFileUpload,
  FaFilter,
  FaHome,
  FaIndustry,
  FaPen,
  FaPlus,
  FaSearch,
  FaShare,
  FaSignOutAlt,
  FaSync,
  FaTh,
  FaTrash,
  FaUsers,
  FaUserCircle,
  FaUserEdit,
  FaUserPlus,
  FaClipboardList,
  FaShoppingCart,
  FaBoxes,
  FaMoneyBillWave,
  FaBuilding,
  FaClock,
  FaCogs,
} from "react-icons/fa";
import { FaArrowTrendUp } from "react-icons/fa6";
import { PiExportBold, PiSidebarBold } from "react-icons/pi";
import type { NavIconName } from "@/components/shell/nav-config";

export type AppIconProps = {
  size?: number;
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
};

function icon(Icon: IconType, props: AppIconProps = {}) {
  const { size = 16, className, ...rest } = props;
  return <Icon size={size} className={className} aria-hidden {...rest} />;
}

export function IconCalendar(p?: AppIconProps) {
  return icon(FaCalendarAlt, p);
}
export function IconUpload(p?: AppIconProps) {
  return icon(PiExportBold, p);
}
export function IconDownload(p?: AppIconProps) {
  return icon(FaDownload, p);
}
export function IconExport(p?: AppIconProps) {
  return icon(PiExportBold, p);
}
export function IconLogout(p?: AppIconProps) {
  return icon(FaSignOutAlt, p);
}
export function IconPlus(p?: AppIconProps) {
  return icon(FaPlus, p);
}
export function IconMenu(p?: AppIconProps) {
  return icon(FaBars, p);
}
export function IconSidebar(p?: AppIconProps) {
  return icon(PiSidebarBold, p);
}
export function IconUser(p?: AppIconProps) {
  return icon(FaUserCircle, p);
}
export function IconFilter(p?: AppIconProps) {
  return icon(FaFilter, p);
}
export function IconSearch(p?: AppIconProps) {
  return icon(FaSearch, p);
}
export function IconEdit(p?: AppIconProps) {
  return icon(FaPen, p);
}
export function IconDelete(p?: AppIconProps) {
  return icon(FaTrash, p);
}
export function IconSync(p?: AppIconProps) {
  return icon(FaSync, p);
}
export function IconShare(p?: AppIconProps) {
  return icon(FaShare, p);
}
export function IconApps(p?: AppIconProps) {
  return icon(FaTh, p);
}
export function IconFileDownload(p?: AppIconProps) {
  return icon(FaFileDownload, p);
}
export function IconFileUpload(p?: AppIconProps) {
  return icon(FaFileUpload, p);
}
export function IconUserEdit(p?: AppIconProps) {
  return icon(FaUserEdit, p);
}
export function IconUserPlus(p?: AppIconProps) {
  return icon(FaUserPlus, p);
}
export function IconHome(p?: AppIconProps) {
  return icon(FaHome, p);
}
export function IconChart(p?: AppIconProps) {
  return icon(FaChartBar, p);
}
export function IconUsers(p?: AppIconProps) {
  return icon(FaUsers, p);
}
export function IconAudit(p?: AppIconProps) {
  return icon(FaClipboardList, p);
}
export function IconPlant(p?: AppIconProps) {
  return icon(FaIndustry, p);
}

const NAV_ICONS: Record<NavIconName, IconType> = {
  home: FaHome,
  today: FaCalendarAlt,
  purchase: FaShoppingCart,
  sale: FaArrowTrendUp,
  stock: FaBoxes,
  manpower: FaUsers,
  pettyCash: FaMoneyBillWave,
  electricity: FaBolt,
  assets: FaBuilding,
  pnl: FaChartBar,
  priceSheet: FaFileAlt,
  machineProduction: FaCogs,
  punctuality: FaClock,
  plants: FaIndustry,
  users: FaUsers,
  export: PiExportBold,
  audit: FaClipboardList,
};

export function IconNav({ name, size = 20 }: { name: NavIconName; size?: number }) {
  const Icon = NAV_ICONS[name];
  return <Icon size={size} aria-hidden />;
}
