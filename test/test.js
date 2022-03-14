const { expect } = require("chai");
const { ethers } = require("hardhat");
const BigNumber = require("bignumber.js");
const Web3 = require('web3');

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
        for (let i = 0; i < 4; i++) {
            await birdie.connect(addresses[1]).buyToken({ value: tokenPrice });
        }

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

        //buy token
        let numBuying = 50;
        for (let i = 0; i < numBuying; i++) {
            await birdie.connect(addresses[1]).buyToken({ value: tokenPrice });
        }

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
        //buy token
        let numBuying = 50;
        for (let i = 0; i < numBuying; i++) {
            await birdie.connect(addresses[1]).buyToken({ value: tokenPrice });
        }

        // get balance of purchaser
        let owned = await birdie.connect(addresses[1]).getUserBalance();
        expect(owned).to.equal(numBuying);


        //////////////// SELLING AT VARIETY OF PRICES ////////////////

        // // sell some tokens
        await birdie.connect(addresses[1]).sellTokens(3, Web3.utils.toWei('1', 'ether'));
        await birdie.connect(addresses[1]).sellTokens(2, Web3.utils.toWei('2.5', 'ether'));

    });
});