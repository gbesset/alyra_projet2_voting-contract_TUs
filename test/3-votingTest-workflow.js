const Voting = artifacts.require("./Voting.sol");
const { BN, exprectRevert, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
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
    console.log(
      "    -- contract Voting  deployed at address " +
        (await VotingInstance.address) +
        " by address " +
        (await VotingInstance.owner())
    );

    expect(await VotingInstance.winningProposalID()).to.be.bignumber.equal(_winningProposalID);
    expect(await VotingInstance.workflowStatus()).to.be.bignumber.equal(_workflowStatus);
    expect(await VotingInstance.owner()).to.be.equal(_owner);
  });

  it("an owner no voter can't get voters", async () => {
    await expectRevert(VotingInstance.getVoter(_voter1, { from: _owner }), "You're not a voter");
  });

  it("only owner add voters", async () => {
    //Add owner as voter to access functions
    await VotingInstance.addVoter(_owner, { from: _owner });

    expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(false);
    expect((await VotingInstance.getVoter(_voter2, { from: _owner })).isRegistered).to.be.equal(false);
    expect((await VotingInstance.getVoter(_voter3, { from: _owner })).isRegistered).to.be.equal(false);

    await VotingInstance.addVoter(_voter1, { from: _owner });
    await VotingInstance.addVoter(_voter3, { from: _owner });

    expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(true);
    expect((await VotingInstance.getVoter(_voter2, { from: _owner })).isRegistered).to.be.equal(false);
    expect((await VotingInstance.getVoter(_voter3, { from: _owner })).isRegistered).to.be.equal(true);
  });
  it("not owner can't add voters", async () => {
    //Add owner as voter to access functions
    await VotingInstance.addVoter(_owner, { from: _owner });

    expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(false);

    await expectRevert(VotingInstance.addVoter(_voter1, { from: _voter1 }), "caller is not the owner");

    expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(false);
  });

  //await VotingInstance.startProposalsRegistering({ from: _owner });
});
