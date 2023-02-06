const { assert } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config.js");

!developmentChains.includes(network.name)
	? describe.skip.skip
	: describe("Basic NFT unit Tests", async function () {
			let basicNft, deployer;

			beforeEach(async function () {
				accounts = await ethers.getSigners();
				deployer = accounts[0];
				await deployments.fixture(["mocks", "basicnft"]);
				basicNft = await ethers.getContract("BasicNft");
			});
			it("Allows users to mint an NFT, and updates appropriately", async function () {
				const txResponse = await basicNft.mintNft();
				txResponse.wait(1);
				const tokenURI = await basicNft.tokenURI(0);
				const tokenCounter = await basicNft.getTokenCounter();

				assert.equal(tokenCounter.toString(), "1");
				assert.equal(tokenURI, await basicNft.TOKEN_URI());
			});
	  });
