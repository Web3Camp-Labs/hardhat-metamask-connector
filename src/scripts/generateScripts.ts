import { TransactionWrapper, TransactionPageProps } from '../types';

export function generateScripts(props: TransactionPageProps): string {
    return `
        ${generateGlobalVariables()}
        ${generateConnectFunction(props.chainId)}
        ${generateUpdateAccountsFunction()}
        ${generateSignerFunction(props.serverPort)}
        ${generateTransactionFunctions(props.transactions, props.serverPort)}
        ${generateShowGlobalErrorFunction()}
        ${generateInitFunction(props.transactions, props.serverPort)}
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

            // Hide connect button after successful connection
            document.getElementById('b1').style.display = 'none';

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
                console.log('[BROWSER] Transaction parameters:', transactionParameters);

                // Get UI elements
                const statusBox = document.getElementById("statusBox${tx.id}");
                const errorBox = document.getElementById("errorBox${tx.id}");
                const sendButton = document.getElementById("sendButton${tx.id}");

                // Hide error box
                errorBox.style.display = "none";

                // Show pending status
                statusBox.style.display = "flex";
                statusBox.className = "statusBox statusPending";
                statusBox.innerHTML = '<span class="statusIcon">⏳</span> <span>Waiting for confirmation...</span>';
                sendButton.disabled = true;

                try {
                    console.log('[BROWSER] Requesting transaction from MetaMask...');
                    const txHash = await ethereum.request({
                        method: 'eth_sendTransaction',
                        params: [transactionParameters],
                    });
                    console.log('[BROWSER] MetaMask returned transaction hash:', txHash);

                    // Show sending status
                    statusBox.className = "statusBox statusSending";
                    statusBox.innerHTML = '<span class="statusIcon">📤</span> <span>Transaction sent! Waiting for confirmation...</span>';

                    console.log('[BROWSER] Preparing to POST to server with txId: ${tx.id} and hash:', txHash);
                    var xmlHttp = new XMLHttpRequest();
                    var url = "http://localhost:${serverPort}/tx-result";
                    xmlHttp.open("POST", url, false);
                    xmlHttp.setRequestHeader("Content-Type", "application/json");
                    const postData = JSON.stringify({
                        id: ${tx.id},
                        hash: txHash
                    });
                    console.log('[BROWSER] POSTing to server:', postData);
                    xmlHttp.send(postData);
                    console.log('[BROWSER] Server response status:', xmlHttp.status);
                    console.log('[BROWSER] Server response:', xmlHttp.responseText);

                    // Show success status with hash
                    statusBox.className = "statusBox statusSuccess";
                    const shortHash = txHash.slice(0, 10) + '...' + txHash.slice(-8);
                    statusBox.innerHTML = '<span class="statusIcon">✅</span> <span>Transaction confirmed! Hash: <strong>' + shortHash + '</strong></span>';
                    console.log('[BROWSER] Transaction successful:', txHash);
                } catch (err) {
                    console.error('[BROWSER] Error during transaction:', err);
                    // Show error
                    statusBox.style.display = "none";
                    errorBox.style.display = "flex";
                    errorBox.innerText = err.message;
                    sendButton.disabled = false;
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

function generateInitFunction(transactions: TransactionWrapper[], serverPort: number): string {
    const errorWarningChecks = transactions.map(tx => `
        // Transaction ${tx.id} error/warning handling can be added here if needed
    `).join('\n');

    const currentTxIds = transactions.map(tx => tx.id).join(',');

    return `
        let currentTransactionIds = [${currentTxIds}];
        let pollingInterval = null;

        async function checkForUpdates() {
            try {
                const response = await fetch('http://localhost:${serverPort}/status');
                const data = await response.json();

                // Check if transaction IDs have changed
                const newIds = data.transactionIds.join(',');
                const oldIds = currentTransactionIds.join(',');

                if (newIds !== oldIds && data.transactionIds.length > 0) {
                    console.log('[UI] New transactions detected, reloading page...');
                    window.location.reload();
                }
            } catch (error) {
                console.error('[UI] Error checking for updates:', error);
            }
        }

        async function initialize() {
            // Check if wallet is already connected
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const accounts = await ethereum.request({ method: 'eth_accounts' });
                    if (accounts.length > 0) {
                        // Wallet already connected, update UI
                        console.log('[UI] Wallet already connected:', accounts[0]);
                        updateAccounts(accounts);
                        ethereum.on('accountsChanged', function(accounts) {
                            updateAccounts(accounts);
                        });
                    } else {
                        // No wallet connected, show connect button
                        console.log('[UI] No wallet connected, showing connect button');
                        document.getElementById('b1').style.display = 'block';
                    }
                } catch (error) {
                    console.error('[UI] Error checking wallet connection:', error);
                    document.getElementById('b1').style.display = 'block';
                }
            } else {
                // MetaMask not installed
                document.getElementById('b1').style.display = 'block';
            }

            // Start polling for updates every 2 seconds
            pollingInterval = setInterval(checkForUpdates, 2000);
            console.log('[UI] Started polling for transaction updates');

            setTimeout(() => {
                ${errorWarningChecks}
            }, 300);
        }

        initialize();
    `;
}
