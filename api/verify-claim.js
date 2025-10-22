const { NeynarAPIClient } = require("@neynar/nodejs-sdk")
const { ethers } = require("ethers")
const { createRedirectFrame, createRetryFrame } = require("../lib/frame-helpers")

// Initialize clients outside handler for reuse
let neynarClient
let provider

module.exports = async function handler(req, res) {
  // Only accept POST requests
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed")
  }

  try {
    // Validate environment variables
    const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY
    const BASE_PROVIDER_URL = process.env.BASE_PROVIDER_URL
    const CLAIM_SUCCESS_IMAGE_URL = process.env.CLAIM_SUCCESS_IMAGE_URL || process.env.SUCCESS_IMAGE_URL
    const CLAIM_FAILED_IMAGE_URL = process.env.CLAIM_FAILED_IMAGE_URL || process.env.FAILED_IMAGE_URL
    const GAME_URL = process.env.GAME_URL
    const PUBLIC_URL = process.env.PUBLIC_URL

    if (!NEYNAR_API_KEY || !BASE_PROVIDER_URL || !CLAIM_SUCCESS_IMAGE_URL || !CLAIM_FAILED_IMAGE_URL || !GAME_URL || !PUBLIC_URL) {
      console.error("[verify-claim] Missing required environment variables")
      return res.status(500).send("Missing required environment variables")
    }

    // Initialize clients if not already done
    if (!neynarClient) {
      neynarClient = new NeynarAPIClient(NEYNAR_API_KEY)
    }
    if (!provider) {
      provider = new ethers.providers.JsonRpcProvider(BASE_PROVIDER_URL)
    }

    // Validate the frame action
    if (!req.body?.trustedData?.messageBytes) {
      console.error("[verify-claim] Missing trustedData")
      return res.status(400).send("Invalid request: missing trustedData")
    }

    console.log("[verify-claim] Validating frame action...")
    const validation = await neynarClient.validateFrameAction(req.body.trustedData.messageBytes)

    // Check if transaction hash exists
    if (!validation?.action?.transaction?.hash) {
      console.log("[verify-claim] No transaction hash found")
      return res.send(createClaimRetryFrame(CLAIM_FAILED_IMAGE_URL, PUBLIC_URL))
    }

    const txHash = validation.action.transaction.hash
    const fid = validation.action.interactor.fid
    console.log("[verify-claim] Verifying claim transaction:", txHash)
    console.log("[verify-claim] User FID:", fid)

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(txHash)

    // Check if transaction was successful
    if (receipt && receipt.status === 1) {
      console.log("[verify-claim] Claim verified successfully for FID:", fid)
      
      // Optional: Parse logs to verify the Claimed event was emitted
      // This adds extra validation that the claim actually happened
      try {
        const claimInterface = new ethers.utils.Interface([
          "event Claimed(uint256 indexed fid, address indexed recipient, uint256 amount, uint256 timestamp)"
        ])
        
        const claimedEvent = receipt.logs.find(log => {
          try {
            const parsed = claimInterface.parseLog(log)
            return parsed.name === "Claimed"
          } catch {
            return false
          }
        })
        
        if (claimedEvent) {
          const parsed = claimInterface.parseLog(claimedEvent)
          console.log("[verify-claim] Claimed event found:")
          console.log("[verify-claim]   FID:", parsed.args.fid.toString())
          console.log("[verify-claim]   Recipient:", parsed.args.recipient)
          console.log("[verify-claim]   Amount:", parsed.args.amount.toString())
          console.log("[verify-claim]   Timestamp:", parsed.args.timestamp.toString())
        }
      } catch (e) {
        console.log("[verify-claim] Could not parse claim event (non-critical):", e.message)
      }
      
      res.setHeader("Content-Type", "text/html")
      res.status(200).send(createClaimSuccessFrame(CLAIM_SUCCESS_IMAGE_URL, GAME_URL))
    } else {
      console.log("[verify-claim] Claim failed or pending for FID:", fid)
      res.setHeader("Content-Type", "text/html")
      res.status(200).send(createClaimRetryFrame(CLAIM_FAILED_IMAGE_URL, PUBLIC_URL))
    }
  } catch (e) {
    console.error("[verify-claim] Error in /api/verify-claim:", e)
    res.status(500).send(`Server Error: ${e.message}`)
  }
}

// Helper function for successful claim
function createClaimSuccessFrame(imageUrl, gameUrl) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="fc:frame:button:1" content="Play Again" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${gameUrl}" />
</head>
<body></body>
</html>`
}

// Helper function for failed/retry claim
function createClaimRetryFrame(imageUrl, publicUrl) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="fc:frame:button:1" content="Retry Claim" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:post_url" content="${publicUrl}/api/claim-frame" />
</head>
<body></body>
</html>`
}
