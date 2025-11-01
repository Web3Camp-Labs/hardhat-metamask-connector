import { FC } from 'hono/jsx';
import { TransactionListProps } from '../types';
import { TransactionBox } from './TransactionBox';

export const TransactionList: FC<TransactionListProps> = ({ transactions }) => {
    if (transactions.length === 0) {
        return (
            <button onclick="signer()" class="myButton">
                Set Signer
            </button>
        );
    }

    return (
        <>
            {transactions.map(tx => (
                <TransactionBox key={tx.id} transaction={tx} />
            ))}
        </>
    );
};
