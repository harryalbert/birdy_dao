const hre = require("hardhat");

async function main() {
	const Birdy = await hre.ethers.getContractFactory("Birdy");
	const birdy = await Birdy.deploy();
	await birdy.deployed();
	console.log("birdy deployed to:", birdy.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
