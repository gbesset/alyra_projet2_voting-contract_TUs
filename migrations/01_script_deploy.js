// Import du smart contract "Voting"
const Voting = artifacts.require('Voting');
module.exports = deployer => {
  //Deploy the smart Contract
  deployer.deploy(Voting);
};
