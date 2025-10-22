module.exports = async function handler(req, res) {
  console.log("[claim] /api/claim-frame called - Method:", req.method)

  try {
    const CLAIM_IMAGE_URL = process.env.CLAIM_IMAGE_URL || "https://i.imgur.com/claim-image.png"
    const PUBLIC_URL = process.env.PUBLIC_URL || "https://last-game-kappa.vercel.app"

    console.log("[claim] Claim frame loaded")

    // This is the claim frame with transaction button
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Claim Reward</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
    }
    .container {
      text-align: center;
      padding: 2rem;
      max-width: 400px;
    }
    h1 {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
    p {
      font-size: 1.1rem;
      margin-bottom: 2rem;
      opacity: 0.9;
    }
    button {
      background: white;
      color: #667eea;
      border: none;
      padding: 1rem 2rem;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      pointer-events: auto;
      position: relative;
      z-index: 10;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.3);
    }
    button:active {
      transform: translateY(0);
    }
    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
    .status {
      margin-top: 1rem;
      font-size: 0.9rem;
      min-height: 20px;
    }
    .error {
      color: #ffcccc;
    }
    .success {
      color: #ccffcc;
    }
    .loading {
      color: #ffffcc;
    }
    .info {
      color: #cce5ff;
    }
  </style>
  
  <!-- Farcaster Frame Meta Tags for Transaction -->
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${CLAIM_IMAGE_URL}" />
  <meta property="fc:frame:image:aspect_ratio" content="1:1" />
  <meta property="fc:frame:button:1" content="Claim 0.05 USDC" />
  <meta property="fc:frame:button:1:action" content="tx" />
  <meta property="fc:frame:button:1:target" content="${PUBLIC_URL}/api/claim-transaction" />
  <meta property="fc:frame:post_url" content="${PUBLIC_URL}/api/verify-claim" />
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="Claim Your Reward" />
  <meta property="og:image" content="${CLAIM_IMAGE_URL}" />
</head>
<body>
  <div class="container">
    <h1>🎮 Game Over!</h1>
    <p>Claim your 0.05 USDC reward</p>
    <button id="claimButton">Claim 0.05 USDC</button>
    <div id="status" class="status"></div>
  </div>

  <script type="module">
    console.log('[claim] Claim frame script starting')
    
    const claimButton = document.getElementById('claimButton')
    const statusDiv = document.getElementById('status')
    
    claimButton.addEventListener('click', async () => {
      console.log('[claim] Button clicked!')
      statusDiv.textContent = 'Initializing claim...'
      statusDiv.className = 'status loading'
      
      try {
        claimButton.disabled = true
        
        console.log('[claim] Importing Farcaster SDK')
        const { default: sdk } = await import('https://esm.sh/@farcaster/miniapp-sdk')
        
        console.log('[claim] SDK imported, calling ready()')
        await sdk.actions.ready()
        
        console.log('[claim] Getting context for FID')
        const context = await sdk.context
        const fid = context.user?.fid
        
        if (!fid) {
          throw new Error('Could not get Farcaster ID')
        }
        
        console.log('[claim] User FID:', fid)
        statusDiv.textContent = 'Preparing claim transaction...'
        
        // The actual transaction will be handled by the frame
        // This is just for UI feedback
        statusDiv.textContent = 'Please confirm in your wallet...'
        
      } catch (error) {
        console.error('[claim] Claim error:', error)
        statusDiv.textContent = 'Error: ' + (error.message || 'Claim failed')
        statusDiv.className = 'status error'
        claimButton.disabled = false
      }
    })
    
    console.log('[claim] Click handler attached')
    statusDiv.textContent = 'Ready to claim'
  </script>
</body>
</html>`

    console.log("[claim] Claim frame HTML generated")

    res.setHeader("Content-Type", "text/html; charset=utf-8")
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate")
    res.status(200).send(html)

    console.log("[claim] Claim frame response sent")
  } catch (e) {
    console.error("[claim] Error in claim frame:", e.message)
    res.status(500).send(`Error: ${e.message}`)
  }
}
