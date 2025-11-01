export interface Transaction {
    to?: string;
    nonce?: string;
    value?: string;
    data: string;
    chainId?: string;
    gasLimit?: string;
    gasPrice?: string;
}

export class TransactionWrapper {
    public id: number = 0;
    public transaction: Transaction;

    constructor(id: number, transaction: Transaction) {
        this.id = id;
        this.transaction = transaction;
    }
}

export interface TransactionPageProps {
    transactions: TransactionWrapper[];
    network: string;
    chainId: string;
    serverPort: number;
}

export interface TransactionListProps {
    transactions: TransactionWrapper[];
}

export interface TransactionBoxProps {
    transaction: TransactionWrapper;
}

export interface ErrorBoxProps {
    id: string;
    type?: 'error' | 'warning';
}

export interface PageTitleProps {
    network: string;
}
