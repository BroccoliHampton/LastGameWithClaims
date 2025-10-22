const { NeynarAPIClient } = require("@neynar/nodejs-sdk")
const { ethers } = require("ethers")

// Initialize clients
let neynarClient
let provider

// Claim contract ABI for view functions
const claimAbi = [
  "function canClaim(uint256 fid) external view returns (bool)",
  "function timeUntilNextClaim(uint256 fid) external view returns (uint256)",
  "function getClaimInfo(uint256 fid) external view returns (uint256 lastClaim, uint256 claims, bool canClaimNow, uint256 timeRemaining)"
]

module.exports = async function handler(req, res) {
  console.log("[check-eligibility] /api/check-claim-eligibility called")

  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  try {
    // Validate environment variables
    const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY
    const BASE_PROVIDER_URL = process.env.BASE_PROVIDER_URL
    const CLAIM_CONTRACT_ADDRESS = process.env.CLAIM_CONTRACT_ADDRESS

    if (!NEYNAR_API_KEY || !BASE_PROVIDER_URL || !CLAIM_CONTRACT_ADDRESS) {
      return res.status(500).json({ error: "Missing required configuration" })
    }

    // Initialize clients if not already done
    if (!neynarClient) {
      neynarClient = new NeynarAPIClient(NEYNAR_API_KEY)
    }
    if (!provider) {
      provider = new ethers.providers.JsonRpcProvider(BASE_PROVIDER_URL)
    }

    // Validate the frame action to get user's FID
    if (!req.body?.trustedData?.messageBytes) {
      return res.status(400).json({ error: "Invalid request: missing trustedData" })
    }

    const validation = await neynarClient.validateFrameAction(req.body.trustedData.messageBytes)

    if (!validation?.action?.interactor?.fid) {
      return res.status(400).json({ error: "Could not determine Farcaster ID" })
    }

    const fid = validation.action.interactor.fid
    console.log("[check-eligibility] Checking eligibility for FID:", fid)

    // Create contract instance
    const claimContract = new ethers.Contract(CLAIM_CONTRACT_ADDRESS, claimAbi, provider)

    // Get claim info from contract
    const claimInfo = await claimContract.getClaimInfo(fid)
    
    const lastClaimTimestamp = claimInfo.lastClaim.toNumber()
    const totalClaims = claimInfo.claims.toNumber()
    const canClaimNow = claimInfo.canClaimNow
    const timeRemaining = claimInfo.timeRemaining.toNumber()

    console.log("[check-eligibility] Claim info:")
    console.log("[check-eligibility]   Last claim:", lastClaimTimestamp)
    console.log("[check-eligibility]   Total claims:", totalClaims)
    console.log("[check-eligibility]   Can claim now:", canClaimNow)
    console.log("[check-eligibility]   Time remaining:", timeRemaining, "seconds")

    // Format time remaining for human readability
    let timeRemainingFormatted = "0 seconds"
    if (timeRemaining > 0) {
      const hours = Math.floor(timeRemaining / 3600)
      const minutes = Math.floor((timeRemaining % 3600) / 60)
      const seconds = timeRemaining % 60
      
      if (hours > 0) {
        timeRemainingFormatted = `${hours}h ${minutes}m ${seconds}s`
      } else if (minutes > 0) {
        timeRemainingFormatted = `${minutes}m ${seconds}s`
      } else {
        timeRemainingFormatted = `${seconds}s`
      }
    }

    // Return eligibility data
    res.status(200).json({
      fid,
      eligible: canClaimNow,
      lastClaimTimestamp,
      totalClaims,
      timeRemaining,
      timeRemainingFormatted,
      message: canClaimNow 
        ? "You can claim now!" 
        : `Please wait ${timeRemainingFormatted} before claiming again.`
    })

  } catch (error) {
    console.error("[check-eligibility] Error:", error)
    res.status(500).json({ 
      error: `Server Error: ${error.message}`,
      eligible: false 
    })
  }
}
