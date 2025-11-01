import { FC } from 'hono/jsx';
import { TransactionBoxProps } from '../types';
import { ErrorBox } from './ErrorBox';

export const TransactionBox: FC<TransactionBoxProps> = ({ transaction }) => {
    return (
        <div class="transitionBox">
            <span class="transactionLabel">Transaction {transaction.id}</span>
            <button
                onclick={`sendTransaction${transaction.id}()`}
                class="myButton"
            >
                Send Transaction
            </button>
            <ErrorBox id={`warningBox${transaction.id}`} type="warning" />
            <ErrorBox id={`errorBox${transaction.id}`} type="error" />
        </div>
    );
};
