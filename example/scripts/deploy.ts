import { ethers } from "hardhat";

import { MetamaskConnector } from "../../dist/index";

async function main() {

  let connector = new MetamaskConnector();

  let signer = await connector.getSigner();
  console.log("Signer Address: ", await signer.getAddress())

  // Deploy SimpleToken with 1 million initial supply
  const tokenName = "Test Token";
  const tokenSymbol = "TEST";
  const initialSupply = 1000000; // 1 million tokens

  const token = await ethers.deployContract("SimpleToken", [tokenName, tokenSymbol, initialSupply], {
    signer: signer,
  });

  await token.waitForDeployment();

  console.log(
    `SimpleToken "${tokenName}" (${tokenSymbol}) with ${initialSupply} total supply deployed to ${token.target}`
  );

  connector.close();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
