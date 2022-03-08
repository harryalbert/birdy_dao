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

    struct Seller {
        address adr; // address of buyer/seler
        uint256 cost; // cost of token
        uint256 amount; // amount buying/selling
    }

    mapping(address => uint256[]) private stakers; // BIRD stakers

    Seller[] sellers;

    // only owner can call method
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor() ERC721("Birdy", "BRDY") {
        owner = payable(msg.sender);

        tokensToMint = 10;
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
     * returns staked token count of msg.sender
     */
    function getUserStakedBalance() public view returns (uint256) {
        return stakers[msg.sender].length;
    }

    /*
     * returns list of all tokens owned by msg.sender
     */
    function getUserTokens() public view returns (uint256[] memory) {
        uint256 balance = balanceOf(msg.sender);
        uint256[] memory owned = new uint256[](balance);

        uint256 cIndex = 0;

        for (uint256 i = 0; i < tokenCount.current(); i++) {
            if (_exists(i) && ownerOf(i) == msg.sender) {
                owned[cIndex] = i;
                cIndex++;
            }
        }

        return owned;
    }

    /*
     * get user's staked tokens
     */
    function getUserStakedTokens() public view returns (uint256[] memory) {
        return stakers[msg.sender];
    }

    /*
     * returns current price of a token
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
    function buyTokens(uint256 numTokens) public payable nonReentrant {
        require(
            (tokensToMint - numTokens) >= 0,
            "we can't mint that amount of tokens right now"
        );
        require(
            msg.value == (tokenPrice * numTokens),
            "You must send the correct amount to purchase a token"
        );

        // will probably change later, but for now just giving all the money to the contract owner
        owner.transfer(msg.value);

        // create and transfer tokens to owner
        for (uint256 i = 0; i < numTokens; i++) {
            // mint token for owner
            uint256 tokenId = tokenCount.current();
            _safeMint(msg.sender, tokenId);

            tokenCount.increment();
        }
    }

    /*
     * put a token up for sale
     */
    function sellTokens(uint256 n, uint256 price) public nonReentrant {
        require(n > 0, "You must sell at least 1 token");
        require(balanceOf(msg.sender) >= n);
    }

    /*
     * Stake token in contract
     */
    function stakeTokens(uint256 n) public nonReentrant {
        require(n > 0, "You must stake at least 1 token");

        uint256 numOwned = balanceOf(msg.sender);
        require(numOwned >= n, "You can't stake more tokens than you own");

        // convert n tokens to staking pool
        uint256[] memory owned = getUserTokens();
        uint256 numTokens = owned.length;
        for (uint256 i = 0; i < n; i++) {
            uint256 tokenId = owned[i];

            _burn(tokenId); // remove token from account
            stakers[msg.sender].push(tokenId); // add token to 'staking pool'
        }
    }

    /*
     * unstake tokens from contract
     */
    function unstakeTokens(uint256 n) public nonReentrant {
        require(n > 0, "You must unstake at least 1 token");
        require(
            n >= stakers[msg.sender].length,
            "You can't unstake more tokens than you have staked"
        );

        // remint n tokens from staking pool
        uint256[] memory staked = stakers[msg.sender];
        uint256 numTokens = staked.length;
        for (uint256 i = 0; i < n; i++) {
            uint256 tokenId = staked[i];

            _safeMint(msg.sender, tokenId); // remove token from account
        }

        // create new memberBalance w/o staked tokens
        delete stakers[msg.sender];
        for (uint256 i = n; i < numTokens; i++) {
            stakers[msg.sender].push(staked[i]);
        }
    }
}
