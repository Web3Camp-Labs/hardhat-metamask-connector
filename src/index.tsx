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
    private browserOpened: boolean = false; // Track if browser was already opened

    server: any;

    constructor(defaultServerPort: number = 8989) {
        if (hre.network == null) {
            throw new Error("Invalid configuration");
        }

        this.port = defaultServerPort;

        // Log essential network information
        const chainId = hre.network.config.chainId ?? 31337;
        const networkUrl = (hre.network.config as any).url || 'http://127.0.0.1:8545';
        console.log("MetamaskConnector: Initializing...");
        console.log(`  Network: ${hre.network.name}`);
        console.log(`  Chain ID: ${chainId}`);
        console.log(`  RPC URL: ${networkUrl}`);

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

        // Status endpoint for polling
        this.app.get('/status', (c) => {
            return c.json({
                transactionCount: this.currentTxs.length,
                transactionIds: this.currentTxs.map(tx => tx.id)
            });
        });

        this.app.post('/signer-result', async (c) => {
            const body = await c.req.json();
            this.signerAddr = body.address;
            console.log(`Signer connected: ${this.signerAddr}`);
            return c.text('OK', 200);
        });

        this.app.post('/tx-result', async (c) => {
            const body = await c.req.json();
            this.transactions.set(body.id, body.hash);
            console.log(`Transaction ${body.id} submitted: ${body.hash}`);
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
        if (this.server) {
            this.server.close(() => {
                console.log("Server closed");
            });
            // Force close after 1 second if graceful close doesn't work
            setTimeout(() => {
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
                (signer as any).provider = connectedProvider;

                let x = async (transaction: any) => {
                    let txId = this.txId;

                    await this.sendTransactions([transaction]);
                    return new Promise(async (resolve, reject) => {
                        let checkInterval = setInterval(async () => {
                            if (!this.transactions.has(txId)) return;

                            let hash = this.transactions.get(txId)!;

                            try {
                                // Create a new provider using the network URL from config
                                const networkUrl = (hre.network.config as any).url || 'http://127.0.0.1:8545';
                                const provider = new ethers.JsonRpcProvider(networkUrl);

                                const receipt = await provider.getTransactionReceipt(hash);

                                // getTransactionReceipt returns null until the tx is mined
                                if (receipt === null) return;

                                // Transaction is mined, get the full transaction for complete details
                                const tx = await provider.getTransaction(hash);
                                if (tx === null) return;

                                clearInterval(checkInterval);
                                console.log(`Transaction confirmed in block ${receipt.blockNumber}`);

                                // Create a transaction response with wait() method and all necessary fields
                                const txResponse = {
                                    hash: hash,
                                    wait: async () => receipt,
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
                    if (this.signerAddr !== "") {
                        return this.signerAddr;
                    }

                    return new Promise(async (resolve, reject) => {
                        let checkInterval = setInterval(async () => {
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

        this.currentTxs = txs;

        const url = `http://localhost:${this.port}/send-tx`;

        // Only open browser once
        if (!this.browserOpened) {
            try {
                await open(url);
                this.browserOpened = true;
            } catch (error) {
                console.log("Please open browser at:", url);
            }
        }
    }
}
