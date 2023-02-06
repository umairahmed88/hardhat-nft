const { network, ethers } = require("hardhat");
const {
	developmentChains,
	networkConfig,
} = require("../helper-hardhat-config.js");
const { verify } = require("../utils/verify");

const {
	storeImages,
	storeTokenUriMetadata,
} = require("../utils/uploadToPinata");

const imagesLocation = "./images/randomNft";

const metadataTemplate = {
	name: "",
	description: "",
	image: "",
	attributes: [
		{
			trait_tpe: "Cuteness",
			value: 100,
		},
	],
};

let tokenUris = [
	"ipfs://QmPcMAMkicspQWMhTPbjszqvnTvtHvbju2VS7Z64Gf1U9m",
	"ipfs://QmPifXzkXbsU47Kv6Wh5hq7VwDLS5G2wwvMhi9LTQtEk78",
	"ipfs://QmetxoVc8AqBXvEm1d3CYzdKFe2on5tootzb5KUBzqMTbg",
];

const FUND_AMOUNT = "1000000000000000000000";

module.exports = async function ({ getNamedAccounts, deployments }) {
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const chainId = network.config.chainId;

	if (process.env.UPLOAD_TO_PINATA == "true") {
		tokenUris = await handleTokenUris();
	}

	let vrfCoordinatorV2Address, subscriptionId;

	if (developmentChains.includes(network.name)) {
		const vrfCoordinatorV2Mock = await ethers.getContract(
			"VRFCoordinatorV2Mock"
		);
		vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
		const tx = await vrfCoordinatorV2Mock.createSubscription();
		const txReceipt = await tx.wait(1);
		subscriptionId = txReceipt.events[0].args.subId;
		await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT);
	} else {
		vrfCoordinatorV2Address = networkConfig[chainId].vrfCoordinatorV2;
		subscriptionId = networkConfig[chainId].subscriptionId;
	}

	log("----------------------------------------------------");
	const args = [
		vrfCoordinatorV2Address,
		subscriptionId,
		networkConfig[chainId].gasLane,
		networkConfig[chainId].callbackGasLimit,
		tokenUris,
		networkConfig[chainId].mintFee,
	];

	const randomIpfsNft = await deploy("RandomIpfsNft", {
		from: deployer,
		args: args,
		log: true,
		waitConfirmations: network.config.blockConfirmations || 1,
	});

	log("------------------------------------------------------");

	if (
		!developmentChains.includes(network.name) &&
		process.env.ETHERSCAN_API_KEY
	) {
		log("Verifying...");
		await verify(randomIpfsNft.address, args);
	}
};

async function handleTokenUris() {
	tokenUris = [];

	const { responses: imageUploadResponses, files } = await storeImages(
		imagesLocation
	);
	for (imageUploadResponseIndex in imageUploadResponses) {
		let tokenUriMetadata = { ...metadataTemplate };
		tokenUriMetadata.name = files[imageUploadResponseIndex].replace(".png", "");
		tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`;
		tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`;
		console.log(`Uploading ${tokenUriMetadata.name}...`);
		const metadataUploadResponse = await storeTokenUriMetadata(
			tokenUriMetadata
		);
		tokenUris.push(`ipfs://${metadataUploadResponse.IpfsHash}`);
	}
	console.log("Token URIs uploaded! They are:");
	console.log(tokenUris);
	return tokenUris;
}

module.exports.tags = ["all", "randomipfs", "main"];
