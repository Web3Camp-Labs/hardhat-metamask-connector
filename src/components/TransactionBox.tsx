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
                id={`sendButton${transaction.id}`}
            >
                Send Transaction
            </button>
            <div id={`statusBox${transaction.id}`} class="statusBox" style="display: none;"></div>
            <ErrorBox id={`warningBox${transaction.id}`} type="warning" />
            <ErrorBox id={`errorBox${transaction.id}`} type="error" />
        </div>
    );
};
