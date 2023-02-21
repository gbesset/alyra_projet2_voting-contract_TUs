// Import du smart contract "VotingPlus"
const VotingPlus = artifacts.require("VotingPlus");
module.exports = (deployer) => {
  //Deploy the smart Contract
  deployer.deploy(VotingPlus);
};
