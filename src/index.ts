import "@nomicfoundation/hardhat-ethers";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import hre, { ethers } from "hardhat";
// import "@typechain/hardhat";
import express, { Express, Request, Response } from 'express';
import { Eta } from "eta";
import bodyParser from 'body-parser';
import http from 'http';
import path from 'path';
import open from 'open';

class TransactionWrapper {
    public id: number = 0;
    public transaction: any = null;
    constructor(id: number, transaction: any) {
        this.id = id;
        this.transaction = transaction;
    }
}

export class MetamaskConnector {
    private html: string = ``;
    private app: Express | null = null;
    private readonly port: number = 8989;
    private readonly transactions: Map<number, string> = new Map<number, string>();
    private txId: number = 1;

    server: http.Server;

    constructor(defaultServerPort: number = 8989) {
        console.log("MetamaskConnector: Initializing...")

        if (hre.network == null) {
            throw new Error("Invalid configuration");
        }
        console.log("network", hre.network);

        this.port = defaultServerPort;

        this.app = express();
        this.app.use(bodyParser.urlencoded({ extended: false }));
        this.app.use(bodyParser.json());

        this.app.get('/send-tx', (req: Request, res: Response) => {
            res.send(this.html);
        });

        this.app.post('/tx-result', (req: Request, res: Response) => {
            this.transactions.set(req.body.txId, req.body.txHash);
            res.sendStatus(200);
        });

        this.server = this.app.listen(this.port, () => {
            console.log(`Server is running at http://localhost:${this.port}`);
        });
    }

    public close() {
        this.server.close();
    }

    // TODO: Add support for getSigner from metamask
    public async getSigner(): Promise<SignerWithAddress> {
        return new Promise<SignerWithAddress>((resolve, reject) => {
            ethers.getSigners().then((signers: any[]) => {
                let signer = signers[0];
                //                let f = signer.sendTransaction;
                let x = async (transaction: any) => {
                    //                    let out = await f.call(signer, transaction);
                    //                    console.log(out);
                    //                    return Promise.resolve(out);
                    // let txId = this.txId++;
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
                            console.log('Transaction');
                            let result = (signer.provider! as any)._wrapTransactionResponse(tx);
                            console.log(result);
                            clearInterval(checkInterval); // Important to clear interval after the operation is done
                            resolve(result);
                        }, 5000); // Repeat every 5 seconds
                    });
                }
                signer.sendTransaction = x as any;
                resolve(signer);
            });
        });
    }

    public async sendTransactions(transactions: any[]): Promise<void> {
        var txs = transactions.map((transaction) => {
            return new TransactionWrapper(this.txId++, transaction);
        })

        console.log(txs);

        const eta = new Eta({ views: path.join(__dirname, "templates") });
        this.html = eta.render("./t.eta", {
            transactions: txs,
            network: hre.network.name,
            chainId: '0x' + hre.network.config.chainId!.toString(16),
            serverPort: this.port
        });

        open(`http://localhost:${this.port}/send-tx`, { app: { name: 'google chrome' } });
    }

}
