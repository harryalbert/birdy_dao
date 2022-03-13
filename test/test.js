const { expect } = require("chai");
const { ethers } = require("hardhat");
const BigNumber = require("bignumber.js");

describe("NFTMarket", async function () {
    it("Should buy and stake tokens", async function () {
        //get dummy addresses
        const addresses = await ethers.getSigners();

        // create and deploy birdie contract
        const Birdie = await ethers.getContractFactory("Birdie");
        const birdie = await Birdie.deploy();
        await birdie.deployed();


        //////////////// BUYING ////////////////

        // get token price
        let tokenPrice = await birdie.getTokenPrice();

        //buy nft
        let numBuying = 4;
        await birdie.connect(addresses[1]).buyTokens(numBuying, { value: tokenPrice.mul(numBuying).toString() });

        // get balance of purchaser
        let balance = await birdie.connect(addresses[1]).getUserBalance();
        expect(balance).to.equal(numBuying);


        //////////////// STAKING ////////////////

        // stake tokens
        let numStaking = 3;
        await birdie.connect(addresses[1]).stakeTokens(numStaking);

        balance = await birdie.connect(addresses[1]).getUserBalance();
        expect(balance).to.equal(numBuying - numStaking);

        balance = await birdie.connect(addresses[1]).getUserStakedBalance();
        expect(balance).to.equal(numStaking);

        // unstake tokens
        let numUnstaking = 2;
        await birdie.connect(addresses[1]).unstakeTokens(numUnstaking);

        balance = await birdie.connect(addresses[1]).getUserBalance();
        expect(balance).to.equal(numBuying - (numStaking - numUnstaking));

        balance = await birdie.connect(addresses[1]).getUserStakedBalance();
        expect(balance).to.equal(numStaking - numUnstaking);
    });

    it("Should sell and withdraw sale of tokens", async function () {
        //get dummy addresses
        const addresses = await ethers.getSigners();

        // create and deploy birdie contract
        const Birdie = await ethers.getContractFactory("Birdie");
        const birdie = await Birdie.deploy();
        await birdie.deployed();


        //////////////// BUYING ////////////////

        // get token price
        let tokenPrice = await birdie.getTokenPrice();

        //buy nft
        let numBuying = 50;
        await birdie.connect(addresses[1]).buyTokens(numBuying, { value: tokenPrice.mul(numBuying).toString() });

        // get balance of purchaser
        let owned = await birdie.connect(addresses[1]).getUserBalance();
        expect(owned).to.equal(numBuying);


        //////////////// SELLING ////////////////

        // sell tokens
        let numSelling = 2;
        await birdie.connect(addresses[1]).sellTokens(numSelling, 90000);

        // check new balance
        let balance = await birdie.connect(addresses[1]).getUserBalance();
        expect(balance).to.equal(owned - numSelling);

        // withdraw token sale
        await birdie.connect(addresses[1]).stopTokenSale(numSelling);
        balance = await birdie.connect(addresses[1]).getUserBalance();
        expect(balance).to.equal(owned);
    });

    it("Should buy tokens from other users", async function () {
        //get dummy addresses
        const addresses = await ethers.getSigners();

        // create and deploy birdie contract
        const Birdie = await ethers.getContractFactory("Birdie");
        const birdie = await Birdie.deploy();
        await birdie.deployed();


        //////////////// BUYING ////////////////

        // get token price
        let tokenPrice = await birdie.getTokenPrice();

        //buy nft
        let numBuying = 50;
        await birdie.connect(addresses[1]).buyTokens(numBuying, { value: tokenPrice.mul(numBuying).toString() });

        // get balance of purchaser
        let owned = await birdie.connect(addresses[1]).getUserBalance();
        expect(owned).to.equal(numBuying);


        //////////////// SELLING AT VARIETY OF PRICES ////////////////

        // // sell some tokens
        // await birdie.connect(addresses[1]).sellTokens(2, 85000);
        // await birdie.connect(addresses[1]).sellTokens(8, 90000);
        // await birdie.connect(addresses[1]).sellTokens(3, 80000);
        // await birdie.connect(addresses[1]).sellTokens(4, 85000);

        // // check that we get the correct token price
        // let prices = await birdie.connect(addresses[1]).getTokenPrices(10);
        // let price = 0;
        // for (let i = 0; i < prices.length; i++) price += prices[i].toNumber();
        // expect(price).to.equal(85000 * 6 + 80000 * 3 + 90000);


        // check that we get the correct token price
        let prices = await birdie.connect(addresses[1]).getTokenPrices(10);
        console.log(prices);
        // expect(price).to.equal(tokenPrice.multiply(10));
    });
});