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
            this.transactions.set(body.id, body.hash);
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
        this.server.close();
    }

    public async getSigner(): Promise<SignerWithAddress> {
        return new Promise<SignerWithAddress>((resolve, reject) => {
            ethers.getSigners().then((signers: any[]) => {
                let signer = signers[0];

                let x = async (transaction: any) => {
                    let txId = this.txId;
                    console.log("Going to run transaction: " + txId);

                    await this.sendTransactions([transaction]);
                    return new Promise(async (resolve, reject) => {
                        let checkInterval = setInterval(async () => {
                            console.log("Checking for transaction: " + txId);
                            if (!this.transactions.has(txId)) return;
                            let hash = this.transactions.get(txId)!;
                            const tx = await signer.provider!.getTransaction(hash);
                            if (tx === null) return;
                            let result = (signer.provider! as any)._wrapTransactionResponse(tx);
                            clearInterval(checkInterval);
                            resolve(result);
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
