const { network, ethers } = require("hardhat");
const { developmentChains } = require("../helper-hardhat-config.js");

const DECIMALS = "18";
const INITIAL_PRICE = ethers.utils.parseUnits("2000", "ether");

const BASE_FEE = ethers.utils.parseEther("0.25");
const GAS_PRICE_LINK = 1e9; // it is calculated value based on the gas price of chain.

module.exports = async function ({ getNamedAccounts, deployments }) {
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const args = [BASE_FEE, GAS_PRICE_LINK];

	if (developmentChains.includes(network.name)) {
		log("Local network detected! Deploying mocks...");
		// deploy a mock vrf coordinator...
		await deploy("VRFCoordinatorV2Mock", {
			from: deployer,
			log: true,
			args: args,
		});

		await deploy("MockV3Aggregator", {
			from: deployer,
			log: true,
			args: [DECIMALS, INITIAL_PRICE],
		});
		log("Mocks Deployed!");
		log("------------------------");
	}
};

module.exports.tags = ["all", "mocks"];
