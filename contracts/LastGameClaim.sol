// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title LastGameClaim
 * @dev Allows Farcaster users to claim USDC once every 24 hours based on their FID
 */
contract LastGameClaim is Ownable, ReentrancyGuard {
    // USDC contract on Base: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
    IERC20 public immutable usdc;
    
    // Claim amount: 0.05 USDC (USDC has 6 decimals)
    uint256 public claimAmount = 50000; // 0.05 * 10^6
    
    // Cooldown period: 24 hours
    uint256 public cooldownPeriod = 24 hours;
    
    // Mapping from FID to last claim timestamp
    mapping(uint256 => uint256) public lastClaimTime;
    
    // Mapping from FID to total claims
    mapping(uint256 => uint256) public totalClaims;
    
    // Total claims across all users
    uint256 public globalTotalClaims;
    
    // Total USDC distributed
    uint256 public totalDistributed;
    
    // Events
    event Claimed(uint256 indexed fid, address indexed recipient, uint256 amount, uint256 timestamp);
    event ClaimAmountUpdated(uint256 oldAmount, uint256 newAmount);
    event CooldownPeriodUpdated(uint256 oldPeriod, uint256 newPeriod);
    event FundsWithdrawn(address indexed to, uint256 amount);
    event FundsDeposited(address indexed from, uint256 amount);
    
    /**
     * @dev Constructor
     * @param _usdc Address of USDC token contract on Base
     */
    constructor(address _usdc) {
        require(_usdc != address(0), "Invalid USDC address");
        usdc = IERC20(_usdc);
    }
    
    /**
     * @dev Claim USDC tokens for a given FID
     * @param fid The Farcaster ID of the user
     * @param recipient The address to receive the USDC
     */
    function claim(uint256 fid, address recipient) external nonReentrant {
        require(fid > 0, "Invalid FID");
        require(recipient != address(0), "Invalid recipient address");
        
        // Check cooldown
        uint256 lastClaim = lastClaimTime[fid];
        require(
            block.timestamp >= lastClaim + cooldownPeriod,
            "Cooldown period not elapsed"
        );
        
        // Check contract has enough USDC
        uint256 contractBalance = usdc.balanceOf(address(this));
        require(contractBalance >= claimAmount, "Insufficient contract balance");
        
        // Update state before transfer (CEI pattern)
        lastClaimTime[fid] = block.timestamp;
        totalClaims[fid]++;
        globalTotalClaims++;
        totalDistributed += claimAmount;
        
        // Transfer USDC to recipient
        require(usdc.transfer(recipient, claimAmount), "USDC transfer failed");
        
        emit Claimed(fid, recipient, claimAmount, block.timestamp);
    }
    
    /**
     * @dev Check if a FID can claim (cooldown elapsed)
     * @param fid The Farcaster ID to check
     * @return bool Whether the FID can claim
     */
    function canClaim(uint256 fid) external view returns (bool) {
        uint256 lastClaim = lastClaimTime[fid];
        return block.timestamp >= lastClaim + cooldownPeriod;
    }
    
    /**
     * @dev Get time remaining until next claim for a FID
     * @param fid The Farcaster ID to check
     * @return uint256 Seconds remaining (0 if can claim now)
     */
    function timeUntilNextClaim(uint256 fid) external view returns (uint256) {
        uint256 lastClaim = lastClaimTime[fid];
        uint256 nextClaimTime = lastClaim + cooldownPeriod;
        
        if (block.timestamp >= nextClaimTime) {
            return 0;
        }
        
        return nextClaimTime - block.timestamp;
    }
    
    /**
     * @dev Get claim info for a FID
     * @param fid The Farcaster ID to check
     * @return lastClaim Timestamp of last claim
     * @return claims Total number of claims
     * @return canClaimNow Whether they can claim right now
     * @return timeRemaining Seconds until next claim
     */
    function getClaimInfo(uint256 fid) external view returns (
        uint256 lastClaim,
        uint256 claims,
        bool canClaimNow,
        uint256 timeRemaining
    ) {
        lastClaim = lastClaimTime[fid];
        claims = totalClaims[fid];
        
        uint256 nextClaimTime = lastClaim + cooldownPeriod;
        canClaimNow = block.timestamp >= nextClaimTime;
        
        if (canClaimNow) {
            timeRemaining = 0;
        } else {
            timeRemaining = nextClaimTime - block.timestamp;
        }
    }
    
    /**
     * @dev Update the claim amount (owner only)
     * @param newAmount New claim amount (in USDC base units, 6 decimals)
     */
    function updateClaimAmount(uint256 newAmount) external onlyOwner {
        require(newAmount > 0, "Amount must be greater than 0");
        uint256 oldAmount = claimAmount;
        claimAmount = newAmount;
        emit ClaimAmountUpdated(oldAmount, newAmount);
    }
    
    /**
     * @dev Update the cooldown period (owner only)
     * @param newPeriod New cooldown period in seconds
     */
    function updateCooldownPeriod(uint256 newPeriod) external onlyOwner {
        require(newPeriod > 0, "Period must be greater than 0");
        uint256 oldPeriod = cooldownPeriod;
        cooldownPeriod = newPeriod;
        emit CooldownPeriodUpdated(oldPeriod, newPeriod);
    }
    
    /**
     * @dev Deposit USDC to fund claims
     * @param amount Amount of USDC to deposit (must approve first)
     */
    function depositFunds(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        emit FundsDeposited(msg.sender, amount);
    }
    
    /**
     * @dev Withdraw USDC from contract (owner only, emergency)
     * @param to Address to send USDC to
     * @param amount Amount to withdraw (0 = all)
     */
    function withdrawFunds(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        
        uint256 balance = usdc.balanceOf(address(this));
        uint256 withdrawAmount = amount == 0 ? balance : amount;
        
        require(withdrawAmount <= balance, "Insufficient balance");
        require(usdc.transfer(to, withdrawAmount), "Transfer failed");
        
        emit FundsWithdrawn(to, withdrawAmount);
    }
    
    /**
     * @dev Get contract's USDC balance
     * @return uint256 Current USDC balance
     */
    function getContractBalance() external view returns (uint256) {
        return usdc.balanceOf(address(this));
    }
    
    /**
     * @dev Estimate how many more claims can be made with current balance
     * @return uint256 Number of claims remaining
     */
    function claimsRemaining() external view returns (uint256) {
        uint256 balance = usdc.balanceOf(address(this));
        return balance / claimAmount;
    }
}
