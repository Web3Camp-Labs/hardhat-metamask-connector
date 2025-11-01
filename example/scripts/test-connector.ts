import { ethers } from "hardhat";
import { MetamaskConnector } from "../../dist/index";

async function main() {
  console.log("\n🚀 Testing Hardhat MetaMask Connector with Hono + JSX\n");

  // Initialize the connector
  console.log("1. Initializing MetamaskConnector...");
  let connector = new MetamaskConnector();

  console.log("\n2. Waiting for signer from MetaMask...");
  console.log("   → A browser window should open");
  console.log("   → Click 'Connect to MetaMask'");
  console.log("   → Click 'Set Signer'\n");

  let signer = await connector.getSigner();

  console.log("\n✅ Signer obtained!");
  const signerAddress = await signer.getAddress();
  console.log("   Address:", signerAddress);

  // Get the balance
  let balance = await ethers.provider.getBalance(signerAddress);
  console.log("   Balance:", ethers.formatEther(balance), "ETH");

  // Get network info
  const network = await ethers.provider.getNetwork();
  console.log("   Network:", network.name);
  console.log("   ChainId:", network.chainId.toString());

  // If balance is 0, fund the account
  if (balance === 0n) {
    console.log("\n⚠️  Balance is 0, funding account with 1 ETH from default signer...");
    const [defaultSigner] = await ethers.getSigners();
    const tx = await defaultSigner.sendTransaction({
      to: signerAddress,
      value: ethers.parseEther("1.0")
    });
    await tx.wait();
    balance = await ethers.provider.getBalance(signerAddress);
    console.log("   ✓ New Balance:", ethers.formatEther(balance), "ETH");
  }

  // Deploy SimpleToken
  console.log("\n3. Deploying SimpleToken contract...");
  console.log("   → Approve the transaction in MetaMask");

  const SimpleToken = await ethers.getContractFactory("SimpleToken");
  const deployTx = await SimpleToken.connect(signer).deploy("Test Token", "TEST", 1000000);

  console.log("   ⏳ Waiting for deployment transaction...");
  const receipt = await deployTx.deploymentTransaction()?.wait();
  console.log("   ✓ Deployment confirmed in block:", receipt?.blockNumber);

  console.log("\n✅ SimpleToken deployed!");
  console.log("   Address:", await deployTx.getAddress());
  console.log("   Name:", await deployTx.name());
  console.log("   Symbol:", await deployTx.symbol());
  console.log("   Total Supply:", ethers.formatEther(await deployTx.totalSupply()));

  console.log("\n🎉 Test completed successfully!");
  console.log("   The Hono + JSX implementation is working!\n");

  // Close the server
  connector.close();
  process.exit(0);
}

main().catch((error) => {
  console.error("\n❌ Test failed:", error);
  process.exitCode = 1;
});
