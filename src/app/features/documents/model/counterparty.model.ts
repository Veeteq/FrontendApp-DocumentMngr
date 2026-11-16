export interface Address {
  country: string;
  postcode: string;
  city: string;
  street: string;
}

export interface CounterpartyBase {
  id: number;
  displayName: string;
  address?: Address;
  bankAccountNumber?: string;
  tags?: string[];
}

export interface PersonCounterparty extends CounterpartyBase {
  type: 'PERSON';
  firstName: string;
  lastName: string;
}

export interface CompanyCounterparty extends CounterpartyBase {
  type: 'COMPANY';
  companyName: string;
  taxId?: string;
}

export type Counterparty = 
  | PersonCounterparty
  | CompanyCounterparty;
