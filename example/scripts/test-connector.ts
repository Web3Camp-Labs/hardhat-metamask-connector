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
  console.log("   Address:", await signer.getAddress());

  // Get the balance
  const balance = await signer.provider!.getBalance(await signer.getAddress());
  console.log("   Balance:", ethers.formatEther(balance), "ETH");

  // Get network info
  const network = await signer.provider!.getNetwork();
  console.log("   Network:", network.name);
  console.log("   ChainId:", network.chainId.toString());

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
