const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const Web3 = require('web3');

const provider = waffle.provider;

describe("NFTMarket", async function () {
    // it("Should buy and stake tokens", async function () {
    //     //get dummy addresses
    //     const addresses = await ethers.getSigners();

    //     // create and deploy birdie contract
    //     const Birdie = await ethers.getContractFactory("Birdie");
    //     const birdie = await Birdie.deploy();
    //     await birdie.deployed();


    //     //////////////// BUYING ////////////////

    //     // get token price
    //     let tokenPrice = await birdie.getCheapestTokenPrice();

    //     //buy nft
    //     let numBuying = 4;
    //     for (let i = 0; i < 4; i++) {
    //         await birdie.connect(addresses[1]).buyToken({ value: tokenPrice });
    //     }

    //     // get balance of purchaser
    //     let balance = await birdie.connect(addresses[1]).getUserBalance();
    //     expect(balance).to.equal(numBuying);


    //     //////////////// STAKING ////////////////

    //     // stake tokens
    //     let numStaking = 3;
    //     await birdie.connect(addresses[1]).stakeTokens(numStaking);

    //     balance = await birdie.connect(addresses[1]).getUserBalance();
    //     expect(balance).to.equal(numBuying - numStaking);

    //     balance = await birdie.connect(addresses[1]).getUserStakedBalance();
    //     expect(balance).to.equal(numStaking);

    //     // unstake tokens
    //     let numUnstaking = 2;
    //     await birdie.connect(addresses[1]).unstakeTokens(numUnstaking);

    //     balance = await birdie.connect(addresses[1]).getUserBalance();
    //     expect(balance).to.equal(numBuying - (numStaking - numUnstaking));

    //     balance = await birdie.connect(addresses[1]).getUserStakedBalance();
    //     expect(balance).to.equal(numStaking - numUnstaking);
    // });

    // it("Should sell and withdraw sale of tokens", async function () {
    //     //get dummy addresses
    //     const addresses = await ethers.getSigners();

    //     // create and deploy birdie contract
    //     const Birdie = await ethers.getContractFactory("Birdie");
    //     const birdie = await Birdie.deploy();
    //     await birdie.deployed();


    //     //////////////// BUYING ////////////////

    //     // get token price
    //     let tokenPrice = await birdie.getCheapestTokenPrice();

    //     //buy token
    //     let numBuying = 50;
    //     for (let i = 0; i < numBuying; i++) {
    //         await birdie.connect(addresses[1]).buyToken({ value: tokenPrice });
    //     }

    //     // get balance of purchaser
    //     let owned = await birdie.connect(addresses[1]).getUserBalance();
    //     expect(owned).to.equal(numBuying);


    //     //////////////// SELLING ////////////////

    //     // sell tokens
    //     let numSelling = 2;
    //     await birdie.connect(addresses[1]).sellTokens(numSelling, 90000);

    //     // check new balance
    //     let balance = await birdie.connect(addresses[1]).getUserBalance();
    //     expect(balance).to.equal(owned - numSelling);

    //     // withdraw token sale
    //     await birdie.connect(addresses[1]).stopTokenSale(numSelling);
    //     balance = await birdie.connect(addresses[1]).getUserBalance();
    //     expect(balance).to.equal(owned);
    // });

    it("Should buy tokens from other users", async function () {
        //get dummy addresses
        const addresses = await ethers.getSigners();

        // create and deploy birdie contract
        const Birdie = await ethers.getContractFactory("Birdie");
        const birdie = await Birdie.deploy();
        await birdie.deployed();


        //////////////// BUYING ////////////////

        // get token price
        let tokenPrice = await birdie.getCheapestTokenPrice();

        //buy the max - 1 amount of tokens
        let numBuying = 29;
        for (let i = 0; i < numBuying; i++) {
            await birdie.connect(addresses[1]).buyToken({ value: tokenPrice });
        }

        // sell token for large amount
        let sellingPrice = Web3.utils.toWei('100', 'ether');
        await birdie.connect(addresses[1]).sellTokens(1, sellingPrice);

        // cheapest token should be new minted token
        let price = await birdie.connect(addresses[2]).getCheapestTokenPrice();
        expect(price.toString()).to.equal(tokenPrice.toString());

        // buy one more token
        await birdie.connect(addresses[1]).buyToken({ value: tokenPrice });

        // stop token sale
        await birdie.connect(addresses[1]).stopTokenSale(1);

        // cheapest token should 0 i.e. DNE
        price = await birdie.connect(addresses[2]).getCheapestTokenPrice();
        expect(price.toString()).to.equal('0');


        //////////////// BUYING FROM SELLERS ////////////////

        // sell some tokens
        sellingPrice = Web3.utils.toWei('100', 'ether');
        await birdie.connect(addresses[1]).sellTokens(1, sellingPrice);
        sellingPrice = Web3.utils.toWei('1', 'ether');
        await birdie.connect(addresses[1]).sellTokens(1, sellingPrice);

        // buy a token
        price = await birdie.connect(addresses[2]).getCheapestTokenPrice();
        expect(price.toString()).to.equal(sellingPrice);
        await birdie.connect(addresses[2]).buyToken({ value: price });

        price = await birdie.connect(addresses[2]).getCheapestTokenPrice();
        expect(price.toString()).to.equal(Web3.utils.toWei('100', 'ether'));
    });
});