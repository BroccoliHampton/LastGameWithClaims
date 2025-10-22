const { NeynarAPIClient } = require("@neynar/nodejs-sdk")
const { ethers } = require("ethers")

// Claim contract ABI
const claimAbi = ["function claim(uint256 fid, address recipient)"]
const claimInterface = new ethers.utils.Interface(claimAbi)

// Initialize Neynar client
let neynarClient

module.exports = async function handler(req, res) {
  console.log("[claim-tx] /api/claim-transaction called")
  console.log("[claim-tx] Request method:", req.method)

  // Only accept POST requests
  if (req.method !== "POST") {
    console.log("[claim-tx] ERROR: Method not allowed:", req.method)
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // Validate environment variables
    const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY
    const CLAIM_CONTRACT_ADDRESS = process.env.CLAIM_CONTRACT_ADDRESS

    console.log("[claim-tx] NEYNAR_API_KEY:", NEYNAR_API_KEY ? "Set" : "Missing")
    console.log("[claim-tx] CLAIM_CONTRACT_ADDRESS:", CLAIM_CONTRACT_ADDRESS ? "Set" : "Missing")

    if (!NEYNAR_API_KEY || !CLAIM_CONTRACT_ADDRESS) {
      console.log("[claim-tx] ERROR: Missing required environment variables")
      return res.status(500).json({ error: "Missing required configuration" })
    }

    // Initialize Neynar client if not already done
    if (!neynarClient) {
      neynarClient = new NeynarAPIClient(NEYNAR_API_KEY)
    }

    // Validate the frame action to get user's FID
    if (!req.body?.trustedData?.messageBytes) {
      console.log("[claim-tx] ERROR: Missing trustedData")
      return res.status(400).json({ error: "Invalid request: missing trustedData" })
    }

    console.log("[claim-tx] Validating frame action...")
    const validation = await neynarClient.validateFrameAction(req.body.trustedData.messageBytes)

    if (!validation?.action?.interactor) {
      console.log("[claim-tx] ERROR: Invalid frame action validation")
      return res.status(400).json({ error: "Invalid frame action" })
    }

    // Get user's FID
    const fid = validation.action.interactor.fid
    console.log("[claim-tx] User FID:", fid)

    if (!fid) {
      console.log("[claim-tx] ERROR: Could not extract FID from validation")
      return res.status(400).json({ error: "Could not determine Farcaster ID" })
    }

    // Get user's FID - THIS IS VERIFIED BY NEYNAR
    const fid = validation.action.interactor.fid
    console.log("[claim-tx] User FID:", fid, "(verified by Neynar)")

    if (!fid) {
      console.log("[claim-tx] ERROR: Could not extract FID from validation")
      return res.status(400).json({ error: "Could not determine Farcaster ID" })
    }

    // CRITICAL: Get the recipient address
    // In Farcaster Frames, validation.action.address should contain the connected wallet
    let recipient = validation.action.address
    
    console.log("[claim-tx] Checking for connected wallet...")
    console.log("[claim-tx] validation.action.address:", recipient)
    
    // Fallback to verified addresses if action.address not available
    if (!recipient) {
      console.log("[claim-tx] No action.address, trying verified addresses...")
      if (validation.action.interactor.verified_addresses?.eth_addresses?.length > 0) {
        recipient = validation.action.interactor.verified_addresses.eth_addresses[0]
        console.log("[claim-tx] Using first verified address:", recipient)
      } else if (validation.action.interactor.custody_address) {
        recipient = validation.action.interactor.custody_address
        console.log("[claim-tx] Using custody address:", recipient)
      }
    }

    if (!recipient) {
      console.log("[claim-tx] ERROR: No address found")
      console.log("[claim-tx] Full interactor data:", JSON.stringify(validation.action.interactor, null, 2))
      return res.status(400).json({ 
        error: "No Ethereum address found. Please connect a wallet to your Farcaster account." 
      })
    }

    console.log("[claim-tx] ✅ FID:", fid, "→ Recipient:", recipient)

    // Encode the claim function call
    console.log("[claim-tx] Encoding claim function call...")
    console.log("[claim-tx] Parameters: fid=", fid, "recipient=", recipient)
    
    const calldata = claimInterface.encodeFunctionData("claim", [fid, recipient])
    console.log("[claim-tx] Generated calldata:", calldata)

    // Build the transaction response
    const response = {
      chainId: "eip155:8453", // Base mainnet
      method: "eth_sendTransaction",
      params: {
        abi: claimAbi,
        to: CLAIM_CONTRACT_ADDRESS,
        data: calldata,
        value: "0", // No ETH being sent, just contract call
      },
    }

    console.log("[claim-tx] Sending transaction response:", JSON.stringify(response))
    res.status(200).json(response)
  } catch (error) {
    console.error("[claim-tx] Error in /api/claim-transaction:", error)
    res.status(500).json({ error: `Server Error: ${error.message}` })
  }
}
