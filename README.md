# hardhat-metamask-connector

Hardhat Metamask Connector is a tool to connect your metamask with your hardhat development environment, and let you say bye-bye to exposing your mnemonic or private key.

# Install

`npm install @web3camp/hardhat-metamask-connector` or `yarn @web3camp/hardhat-metamask-connector`

```
let connector = new MetamaskConnector();
let signer = await connector.getSigner();
let signerAddr = await signer.getAddress();
```

# Test

There is a sample test hardhat project, just run `npm install` and `npx hardhat run scripts/deploy.ts` to make test.

# The idea

![](./hardhat-metamask-connector.jpg)

# To be continue

- [ ] Inject signer to ethers  
- [ ] Optimize the launch of the browser  
- [ ] Optimize the webpage  

## Special thanks
[hardhat-metamask-client](https://github.com/deusfinance/Hardhat-metamask-client)
