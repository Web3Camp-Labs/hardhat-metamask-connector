import { TransactionWrapper, TransactionPageProps } from '../types';

export function generateScripts(props: TransactionPageProps): string {
    return `
        ${generateGlobalVariables()}
        ${generateConnectFunction(props.chainId)}
        ${generateUpdateAccountsFunction()}
        ${generateSignerFunction(props.serverPort)}
        ${generateTransactionFunctions(props.transactions, props.serverPort)}
        ${generateShowGlobalErrorFunction()}
        ${generateInitFunction(props.transactions)}
    `;
}

function generateGlobalVariables(): string {
    return `let account;`;
}

function generateConnectFunction(chainId: string): string {
    return `
        async function connect() {
            if (typeof window.ethereum !== 'undefined') {
                console.log('MetaMask is installed!');
            }
            const accounts = await ethereum.request({
                method: 'eth_requestAccounts'
            });
            updateAccounts(accounts);
            ethereum.on('accountsChanged', function(accounts) {
                updateAccounts(accounts);
            });

            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: '${chainId}' }]
                });
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask
                if (switchError.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [{
                                chainId: '${chainId}',
                                chainName: 'Hardhat Local',
                                nativeCurrency: {
                                    name: 'ETH',
                                    symbol: 'ETH',
                                    decimals: 18
                                },
                                rpcUrls: ['http://127.0.0.1:8545'],
                                blockExplorerUrls: null
                            }]
                        });
                    } catch (addError) {
                        showGlobalError(addError);
                    }
                } else {
                    showGlobalError(switchError);
                }
            }
        }
    `;
}

function generateUpdateAccountsFunction(): string {
    return `
        function updateAccounts(accounts) {
            if (accounts.length > 0) {
                account = accounts[0];
                document.getElementById("wallet").innerText = 'Connected To: ' + accounts[0];
            } else {
                account = undefined;
                document.getElementById("wallet").innerText = 'Not Connected';
            }
        }
    `;
}

function generateSignerFunction(serverPort: number): string {
    return `
        function signer() {
            if (account === undefined) {
                showGlobalError(new Error("Please connect to MetaMask"));
                return;
            }

            var xmlHttp = new XMLHttpRequest();
            var url = "http://localhost:${serverPort}/signer-result";
            xmlHttp.open("POST", url, false);
            xmlHttp.setRequestHeader("Content-Type", "application/json");
            xmlHttp.send(JSON.stringify({ address: account }));
        }
    `;
}

function generateTransactionFunctions(transactions: TransactionWrapper[], serverPort: number): string {
    return transactions.map(tx => {
        const params: string[] = [
            'from: ethereum.selectedAddress'
        ];

        if (tx.transaction.to) params.push(`to: '${tx.transaction.to}'`);
        if (tx.transaction.nonce) params.push(`nonce: '${tx.transaction.nonce}'`);
        if (tx.transaction.value) params.push(`value: '${tx.transaction.value}'`);
        if (tx.transaction.chainId) params.push(`chainId: '${tx.transaction.chainId}'`);
        if (tx.transaction.gasLimit) params.push(`gas: '${tx.transaction.gasLimit}'`);
        if (tx.transaction.gasPrice) params.push(`gasPrice: '${tx.transaction.gasPrice}'`);
        params.push(`data: '${tx.transaction.data}'`);

        return `
            async function sendTransaction${tx.id}() {
                const transactionParameters = {
                    ${params.join(',\n                    ')}
                };
                console.log(transactionParameters);

                try {
                    const txHash = await ethereum.request({
                        method: 'eth_sendTransaction',
                        params: [transactionParameters],
                    });

                    var xmlHttp = new XMLHttpRequest();
                    var url = "http://localhost:${serverPort}/tx-result";
                    xmlHttp.open("POST", url, false);
                    xmlHttp.setRequestHeader("Content-Type", "application/json");
                    xmlHttp.send(JSON.stringify({
                        id: ${tx.id},
                        hash: txHash
                    }));
                } catch (err) {
                    let element = document.getElementById("errorBox${tx.id}");
                    element.style.display = "flex";
                    element.innerText = err.message;
                }
            }
        `;
    }).join('\n');
}

function generateShowGlobalErrorFunction(): string {
    return `
        function showGlobalError(err) {
            let element = document.getElementById("errorBox");
            element.style.display = "flex";
            element.innerText = err.message;
        }
    `;
}

function generateInitFunction(transactions: TransactionWrapper[]): string {
    const errorWarningChecks = transactions.map(tx => `
        // Transaction ${tx.id} error/warning handling can be added here if needed
    `).join('\n');

    return `
        function initialize() {
            setTimeout(() => {
                ${errorWarningChecks}
            }, 300);
        }

        initialize();
        connect();
    `;
}
