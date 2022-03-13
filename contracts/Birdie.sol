// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "hardhat/console.sol";

contract Birdie is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter tokenCount;

    uint256 tokensToMint;
    uint256 tokenPrice;
    address payable owner;

    struct ForSale {
        uint256 id;
        uint256 price;
        address seller;
    }

    //staking info
    mapping(address => uint256) private stakedBalance; // balance of each staker
    mapping(uint256 => address) private stakedOwner; // owner of each staked coin

    mapping(address => uint256[]) private stakers; // BIRD stakers

    mapping(uint256 => ForSale) private forSale; // token id => price, seller
    mapping(address => uint256) private sellers; // address => how many tokens are currently being sold

    // only owner can call method
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    constructor() ERC721("Birdie", "BRD") {
        owner = payable(msg.sender);

        tokensToMint = 1000;
        tokenPrice = 10 ether;
        tokenCount.increment();
    }

    ///////////////// VIEW METHODS /////////////////
    /*
     * returns current price of cheapest token
     */
    function getTokenPrice() public view returns (uint256) {
        return tokenPrice;
    }

    function getTokenPrices(uint256 n) public view returns (uint256[] memory) {
        require(n < 1000, "that's too many tokens");

        // array of lowest prices
        uint256[] memory prices = new uint256[](n);

        uint256 biggest = 0;
        uint256 biggestIndex = 0;
        for (uint256 i = 0; i < tokenCount.current(); i++) {
            // check if token is for sale
            ForSale memory sale = forSale[i];
            if (sale.price == 0) continue;

            // any empty spots in prices array
            if (biggest == 0) {
                prices[biggestIndex] = sale.price;
                biggestIndex++;

                // get smallest value when there are no more empty values
                if (biggestIndex >= n) {
                    biggestIndex = getBiggest(prices);
                    biggest = prices[biggestIndex];
                }
            } else if (sale.price < biggest) {
                prices[biggestIndex] = sale.price;

                biggestIndex = getBiggest(prices);
                biggest = prices[biggestIndex];
            }
        }

        // fill in any zero values with minted tokens
        uint256 mintsLeft = tokensToMint;
        for (uint256 i = 0; i < prices.length; i++) {
            if (mintsLeft <= 0) break;
            if (prices[i] == 0) {
                prices[i] = tokenPrice;
                mintsLeft--;
            }
        }

        // check that none of the sales are higher than
        // the base token price (if any tokens are left to mint)
        while (mintsLeft > 0) {
            biggestIndex = getBiggest(prices);
            biggest = prices[biggestIndex];

            if (biggest > tokenPrice) {
                prices[biggestIndex] = tokenPrice;
                mintsLeft--;
            } else break;
        }

        return prices;
    }

    /*
     * get index of biggest value in array
     */
    function getBiggest(uint256[] memory arr) public pure returns (uint256) {
        require(arr.length > 0, "input array cannot be empty");

        uint256 maxIndex = 0;
        for (uint256 i = 1; i < arr.length; i++) {
            if (arr[i] > arr[maxIndex]) maxIndex = i;
        }

        return maxIndex;
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

        if (tokensToMint < 1 || min < tokenPrice) return min;
        return tokenPrice;
    }

    /*
     * returns index of the cheapest token
     */
    function getCheapestToken() public view returns (uint256) {
        //get index of cheapest token for sale
        uint256 min = 0;
        uint256 minIndex = 0;
        for (uint256 i = 0; i < tokenCount.current(); i++) {
            if (forSale[i].price == 0) continue;
            if (min == 0 || forSale[i].price < min) {
                min = forSale[i].price;
                minIndex = i;
            }
        }

        if (tokensToMint < 1 || min < tokenPrice) return minIndex;
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
        uint256 balance = getUserStakedBalance();
        uint256[] memory owned = new uint256[](balance);

        uint256 cIndex = 0;
        for (uint256 i = 0; i < tokenCount.current(); i++) {
            if (stakedOwner[i] == msg.sender) {
                owned[cIndex] = i;
                cIndex++;
            }
        }

        return owned;
    }

    /*
     * get tokens that user currently has for sale
     */
    function getUserSelling() public view returns (ForSale[] memory) {
        ForSale[] memory tokens = new ForSale[](sellers[msg.sender]);
        uint256 numFound = 0;
        for (uint256 i = 0; i < tokenCount.current(); i++) {
            if (forSale[i].seller == msg.sender) {
                tokens[numFound] = forSale[i];
                numFound++;

                if (numFound >= sellers[msg.sender]) return tokens;
            }
        }

        //code should never get here
        assert(false);
        return tokens;
    }

    ///////////////// PURCHASE METHODS /////////////////

    /*
     * mints and sells a token to a buyer
     * pre: buyer sends tokenPrice
     *      tokensToMint > 0
     * post: mints new token and transfers ownersip to msg.sender
     */
    function buyTokens(uint256 numTokens) public payable {
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
    function sellTokens(uint256 n, uint256 price) public {
        require(n > 0, "You must sell at least 1 token");
        require(
            balanceOf(msg.sender) >= n,
            "You cannot sell more tokens than you own"
        );
        require(price > 0, "You cannot sell a token for free");

        uint256[] memory owned = getUserTokens();
        for (uint256 i = 0; i < n; i++) {
            forSale[owned[i]].id = owned[i];
            forSale[owned[i]].price = price;
            forSale[owned[i]].seller = msg.sender;

            // don't want any double selling, so have to burn token to prevent this
            _burn(owned[i]);
        }

        sellers[msg.sender] += n;
    }

    /*
     * take a token off the market
     * this can only be done if the token hasn't been sold yet
     */
    function stopTokenSale(uint256 n) public {
        require(n > 0, "You must take at least 1 token off the market");

        require(
            n <= sellers[msg.sender],
            "You cannot sell more tokens than you own"
        );

        uint256 numFound = 0;
        for (uint256 i = 0; i < tokenCount.current(); i++) {
            if (forSale[i].seller == msg.sender) {
                _safeMint(msg.sender, forSale[i].id);

                forSale[i].id = 0;
                forSale[i].price = 0;
                forSale[i].seller = address(0);

                numFound++;
                if (numFound >= sellers[msg.sender]) break;
            }
        }

        sellers[msg.sender] -= n;
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
