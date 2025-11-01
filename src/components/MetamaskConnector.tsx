import { FC } from 'hono/jsx';

export const MetamaskConnector: FC = () => {
    return (
        <>
            <button onclick="connect()" id="b1" class="myButton">
                Connect to MetaMask
            </button>
            <span id="wallet" class="subtitle"></span>
        </>
    );
};
