export interface BeneficiaryLookup {
  accountNumber: string;
  name: string;
  type: string;
  currency: string;
}

export interface Beneficiary {
  id: number;
  nickname: string;
  accountNumber: string;
  name: string;
  type: string;
  currency: string;
  createdAt: string;
}

export interface SaveBeneficiaryRequest {
  accountNumber: string;
  nickname: string;
}
