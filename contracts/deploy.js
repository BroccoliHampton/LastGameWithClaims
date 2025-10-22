// Script to deploy LastGameClaim contract
// Run with: npx hardhat run scripts/deploy.js --network base

const hre = require("hardhat");

async function main() {
  console.log("Deploying LastGameClaim contract to Base...");

  // USDC address on Base
  const USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

  // Deploy the contract
  const LastGameClaim = await hre.ethers.getContractFactory("LastGameClaim");
  const contract = await LastGameClaim.deploy(USDC_BASE);

  await contract.deployed();

  console.log("✅ LastGameClaim deployed to:", contract.address);
  console.log("USDC Address:", USDC_BASE);
  console.log("Claim Amount:", await contract.claimAmount(), "(50000 = 0.05 USDC)");
  console.log("Cooldown Period:", await contract.cooldownPeriod(), "seconds (86400 = 24 hours)");

  // Wait for a few block confirmations
  console.log("\nWaiting for block confirmations...");
  await contract.deployTransaction.wait(5);

  // Verify on BaseScan
  console.log("\nVerifying contract on BaseScan...");
  try {
    await hre.run("verify:verify", {
      address: contract.address,
      constructorArguments: [USDC_BASE],
    });
    console.log("✅ Contract verified on BaseScan");
  } catch (error) {
    console.log("⚠️  Verification failed:", error.message);
  }

  console.log("\n📝 Next steps:");
  console.log("1. Fund the contract with USDC:");
  console.log(`   - Approve USDC spending for contract: ${contract.address}`);
  console.log(`   - Call depositFunds() or send USDC directly`);
  console.log("2. Add contract address to your .env file:");
  console.log(`   CLAIM_CONTRACT_ADDRESS=${contract.address}`);
  console.log("3. Update your backend to call the claim function");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
