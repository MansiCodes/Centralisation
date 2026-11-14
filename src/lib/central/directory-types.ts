export type CentralDirectoryUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  role: string | null;
  active: boolean;
  app: "pnl" | "workspace";
};
