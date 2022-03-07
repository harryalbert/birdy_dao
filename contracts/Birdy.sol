// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract Birdy is ERC721, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter tokenCount;

    uint256 tokensToMint;
    uint256 tokenPrice;
    address payable owner;

    mapping(address => uint256) private memberBalances; // owners of any BIRD
    mapping(address => uint256[]) private stakers; // BIRD stakers

    // only owner can call method
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor() ERC721("Birdy", "BRDY") {
        owner = payable(msg.sender);

        tokensToMint = 2;
        tokenPrice = 10 ether;
    }

    ///////////////// VIEW METHODS /////////////////
    /*
     * returns token count of msg.sender
     */
    function getUserBalance() public view returns (uint256) {
        return balanceOf(msg.sender);
    }

    /*
     *  returns current price of a token
     */
    function getTokenPrice() public view returns (uint256) {
        return tokenPrice;
    }

    ///////////////// purchase methods /////////////////

    /*
     * mints and sells a token to a buyer
     * pre: buyer sends tokenPrice
     *      tokensToMint > 0
     * post: mints new token and transfers ownersip to msg.sender
     */
    function buyToken(uint256 numTokens) public payable nonReentrant {
        require(
            tokensToMint > numTokens,
            "we can't mint that amount of tokens right now"
        );
        require(
            msg.value == (tokenPrice * numTokens),
            "You must send the correct amount to purchase a token"
        );

        // will probably change later, but for now just giving all the money to the contract owner
        owner.transfer(msg.value);

        // mint token for owner
        uint256 tokenId = tokenCount.current();
        _safeMint(msg.sender, tokenId);
        memberBalances[msg.sender] = memberBalances[msg.sender] + 1;

        tokenCount.increment();
    }

    /*
     * Stake token in contract
     */
    function stakeToken(uint256 numStaking) public nonReentrant {
        require(numStaking > 0, "You must stake at least 1 token");

        uint256 numOwned = balanceOf(msg.sender);
        require(
            numOwned >= numStaking,
            "You can't stake more tokens than you own"
        );
    }
}
