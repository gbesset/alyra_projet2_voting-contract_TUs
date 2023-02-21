const Voting = artifacts.require("./Voting.sol");
const { BN, exprectRevert, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

//Passe les compte car on en a besoin pour effectuer des transactions
contract("Voting", (accounts) => {
  const _owner = accounts[0];
  const _voter1 = accounts[1];
  const _voter2 = accounts[2];
  const _proposalGenesis = "GENESIS";
  const _proposal = "new awesome propsal for voting";
  const _proposal2 = "another one";

  //on déclare l'instance
  let VotingInstance;

  /*
   * functions
   */

  beforeEach(async function () {
    // on crée une instance a chaque fois. new() pas deploy().
    VotingInstance = await Voting.new();

    //Add owner as voter to access functions & check he is registered
    await VotingInstance.addVoter(_owner, { from: _owner });
    expect((await VotingInstance.getVoter(_owner, { from: _owner })).isRegistered).to.be.equal(true);
  });

  async function ownerAddVoter1() {
    //Add a voter
    await VotingInstance.addVoter(_voter1, { from: _owner });
    expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(true);
  }
  async function ownerAddVoter2() {
    //Add a voter
    await VotingInstance.addVoter(_voter2, { from: _owner });
    expect((await VotingInstance.getVoter(_voter2, { from: _owner })).isRegistered).to.be.equal(true);
  }

  /*
   * Unit Tests
   */

  it("owner can addVoter only on RegisteringVoters state", async () => {
    expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(false);
    await VotingInstance.addVoter(_voter1, { from: _owner });
    expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(true);

    await VotingInstance.startProposalsRegistering({ from: _owner });
    await expectRevert(VotingInstance.addVoter(_voter1, { from: _owner }), "Voters registration is not open yet");

    await VotingInstance.endProposalsRegistering({ from: _owner });
    await expectRevert(VotingInstance.addVoter(_voter1, { from: _owner }), "Voters registration is not open yet");

    await VotingInstance.startVotingSession({ from: _owner });
    await expectRevert(VotingInstance.addVoter(_voter1, { from: _owner }), "Voters registration is not open yet");

    await VotingInstance.endVotingSession({ from: _owner });
    await expectRevert(VotingInstance.addVoter(_voter1, { from: _owner }), "Voters registration is not open yet");

    await VotingInstance.tallyVotes({ from: _owner });
    await expectRevert(VotingInstance.addVoter(_voter1, { from: _owner }), "Voters registration is not open yet");
  });

  it("voter can be added only once", async () => {
    expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(false);

    await VotingInstance.addVoter(_voter1, { from: _owner });
    expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(true);

    await expectRevert(VotingInstance.addVoter(_voter1, { from: _owner }), "Already registered");
  });

  it("voter can addProposal only on ProposalsRegistrationStarted state", async () => {
    await ownerAddVoter1();

    await expectRevert(VotingInstance.addProposal(_proposal, { from: _voter1 }), "Proposals are not allowed yet");

    await VotingInstance.startProposalsRegistering({ from: _owner });
    const propGenesis = await VotingInstance.getOneProposal(0, { from: _voter1 });
    expect(propGenesis.description).to.be.equal(_proposalGenesis);
    expect(propGenesis.voteCount).to.be.bignumber.equal(new BN(0));

    await VotingInstance.addProposal(_proposal, { from: _voter1 });
    await VotingInstance.addProposal(_proposal2, { from: _voter1 });

    const prop1 = await VotingInstance.getOneProposal(1, { from: _voter1 });
    const prop2 = await VotingInstance.getOneProposal(2, { from: _voter1 });
    expect(prop1.description).to.be.equal(_proposal);
    expect(prop1.voteCount).to.be.bignumber.equal(new BN(0));
    expect(prop2.description).to.be.equal(_proposal2);
    expect(prop2.voteCount).to.be.bignumber.equal(new BN(0));

    await VotingInstance.endProposalsRegistering({ from: _owner });
    await expectRevert(VotingInstance.addProposal(_proposal, { from: _voter1 }), "Proposals are not allowed yet");

    await VotingInstance.startVotingSession({ from: _owner });
    await expectRevert(VotingInstance.addProposal(_proposal, { from: _voter1 }), "Proposals are not allowed yet");

    await VotingInstance.endVotingSession({ from: _owner });
    await expectRevert(VotingInstance.addProposal(_proposal, { from: _voter1 }), "Proposals are not allowed yet");

    await VotingInstance.tallyVotes({ from: _owner });
    await expectRevert(VotingInstance.addProposal(_proposal, { from: _voter1 }), "Proposals are not allowed yet");
  });

  it("voter can't add empty proposal", async () => {
    await ownerAddVoter1();

    await expectRevert(VotingInstance.addProposal(_proposal, { from: _voter1 }), "Proposals are not allowed yet");

    await VotingInstance.startProposalsRegistering({ from: _owner });
    await expectRevert(VotingInstance.addProposal("", { from: _owner }), "Vous ne pouvez pas ne rien proposer");
  });

  it("genesis proposal is 0, others starts at 1", async () => {
    await ownerAddVoter1();

    await expectRevert(VotingInstance.addProposal(_proposal, { from: _voter1 }), "Proposals are not allowed yet");

    await VotingInstance.startProposalsRegistering({ from: _owner });
    const propGenesis = await VotingInstance.getOneProposal(0, { from: _voter1 });
    expect(propGenesis.description).to.be.equal(_proposalGenesis);
    expect(propGenesis.voteCount).to.be.bignumber.equal(new BN(0));

    await VotingInstance.addProposal(_proposal, { from: _voter1 });
    await VotingInstance.addProposal(_proposal2, { from: _voter1 });

    const prop1 = await VotingInstance.getOneProposal(1, { from: _voter1 });
    const prop2 = await VotingInstance.getOneProposal(2, { from: _voter1 });
    expect(prop1.description).to.be.equal(_proposal);
    expect(prop1.voteCount).to.be.bignumber.equal(new BN(0));
    expect(prop2.description).to.be.equal(_proposal2);
    expect(prop2.voteCount).to.be.bignumber.equal(new BN(0));
  });
});
