import { FC } from 'hono/jsx';
import { TransactionPageProps } from '../types';
import { PageTitle } from './PageTitle';
import { MetamaskConnector } from './MetamaskConnector';
import { TransactionList } from './TransactionList';
import { ErrorBox } from './ErrorBox';
import { generateScripts } from '../scripts/generateScripts';
import { styles } from '../styles/styles';

export const TransactionPage: FC<TransactionPageProps> = (props) => {
    return (
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta http-equiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Hardhat Metamask Connector</title>

                <script dangerouslySetInnerHTML={{ __html: generateScripts(props) }} />
                <style dangerouslySetInnerHTML={{ __html: styles }} />
            </head>

            <body>
                <div class="root">
                    <div class="container">
                        <PageTitle network={props.network} />
                        <MetamaskConnector />
                        <TransactionList transactions={props.transactions} />
                        <ErrorBox id="errorBox" type="error" />
                    </div>
                </div>
            </body>
        </html>
    );
};
