// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract Birdie is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter tokenCount; // # of tokens that have been minted

    uint256 tokensToMint; // tokens left to mint
    uint256 tokenPrice; // price of a new (minted) token
    address payable owner; // creator of contract (Harry Albert)

    // token for sale
    struct ForSale {
        uint256 id;
        uint256 price;
        address seller;
    }

    //staking info
    mapping(address => uint256) private stakedBalance; // balance of each staker
    mapping(uint256 => address) private stakedOwner; // owner of each staked coin

    mapping(uint256 => ForSale) private forSale; // token id => price, seller
    mapping(address => uint256) private sellers; // address => how many tokens are currently being sold

    // only owner can call method
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor() ERC721("Birdie", "BRD") {
        owner = payable(msg.sender);

        tokensToMint = 30;
        tokenPrice = 10 ether;
        tokenCount.increment();
    }

    ///////////////// VIEW METHODS /////////////////
    /*
     * returns tokens left to mint
     */
    function getTokensLeftToMint() public view returns (uint256) {
        return tokensToMint;
    }

    /*
     * returns current price of cheapest token
     */
    function getTokenPrice() public view returns (uint256) {
        return tokenPrice;
    }

    /*
     * returns current price of cheapest token
     */
    function getCheapestTokenPrice() public view returns (uint256) {
        // get cheapest token for sale
        uint256 min = 0;
        for (uint256 i = 0; i < tokenCount.current(); i++) {
            if (forSale[i].price == 0) continue;
            if (min == 0 || forSale[i].price < min) min = forSale[i].price;
        }

        if (tokensToMint == 0) {
            // no more tokens to mint
            return min;
        } else if (min != 0 && min <= tokenPrice) {
            // token for sale is cheaper than a minted token
            return min;
        } else {
            // new minted token is cheapest
            return tokenPrice;
        }
    }

    /*
     * returns index of the cheapest token
     */
    function getCheapestTokenForSale() public view returns (uint256) {
        //get index of cheapest token for sale
        uint256 min = 0;
        uint256 minIndex = 0;
        for (uint256 i = 0; i < tokenCount.current(); i++) {
            if (forSale[i].price <= 0) continue;
            if (min == 0 || forSale[i].price < min) {
                min = forSale[i].price;
                minIndex = i;
            }
        }

        // if no more tokens to mint or token for sale is cheaper than minted token
        if (tokensToMint < 1 || min <= tokenPrice) return minIndex;
        return 0;
    }

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
        return stakedBalance[msg.sender];
    }

    /*
     * returns list of all tokens owned by msg.sender
     */
    function getUserTokens() public view returns (uint256[] memory) {
        uint256 balance = balanceOf(msg.sender);
        uint256[] memory owned = new uint256[](balance);

        if (balance <= 0) return owned; // user has no tokens

        uint256 cIndex = 0;
        for (uint256 i = 0; i < tokenCount.current(); i++) {
            //user owns current token
            if (_exists(i) && ownerOf(i) == msg.sender) {
                owned[cIndex] = i;
                cIndex++;

                // got all of user's tokens
                if (cIndex >= balance) break;
            }
        }

        return owned;
    }

    /*
     * get user's staked tokens
     */
    function getUserStakedTokens() public view returns (uint256[] memory) {
        uint256 balance = getUserStakedBalance();
        uint256[] memory owned = new uint256[](balance);

        if (balance <= 0) return owned; // user has no tokens staked

        uint256 cIndex = 0;
        for (uint256 i = 0; i < tokenCount.current(); i++) {
            if (stakedOwner[i] == msg.sender) {
                owned[cIndex] = i;
                cIndex++;

                // got all of user's staked tokens
                if (cIndex >= balance) break;
            }
        }

        return owned;
    }

    /*
     * get tokens that user currently has for sale
     */
    function getUserSelling() public view returns (ForSale[] memory) {
        uint256 sellingBalance = sellers[msg.sender];
        ForSale[] memory tokens = new ForSale[](sellingBalance);

        if (sellingBalance <= 0) return tokens; // user has no tokens for sale

        uint256 numFound = 0;
        for (uint256 i = 0; i < tokenCount.current(); i++) {
            if (forSale[i].seller == msg.sender) {
                tokens[numFound] = forSale[i];
                numFound++;

                // found all tokens for sale
                if (numFound >= sellingBalance) break;
            }
        }

        return tokens;
    }

    ///////////////// PURCHASE METHODS /////////////////

    /*
     * mints and sells a token to a buyer
     * pre: buyer sends tokenPrice
     *      tokensToMint > 0
     * post: mints new token and transfers ownersip to msg.sender
     */
    function buyToken() public payable {
        // get cheapest token to purchase
        uint256 cheapestId = getCheapestTokenForSale();
        ForSale memory cheapestToken = forSale[cheapestId];

        // get price of token
        uint256 price;
        if (cheapestToken.id == 0) {
            require(tokensToMint > 0, "There are no more tokens for sale");

            price = tokenPrice;
        } else price = cheapestToken.price;

        require(
            msg.value == price,
            "You must send the correct amount to purchase a token"
        );

        if (cheapestToken.id == 0) {
            // mint and transfer tokens to owner
            uint256 tokenId = tokenCount.current();
            _safeMint(msg.sender, tokenId);

            tokenCount.increment();
            tokensToMint--;

            // will probably change later, but for now just giving all the money to the contract owner
            owner.transfer(msg.value);
        } else {
            // mint new token for user
            console.log(msg.value);
            _safeMint(msg.sender, cheapestToken.id);
            payable(cheapestToken.seller).transfer(msg.value);

            // take token off of for sale list
            sellers[cheapestToken.seller] -= 1;
            forSale[cheapestId].id = 0;
            forSale[cheapestId].price = 0;
            forSale[cheapestId].seller = address(0);
        }
    }

    /*
     * put a token up for sale
     */
    function sellTokens(uint256 n, uint256 price) public {
        require(n > 0, "You must sell at least 1 token");
        require(price > 0, "You cannot sell a token for free");
        require(
            balanceOf(msg.sender) >= n,
            "You cannot sell more tokens than you own"
        );

        uint256[] memory owned = getUserTokens();
        for (uint256 i = 0; i < n; i++) {
            uint256 id = owned[i];

            // put token up for sale
            forSale[id].id = id;
            forSale[id].price = price;
            forSale[id].seller = msg.sender;

            // don't want any double selling, so have to burn token to prevent this
            _burn(id);
        }

        // increment how many tokens msg.sender is selling
        sellers[msg.sender] += n;
    }

    /*
     * take a token off the market
     * this can only be done if the token hasn't been sold yet
     */
    function stopTokenSale(uint256 id) public {
        // seller must be currently selling at least one token
        require(
            sellers[msg.sender] > 0,
            "You must take at least 1 token off the market"
        );

        // check that seller owns token (and token exists)
        ForSale memory token = forSale[id];
        require(
            token.seller == msg.sender && token.seller != address(0),
            "You cannot sell a token you do not own"
        );

        // mint token for seller
        _safeMint(msg.sender, token.id);

        // taken token off the market
        forSale[id].id = 0;
        forSale[id].price = 0;
        forSale[id].seller = address(0);

        // decrement number of tokens msg.sender is selling
        sellers[msg.sender] -= 1;
    }

    ///////////////// STAKING METHODS /////////////////
    /*
     * Stake token in contract
     */
    function stakeTokens(uint256 n) public {
        require(n > 0, "You must stake at least 1 token");
        require(
            balanceOf(msg.sender) >= n,
            "You can't stake more tokens than you own"
        );

        // convert n tokens to staking pool
        uint256[] memory owned = getUserTokens();
        for (uint256 i = 0; i < n; i++) {
            uint256 tokenId = owned[i];

            _burn(tokenId); // remove token from account
            stakedBalance[msg.sender]++;
            stakedOwner[tokenId] = msg.sender;
        }
    }

    /*
     * unstake tokens from contract
     */
    function unstakeTokens(uint256 n) public {
        require(n > 0, "You must unstake at least 1 token");
        require(
            n <= stakedBalance[msg.sender],
            "You can't unstake more tokens than you have staked"
        );

        // remint n tokens from staking pool
        uint256 minted = 0;
        for (uint256 i = 0; i < tokenCount.current(); i++) {
            // user owns token
            if (stakedOwner[i] == msg.sender) {
                _safeMint(msg.sender, i);
                stakedOwner[i] = address(0);
                minted++;

                if (minted >= n) break;
            }
        }

        stakedBalance[msg.sender] -= minted;
    }
}
