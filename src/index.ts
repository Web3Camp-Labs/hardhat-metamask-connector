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
    private signerAddr = "";

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

        this.app.post('/signer-result', (req: Request, res: Response) => {
            this.signerAddr = req.body.address;
            console.log(`Set Signer Success, signer address: ${this.signerAddr}`);
            res.sendStatus(200);
        });

        this.app.post('/tx-result', (req: Request, res: Response) => {
            this.transactions.set(req.body.id, req.body.hash);
            console.log(`Send transaction success: ${req.body.id}, tx hash: ${ req.body.hash}`);
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
                            let result = (signer.provider! as any)._wrapTransactionResponse(tx);
                            clearInterval(checkInterval); // Important to clear interval after the operation is done
                            resolve(result);
                        }, 5000); // Repeat every 5 seconds
                    });
                }
                signer.sendTransaction = x as any;

                let y = async () => {
                    console.log("Going to get signer");
                    if (this.signerAddr !== "") {
                        console.log('Signer found: ', this.signerAddr);
                        return this.signerAddr;
                    }

                    return new Promise(async (resolve, reject) =>{
                        let checkInterval = setInterval(async () => {
                            console.log("Checking for signer...");
                            if (this.signerAddr !== "") {
                                clearInterval(checkInterval); // Important to clear interval after the operation is done
                                resolve(this.signerAddr);
                            }
                        }, 1000); // Repeat every 1 seconds

                        // use same html page with transaction sending
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

        const eta = new Eta({ views: path.join(__dirname, "templates") });
        this.html = eta.render("./t.eta", {
            transactions: txs,
            network: hre.network.name,
            // `31337` is the chainId of default `localhost` network. Reference: https://hardhat.org/hardhat-network/docs/reference#chainid
            // `localhost` network's chainId is not explicitly configured in `hardhat.config.ts`
            // so we use `31337` as default value
            chainId: "0x" + (hre.network.config.chainId ?? 31337).toString(16),
            serverPort: this.port
        });

        open(`http://localhost:${this.port}/send-tx`, { app: { name: 'google chrome' } });
    }

}
