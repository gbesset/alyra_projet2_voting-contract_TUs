const Voting = artifacts.require("./Voting.sol");
const { BN, exprectRevert, expectEvent } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

//Passe les compte car on en a besoin pour effectuer des transactions
contract("Voting", (accounts) => {
  const _winningProposalID = new BN(0);
  const _workflowStatus = new BN(0);
  const _owner = accounts[0];
  const _voter1 = accounts[1];
  const _voter2 = accounts[2];
  const _voter3 = accounts[3];
  const _proposals = [["Café"], ["Café + Sucre", "Thé"], [], ["coca", "Thé"]];

  //on déclére l'instance
  let VotingInstance;

  beforeEach(async function () {
    // on crée une instance a chaque fois. new() pas deploy().
    VotingInstance = await Voting.new();
  });

  it("contract instantiated and default values are defined", async () => {
    expect(await VotingInstance.winningProposalID()).to.be.bignumber.equal(_winningProposalID);
    expect(await VotingInstance.workflowStatus()).to.be.bignumber.equal(_workflowStatus);
  });
});
