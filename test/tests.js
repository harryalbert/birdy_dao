const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const Web3 = require('web3');

// await birdie.connect(addresses[1]).
// balance = await birdie.provider.getBalance(addresses[1].address);
describe("better tests", async function () {
	it("buys tokens from one account", async function () {
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
		} catch (e) { }
	});

	it("buys tokens using multipe accounts", async function () {
		const [addresses, birdie] = await setup();

		let price = await birdie.connect(addresses[1]).getCheapestTokenPrice();

		// buy tokens from 3 account
		for (let i = 0; i < 7; i++) {
			await birdie.connect(addresses[1]).buyToken({ value: price });
			await birdie.connect(addresses[2]).buyToken({ value: price });
			await birdie.connect(addresses[3]).buyToken({ value: price });
			await birdie.connect(addresses[4]).buyToken({ value: price });
		}

		// buy more tokens for last account
		await birdie.connect(addresses[4]).buyToken({ value: price });
		await birdie.connect(addresses[4]).buyToken({ value: price });

		// check balance of each account
		for (let i = 1; i <= 3; i++) {
			// check user balance and owned tokens
			let balance = await birdie.connect(addresses[i]).getUserBalance();
			let tokens = await birdie.connect(addresses[i]).getUserTokens();

			expect(balance).to.equal(7);
			expect(tokens.length).to.equal(balance);
		}

		// check balance of last account
		let balance = await birdie.connect(addresses[4]).getUserBalance();
		let tokens = await birdie.connect(addresses[4]).getUserTokens();

		expect(balance).to.equal(9);
		expect(tokens.length).to.equal(balance);
	});

	it("sells (and buys) tokens", async function () {
		const [addresses, birdie] = await setup();

		let a = addresses[2];
		let b = addresses[3];

		// buy five tokens
		let price = await birdie.connect(addresses[1]).getCheapestTokenPrice();
		for (let i = 0; i < 6; i++) {
			await birdie.connect(addresses[1]).buyToken({ value: price });
			await birdie.connect(addresses[2]).buyToken({ value: price });
		}

		let balanceOne = await birdie.provider.getBalance(addresses[1].address);
		let balanceTwo = await birdie.provider.getBalance(addresses[2].address);
		console.log(balanceOne);
		console.log(balanceTwo);

		// put a few tokens up for sale
		let basePrice = Web3.utils.toWei('10', 'ether');
		let lowPrice = Web3.utils.toWei('2', 'ether');
		let mediumPrice = Web3.utils.toWei('6', 'ether');
		let highPrice = Web3.utils.toWei('12', 'ether');
		await birdie.connect(addresses[1]).sellTokens(2, lowPrice);
		await birdie.connect(addresses[1]).sellTokens(1, mediumPrice);
		await birdie.connect(addresses[1]).sellTokens(2, highPrice);

		balanceOne = await birdie.provider.getBalance(addresses[1].address);
		balanceTwo = await birdie.provider.getBalance(addresses[2].address);
		console.log(balanceOne);
		console.log(balanceTwo);

		price = await birdie.connect(addresses[1]).getCheapestTokenPrice();
		expect(price).to.equal(lowPrice);

		let balance = await birdie.connect(addresses[1]).getUserBalance();
		expect(balance).to.equal(1);


		// buy cheap tokens
		await birdie.connect(addresses[2]).buyToken({ value: price });
		balance = await birdie.connect(addresses[2]).getUserBalance();
		expect(balance).to.equal(7);

		price = await birdie.connect(addresses[1]).getCheapestTokenPrice();
		expect(price).to.equal(lowPrice);
		await birdie.connect(addresses[2]).buyToken({ value: price });

		// buy medium tokens
		price = await birdie.connect(addresses[1]).getCheapestTokenPrice();
		expect(price).to.equal(mediumPrice);
		await birdie.connect(addresses[2]).buyToken({ value: price });

		balance = await birdie.connect(addresses[2]).getUserBalance();
		expect(balance).to.equal(9)

		// check remaining price
		price = await birdie.connect(addresses[1]).getCheapestTokenPrice();
		expect(price).to.equal(basePrice);
		await birdie.connect(addresses[2]).buyToken({ value: price });


		// check eth balances
		balanceOne = await birdie.provider.getBalance(addresses[1].address);
		balanceTwo = await birdie.provider.getBalance(addresses[2].address);
		console.log(balanceOne);
		console.log(balanceTwo);
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