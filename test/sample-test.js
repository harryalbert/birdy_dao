const { expect } = require("chai");
const { ethers } = require("hardhat");
const Web3 = require("web3");

describe("NFTMarket", async function () {
  it("Should create and execute token sales", async function () {
    //get dummy addresses
    const addresses = await ethers.getSigners();
    const owner = addresses[0];

    // create and deploy birdy contract
    const Birdy = await ethers.getContractFactory("Birdy");
    const birdy = await Birdy.deploy();
    await birdy.deployed();

    // get token price
    let tokenPrice = await birdy.getTokenPrice();
    tokenPrice = tokenPrice.toString();

    //buy nft
    await birdy.connect(addresses[1]).buyToken({ value: tokenPrice });
    await birdy.connect(addresses[1]).buyToken({ value: tokenPrice });

    // get balance of purchaser
    let balance = await birdy.connect(addresses[1]).getUserTokenCount();
    expect(balance).to.equal(2);

    
  });
});