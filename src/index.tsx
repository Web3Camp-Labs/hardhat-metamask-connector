import "@nomicfoundation/hardhat-ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import hre, { ethers } from "hardhat";
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import open from 'open';
import { TransactionWrapper } from './types';
import { TransactionPage } from './components/TransactionPage';

export { TransactionWrapper };

export class MetamaskConnector {
    private app: Hono;
    private readonly port: number = 8989;
    private readonly transactions: Map<number, string> = new Map<number, string>();
    private txId: number = 1;
    private signerAddr = "";
    private currentTxs: TransactionWrapper[] = [];

    server: any;

    constructor(defaultServerPort: number = 8989) {
        console.log("MetamaskConnector: Initializing...")

        if (hre.network == null) {
            throw new Error("Invalid configuration");
        }
        console.log("network", hre.network);

        this.port = defaultServerPort;
        this.app = new Hono();
        this.setupRoutes();
        this.startServer();
    }

    private setupRoutes() {
        this.app.get('/send-tx', (c) => {
            return c.html(
                <TransactionPage
                    transactions={this.currentTxs}
                    network={hre.network.name}
                    chainId={"0x" + (hre.network.config.chainId ?? 31337).toString(16)}
                    serverPort={this.port}
                />
            );
        });

        this.app.post('/signer-result', async (c) => {
            const body = await c.req.json();
            this.signerAddr = body.address;
            console.log(`Set Signer Success, signer address: ${this.signerAddr}`);
            return c.text('OK', 200);
        });

        this.app.post('/tx-result', async (c) => {
            const body = await c.req.json();
            console.log(`[SERVER] Received POST /tx-result with body:`, body);
            console.log(`[SERVER] Storing in map: transactions.set(${body.id}, ${body.hash})`);
            this.transactions.set(body.id, body.hash);
            console.log(`[SERVER] Map now contains ${this.transactions.size} transaction(s)`);
            console.log(`[SERVER] Verification - transactions.has(${body.id}):`, this.transactions.has(body.id));
            console.log(`Send transaction success: ${body.id}, tx hash: ${body.hash}`);
            return c.text('OK', 200);
        });
    }

    private startServer() {
        this.server = serve({
            fetch: this.app.fetch,
            port: this.port
        });
        console.log(`Server is running at http://localhost:${this.port}`);
    }

    public close() {
        console.log("[SERVER] Closing server...");
        if (this.server) {
            this.server.close(() => {
                console.log("[SERVER] Server closed successfully");
            });
            // Force close after 1 second if graceful close doesn't work
            setTimeout(() => {
                console.log("[SERVER] Forcing process exit");
                process.exit(0);
            }, 1000);
        }
    }

    public async getSigner(): Promise<SignerWithAddress> {
        return new Promise<SignerWithAddress>((resolve, reject) => {
            ethers.getSigners().then((signers: any[]) => {
                let signer = signers[0];

                // Replace the signer's provider with a properly connected one
                const networkUrl = (hre.network.config as any).url || 'http://127.0.0.1:8545';
                const connectedProvider = new ethers.JsonRpcProvider(networkUrl);
                console.log(`[SERVER] Setting signer provider to: ${networkUrl}`);
                (signer as any).provider = connectedProvider;

                let x = async (transaction: any) => {
                    let txId = this.txId;
                    console.log(`[SERVER] Creating transaction with ID: ${txId}`);
                    console.log(`[SERVER] Current this.txId counter: ${this.txId}`);
                    console.log("Going to run transaction: " + txId);

                    await this.sendTransactions([transaction]);
                    return new Promise(async (resolve, reject) => {
                        let checkInterval = setInterval(async () => {
                            console.log(`[SERVER] Polling - Checking for transaction: ${txId}`);
                            console.log(`[SERVER] Polling - transactions.has(${txId}):`, this.transactions.has(txId));
                            console.log(`[SERVER] Polling - Map contents:`, Array.from(this.transactions.entries()));

                            if (!this.transactions.has(txId)) return;

                            let hash = this.transactions.get(txId)!;
                            console.log(`[SERVER] Found transaction ${txId} with hash: ${hash}`);

                            try {
                                // Create a new provider using the network URL from config
                                const networkUrl = (hre.network.config as any).url || 'http://127.0.0.1:8545';
                                console.log(`[SERVER] Network URL from config:`, networkUrl);
                                console.log(`[SERVER] Network name:`, hre.network.name);

                                const provider = new ethers.JsonRpcProvider(networkUrl);
                                console.log(`[SERVER] Attempting to get receipt for hash: ${hash}`);

                                const receipt = await provider.getTransactionReceipt(hash);
                                console.log(`[SERVER] Receipt result:`, receipt ? `Found in block ${receipt.blockNumber}` : 'null');

                                // getTransactionReceipt returns null until the tx is mined
                                if (receipt === null) {
                                    console.log(`[SERVER] Transaction ${txId} not yet mined, waiting...`);
                                    return;
                                }

                                // Transaction is mined, get the full transaction for complete details
                                const tx = await provider.getTransaction(hash);
                                if (tx === null) {
                                    console.error(`[SERVER] Could not fetch transaction ${hash}`);
                                    return;
                                }

                                clearInterval(checkInterval);
                                console.log(`Transaction ${txId} confirmed in block ${receipt.blockNumber}`);
                                console.log(`[SERVER] Contract address:`, receipt.contractAddress || 'N/A');

                                // Create a transaction response with wait() method and all necessary fields
                                const txResponse = {
                                    hash: hash,
                                    wait: async () => {
                                        console.log(`[SERVER] wait() method called for transaction ${txId}`);
                                        return receipt;
                                    },
                                    blockNumber: receipt.blockNumber,
                                    blockHash: receipt.blockHash,
                                    from: tx.from,
                                    to: tx.to,
                                    nonce: tx.nonce,
                                    gasLimit: tx.gasLimit,
                                    gasPrice: tx.gasPrice,
                                    maxFeePerGas: tx.maxFeePerGas,
                                    maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
                                    data: tx.data,
                                    value: tx.value,
                                    chainId: tx.chainId,
                                    type: tx.type,
                                    accessList: tx.accessList
                                };
                                resolve(txResponse as any);
                            } catch (error) {
                                console.error(`Error checking transaction ${txId}:`, error);
                            }
                        }, 5000);
                    });
                }
                signer.sendTransaction = x as any;

                let y = async () => {
                    console.log("Going to get signer");
                    if (this.signerAddr !== "") {
                        console.log('Signer found: ', this.signerAddr);
                        return this.signerAddr;
                    }

                    return new Promise(async (resolve, reject) => {
                        let checkInterval = setInterval(async () => {
                            console.log("Checking for signer...");
                            if (this.signerAddr !== "") {
                                clearInterval(checkInterval);
                                resolve(this.signerAddr);
                            }
                        }, 1000);

                        await this.sendTransactions([]);
                    });
                }
                signer.getAddress = y as any;

                resolve(signer);
            });
        });
    }

    public async sendTransactions(transactions: any[]): Promise<void> {
        var txs = transactions.map((transaction) => {
            return new TransactionWrapper(this.txId++, transaction);
        })

        console.log(txs);

        this.currentTxs = txs;

        const url = `http://localhost:${this.port}/send-tx`;

        try {
            await open(url);
        } catch (error) {
            console.log("Error opening your browser, please access this URL:", url);
        }
    }
}
