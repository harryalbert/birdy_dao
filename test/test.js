const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFTMarket", async function () {
    it("Should buy and stake tokens", async function () {
        //get dummy addresses
        const addresses = await ethers.getSigners();

        // create and deploy birdy contract
        const Birdy = await ethers.getContractFactory("Birdy");
        const birdy = await Birdy.deploy();
        await birdy.deployed();

        // get token price
        let tokenPrice = await birdy.getTokenPrice();

        //buy nft
        let numBuying = 4;
        await birdy.connect(addresses[1]).buyTokens(numBuying, { value: tokenPrice.mul(numBuying).toString() });

        // get balance of purchaser
        let balance = await birdy.connect(addresses[1]).getUserBalance();
        expect(balance).to.equal(numBuying);

        // stake tokens
        let numStaking = 3;
        await birdy.connect(addresses[1]).stakeTokens(numStaking);

        balance = await birdy.connect(addresses[1]).getUserBalance();
        expect(balance).to.equal(numBuying - numStaking);
        
        balance = await birdy.connect(addresses[1]).getUserStakedBalance();
        expect(balance).to.equal(numStaking);

        // unstake tokens
        await birdy.connect(addresses[1]).unstakeTokens(numStaking);

        balance = await birdy.connect(addresses[1]).getUserBalance();
        expect(balance).to.equal(numBuying);
        
        balance = await birdy.connect(addresses[1]).getUserStakedBalance();
        expect(balance).to.equal(0);
    });
});