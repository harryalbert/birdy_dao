const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const Web3 = require('web3');

// await birdie.connect(addresses[1]).
// balance = await birdie.provider.getBalance(addresses[1].address);
describe("better tests", async function () {
	it("single actor buys tokens", async function () {
		const [addresses, birdie] = await setup();

		// get price of token
		let basePrice = await birdie.connect(addresses[1]).getTokenPrice();
		let price = await birdie.connect(addresses[1]).getCheapestTokenPrice();
		expect(basePrice.toString()).to.equal(price.toString());

		// tokens to mint at start of contract
		let toMint = await birdie.connect(addresses[1]).getTokensLeftToMint();

		// purchase 1 token
		await birdie.connect(addresses[1]).buyToken({ value: price });
		let balance = await birdie.connect(addresses[1]).getUserBalance();
		expect(balance).to.equal(1);

		let tokensLeft = await birdie.connect(addresses[1]).getTokensLeftToMint();
		expect(tokensLeft).to.equal(toMint - 1);

		// purchase multiple tokens
		for (let i = 0; i < tokensLeft; i++) {
			await birdie.connect(addresses[1]).buyToken({ value: price });
		}
		balance = await birdie.connect(addresses[1]).getUserBalance();
		expect(balance).to.equal(toMint);

		tokensLeft = await birdie.connect(addresses[1]).getTokensLeftToMint();
		expect(tokensLeft).to.equal(0);

		// check which tokens user owns
		let owned = await birdie.connect(addresses[1]).getUserTokens();
		expect(owned.length).to.equal(balance);

		// user can't purchase any more tokens
		try {
			await birdie.connect(addresses[1]).buyToken({ value: price });

			// should never get here
			console.log("bought more tokens than exist");
			expect(true).to.equal(false);
		} catch (e) { }
	});
});

async function setup() {
	const addresses = await ethers.getSigners();

	// create and deploy birdie contract
	const Birdie = await ethers.getContractFactory("Birdie");
	const birdie = await Birdie.deploy();
	await birdie.deployed();

	return [addresses, birdie];
}