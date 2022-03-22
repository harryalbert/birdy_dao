const hre = require("hardhat");

async function main() {
	const Birdie = await hre.ethers.getContractFactory("Birdie");
	const birdie = await Birdie.deploy();
	await birdie.deployed();
	console.log("birdie deployed to:", birdie.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
