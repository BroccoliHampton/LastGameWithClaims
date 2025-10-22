const { ethers } = require("ethers")

const usdcAbi = ["function transfer(address to, uint256 amount)"]
const usdcInterface = new ethers.utils.Interface(usdcAbi)
const USDC_CONTRACT_ADDRESS_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bda02913"

module.exports = async function handler(req, res) {
  console.log("[v0] /api/transaction called")
  console.log("[v0] Request method:", req.method)

  // Only accept POST requests
  if (req.method !== "POST") {
    console.log("[v0] ERROR: Method not allowed:", req.method)
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    const YOUR_WALLET_ADDRESS = process.env.YOUR_WALLET_ADDRESS

    console.log("[v0] YOUR_WALLET_ADDRESS:", YOUR_WALLET_ADDRESS ? "Set" : "Missing")

    if (!YOUR_WALLET_ADDRESS) {
      console.log("[v0] ERROR: Missing wallet address")
      return res.status(500).json({ error: "Missing wallet address configuration" })
    }

    const amount = ethers.BigNumber.from("250000") // 0.25 USDC (6 decimals)
    const calldata = usdcInterface.encodeFunctionData("transfer", [YOUR_WALLET_ADDRESS, amount])

    console.log("[v0] Generated calldata:", calldata)

    const response = {
      chainId: "eip155:8453",
      method: "eth_sendTransaction",
      params: {
        abi: usdcAbi,
        to: USDC_CONTRACT_ADDRESS_BASE,
        data: calldata,
        value: "0",
      },
    }

    console.log("[v0] Sending transaction response:", JSON.stringify(response))
    res.status(200).json(response)
  } catch (error) {
    console.error("[v0] Error in /api/transaction:", error)
    res.status(500).json({ error: `Server Error: ${error.message}` })
  }
}
