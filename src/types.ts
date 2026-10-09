export type TransactionType = 'Income' | 'Expense';

export interface BillAttachment {
  id?: string;
  name: string;
  type: string;
  size: number;
  dataUrl?: string;
}

export interface Transaction {
  id: string;
  rowNumber?: number;
  timestamp: string;
  date: string;
  type: TransactionType;
  category: string;
  amount: number;
  note: string;
  item?: string;
  sellerDetails?: string;
  attachment?: BillAttachment;
  attachments?: BillAttachment[];
}

export interface CategoriesData {
  income: string[];
  expense: string[];
}

export type UserRole = 'Admin' | 'Business User' | 'User';

export interface SheetUserRecord {
  name: string;
  password?: string;
  role: UserRole;
  mobile?: string;
}

export interface SheetApiResponse {
  status: 'success' | 'error';
  message?: string;
  backendVersion?: string;
  categories?: CategoriesData;
  transactions?: Transaction[];
  record?: Partial<Transaction>;
  users?: SheetUserRecord[];
  items?: string[];
  sellers?: string[];
  deletedRow?: number;
  count?: number;
}

export interface AuthUser {
  id: string;
  name: string; // USERNAME
  mobile?: string;
  role: UserRole;
  createdAt: string;
}
