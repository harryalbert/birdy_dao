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

    /*
    * mints and sells a token to a buyer
    * pre: buyer sends tokenPrice
    *      tokensToMint > 0
    * post: mints new token and transfers ownersip to msg.sender
    */
    function sellToken() public payable nonReentrant {
        require(tokensToMint > 0, "There are no more tokens to mint right now");
        require(
            msg.value == tokenPrice,
            "You must send the correct amount to purchase a token"
        );

        // will probably change later, but for now just giving all the money to the contract owner
        owner.transfer(msg.value);

        // mint token for owner
        _safeMint(msg.sender, tokenCount.current());
        tokenCount.increment();
    }

    /*
    * returns token count of msg.sender
    */
    function userTokenCount() public view returns(uint256) {
        return balanceOf(msg.sender);
    }
}
