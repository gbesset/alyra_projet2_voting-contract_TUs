const Voting = artifacts.require("./Voting.sol");
const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

//Passe les compte car on en a besoin pour effectuer des transactions
contract("Voting", (accounts) => {
  const _owner = accounts[0];
  const _voter1 = accounts[1];
  const _voter2 = accounts[2];

  //on déclare l'instance
  let VotingInstance;

  beforeEach(async function () {
    // on crée une instance a chaque fois. new() pas deploy().
    VotingInstance = await Voting.new();
  });

  it("contract instantiated and _owner is owner", async () => {
    expect(await VotingInstance.owner()).to.be.equal(_owner);
  });

  it("address not owner can't access states functions", async () => {
    await expectRevert(VotingInstance.startProposalsRegistering({ from: _voter1 }), "caller is not the owner");
    await expectRevert(VotingInstance.endProposalsRegistering({ from: _voter1 }), "caller is not the owner");
    await expectRevert(VotingInstance.startVotingSession({ from: _voter1 }), "caller is not the owner");
    await expectRevert(VotingInstance.endVotingSession({ from: _voter1 }), "caller is not the owner");
    await expectRevert(VotingInstance.tallyVotes({ from: _voter1 }), "caller is not the owner");
  });

  it("address owner can access states functions!!!!!", async () => {
    console.log(await await VotingInstance.startProposalsRegistering({ from: _owner }));
    expectEvent(await VotingInstance.startProposalsRegistering({ from: _owner }), "ProposalsRegistrationStarted", {});
  });

  it("only owner can access protected functions", async () => {
    await expectRevert(VotingInstance.addVoter(_voter2, { from: _voter1 }), "caller is not the owner");
  });

  it("only voters can access protected functions", async () => {
    await expectRevert(VotingInstance.getVoter(_voter2, { from: _voter1 }), "You're not a voter");
    await expectRevert(VotingInstance.getOneProposal(1, { from: _voter1 }), "You're not a voter");
    await expectRevert(VotingInstance.addProposal("proposition", { from: _voter1 }), "You're not a voter");
    await expectRevert(VotingInstance.setVote(2, { from: _voter1 }), "You're not a voter");
  });

  it("only voters can access protected functions: neither owner", async () => {
    await expectRevert(VotingInstance.getVoter(_voter2, { from: _owner }), "You're not a voter");
    await expectRevert(VotingInstance.getOneProposal(1, { from: _owner }), "You're not a voter");
    await expectRevert(VotingInstance.addProposal("proposition", { from: _owner }), "You're not a voter");
    await expectRevert(VotingInstance.setVote(2, { from: _owner }), "You're not a voter");
  });

  //await VotingInstance.startProposalsRegistering({ from: _owner });
});
