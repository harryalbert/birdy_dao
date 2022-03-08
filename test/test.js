const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket", async function () {
    it("Should buy and stake tokens", async function () {
        //get dummy addresses
        const addresses = await ethers.getSigners();

        // create and deploy birdie contract
        const Birdie = await ethers.getContractFactory("Birdie");
        const birdie = await Birdie.deploy();
        await birdie.deployed();

        // get token price
        let tokenPrice = await birdie.getTokenPrice();

        //buy nft
        let numBuying = 4;
        await birdie.connect(addresses[1]).buyTokens(numBuying, { value: tokenPrice.mul(numBuying).toString() });

        // get balance of purchaser
        let balance = await birdie.connect(addresses[1]).getUserBalance();
        expect(balance).to.equal(numBuying);

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
});