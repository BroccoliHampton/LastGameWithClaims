function createRedirectFrame(imageUrl, targetUrl) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="fc:frame:button:1" content="Launch Game" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${targetUrl}" />
</head>
<body></body>
</html>`
}

function createPaymentFrame(imageUrl, publicUrl) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="fc:frame:button:1" content="Pay $0.25 USDC to Play" />
    <meta property="fc:frame:button:1:action" content="tx" />
    <meta property="fc:frame:button:1:target" content="${publicUrl}/api/transaction" />
    <meta property="fc:frame:post_url" content="${publicUrl}/api/verify" />
</head>
<body></body>
</html>`
}

function createRetryFrame(imageUrl, publicUrl) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="fc:frame:button:1" content="Retry Payment" />
    <meta property="fc:frame:button:1:action" content="post" />
    <meta property="fc:frame:post_url" content="${publicUrl}/api/index" />
</head>
<body></body>
</html>`
}

// New claim-specific helper functions

function createClaimFrame(imageUrl, publicUrl) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="fc:frame:button:1" content="Claim 0.05 USDC" />
    <meta property="fc:frame:button:1:action" content="tx" />
    <meta property="fc:frame:button:1:target" content="${publicUrl}/api/claim-transaction" />
    <meta property="fc:frame:post_url" content="${publicUrl}/api/verify-claim" />
</head>
<body></body>
</html>`
}

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

function createClaimCooldownFrame(imageUrl, publicUrl, timeRemaining) {
  return `<!DOCTYPE html>
<html>
<head>
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${imageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="og:image" content="${imageUrl}" />
    <meta property="fc:frame:button:1" content="Play Again" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${publicUrl}" />
</head>
<body>
  <p>You must wait ${timeRemaining} before claiming again.</p>
</body>
</html>`
}

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

module.exports = {
  // Original helpers
  createRedirectFrame,
  createPaymentFrame,
  createRetryFrame,
  
  // New claim helpers
  createClaimFrame,
  createClaimSuccessFrame,
  createClaimCooldownFrame,
  createClaimRetryFrame,
}
