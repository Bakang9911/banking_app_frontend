export interface Transaction {
  id: number;
  type: string;
  direction: string;
  description: string;
  amount: number;
  timestamp: string;
  relatedAccountNumber?: string;
  relatedAccountName?: string;
  reference?: string;
}
