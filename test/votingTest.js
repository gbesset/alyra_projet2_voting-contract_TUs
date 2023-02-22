const Voting = artifacts.require("./Voting.sol");
const { BN, expectEvent, expectRevert } = require("@openzeppelin/test-helpers");
const { expect } = require("chai");

//Passe les compte car on en a besoin pour effectuer des transactions
contract("Voting", (accounts) => {
  const Voter = {
    OWNER: 0,
    VOTER_1: 1,
    VOTER_2: 2,
    VOTER_3: 3,
  };

  const _winningProposalID = new BN(0);
  const _workflowStatus = new BN(0);
  const _owner = accounts[0];
  const _voter1 = accounts[1];
  const _voter2 = accounts[2];
  const _voter3 = accounts[3];
  const _proposals = [["Café"], ["Café + Sucre", "Thé"], [], ["coca", "Thé"]];

  //on déclare l'instance
  let VotingInstance;

  beforeEach(async function () {
    // on crée une instance a chaque fois. new() pas deploy().
    VotingInstance = await Voting.new();
  });

  /* async function ownerAddVoter(name) {
    //Gestion à ameliorer avec Typescript en typant le paramètre pour avoir un Voter
    if (name != 0 || name != 1 || name != 2 || name != 3) {
      expect(true).to.be.false();
    }
    //Add a voter
    await VotingInstance.addVoter(accounts[name], { from: _owner });
    expect((await VotingInstance.getVoter(accounts[name], { from: accounts[name] })).isRegistered).to.be.equal(true);
  }*/

  async function ownerAddOwnerAsVoter() {
    //Add owner as voter to access functions & check he is registered
    let tx = await VotingInstance.addVoter(_owner, { from: _owner });
    expectEvent(tx, "VoterRegistered", { voterAddress: _owner });
    expect((await VotingInstance.getVoter(_owner, { from: _owner })).isRegistered).to.be.equal(true);
  }

  async function ownerAddVoter1() {
    //Add a voter
    let tx = await VotingInstance.addVoter(_voter1, { from: _owner });
    expectEvent(tx, "VoterRegistered", { voterAddress: _voter1 });
    expect((await VotingInstance.getVoter(_voter1, { from: _voter1 })).isRegistered).to.be.equal(true);
  }

  /**
   * Smart contract Deploiement
   */
  describe("Smart contract Deploiement", () => {
    it("smart contract is instantiated and default values are defined", async () => {
      expect(await VotingInstance.winningProposalID()).to.be.bignumber.equal(_winningProposalID);
      expect(await VotingInstance.workflowStatus()).to.be.bignumber.equal(_workflowStatus);
    });

    it("contract is instantiated and _owner is owner", async () => {
      console.log(
        "    -- contract Voting  deployed at address " +
          (await VotingInstance.address) +
          " by address " +
          (await VotingInstance.owner())
      );
      expect(await VotingInstance.owner()).to.be.equal(_owner);
    });
  });

  /**
   * Smart contract Permissions
   */
  describe("Permissions", () => {
    describe("onlyOwner permissions", () => {
      it("An address which is not owner but voter can't access states management functions", async () => {
        await ownerAddVoter1();

        await expectRevert(VotingInstance.startProposalsRegistering({ from: _voter1 }), "caller is not the owner");
        await expectRevert(VotingInstance.endProposalsRegistering({ from: _voter1 }), "caller is not the owner");
        await expectRevert(VotingInstance.startVotingSession({ from: _voter1 }), "caller is not the owner");
        await expectRevert(VotingInstance.endVotingSession({ from: _voter1 }), "caller is not the owner");
        await expectRevert(VotingInstance.tallyVotes({ from: _voter1 }), "caller is not the owner");
      });

      it("An address which is not owner can't access states management functions", async () => {
        await expectRevert(VotingInstance.startProposalsRegistering({ from: _voter1 }), "caller is not the owner");
        await expectRevert(VotingInstance.endProposalsRegistering({ from: _voter1 }), "caller is not the owner");
        await expectRevert(VotingInstance.startVotingSession({ from: _voter1 }), "caller is not the owner");
        await expectRevert(VotingInstance.endVotingSession({ from: _voter1 }), "caller is not the owner");
        await expectRevert(VotingInstance.tallyVotes({ from: _voter1 }), "caller is not the owner");
      });

      it("An address which is owner can access states management functions", async () => {
        //TODO
      });

      it("An address which is not owner but voter can't access addVoter", async () => {
        //await ownerAddVoter(Voter.VOTER_1);
        await ownerAddVoter1();

        await expectRevert(VotingInstance.addVoter(_voter2, { from: _voter1 }), "caller is not the owner");
      });

      it("An address which is not owner can't access addVoter", async () => {
        await expectRevert(VotingInstance.addVoter(_voter2, { from: _voter1 }), "caller is not the owner");
      });

      it("An address which is owner can access addVoter", async () => {
        // TODO CAS OU OK
      });
    });
    describe("onlyVoters permissions", () => {
      it("An address which is not voter can't access protected functions : no voter case", async () => {
        await expectRevert(VotingInstance.getVoter(_voter2, { from: _voter1 }), "You're not a voter");
        await expectRevert(VotingInstance.getOneProposal(1, { from: _voter1 }), "You're not a voter");
        await expectRevert(VotingInstance.addProposal("proposition", { from: _voter1 }), "You're not a voter");
        await expectRevert(VotingInstance.setVote(2, { from: _voter1 }), "You're not a voter");
      });

      it("An address which is not voter but owner can't access protected functions : owner case", async () => {
        await expectRevert(VotingInstance.getVoter(_voter2, { from: _owner }), "You're not a voter");
        await expectRevert(VotingInstance.getOneProposal(1, { from: _owner }), "You're not a voter");
        await expectRevert(VotingInstance.addProposal("proposition", { from: _owner }), "You're not a voter");
        await expectRevert(VotingInstance.setVote(2, { from: _owner }), "You're not a voter");
      });

      it("An address which is voter can access protected functions : voter case", async () => {
        //TODO CAS ou OK
      });
    });

    /**
     * Smart contract State Management
     */
    describe("State Management Constraints", () => {
      describe("RegisteringVoters state", () => {
        it("owner can addVoter only on RegisteringVoters state", async () => {
          // TODO dans un before propre a describe
          // define the owner as voter
          await ownerAddOwnerAsVoter();

          // Add voter OK on RegisteringVoters state
          expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(false);
          let tx = await VotingInstance.addVoter(_voter1, { from: _owner });
          expectEvent(tx, "VoterRegistered", { voterAddress: _voter1 });
          expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(true);

          // Revert on other states
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
          // TODO dans un before propre a describe
          // define the owner as voter
          await ownerAddOwnerAsVoter();

          expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(false);

          //First time
          let tx = await VotingInstance.addVoter(_voter1, { from: _owner });
          expectEvent(tx, "VoterRegistered", { voterAddress: _voter1 });
          expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(true);

          //Second time error
          await expectRevert(VotingInstance.addVoter(_voter1, { from: _owner }), "Already registered");
        });
      });

      describe("ProposalsRegistrationStarted state", () => {
        const _proposalGenesis = "GENESIS";
        const _proposal = "new awesome propsal for voting";
        const _proposal2 = "another one";

        it("voter can addProposal only on ProposalsRegistrationStarted state", async () => {
          // TODO dans un before propre a describe
          // define the owner as voter
          await ownerAddOwnerAsVoter();

          //Add a voter
          await ownerAddVoter1();

          // Not allowed on RegisteringVoters state
          await expectRevert(VotingInstance.addProposal(_proposal, { from: _voter1 }), "Proposals are not allowed yet");

          // OK on ProposalsRegistrationStarted state
          await VotingInstance.startProposalsRegistering({ from: _owner });
          const propGenesis = await VotingInstance.getOneProposal(0, { from: _voter1 });
          expect(propGenesis.description).to.be.equal(_proposalGenesis);
          expect(propGenesis.voteCount).to.be.bignumber.equal(new BN(0));

          let tx = await VotingInstance.addProposal(_proposal, { from: _voter1 });
          expectEvent(tx, "ProposalRegistered", { proposalId: new BN(1) });
          tx = await VotingInstance.addProposal(_proposal2, { from: _voter1 });
          expectEvent(tx, "ProposalRegistered", { proposalId: new BN(2) });

          const prop1 = await VotingInstance.getOneProposal(1, { from: _voter1 });
          const prop2 = await VotingInstance.getOneProposal(2, { from: _voter1 });
          expect(prop1.description).to.be.equal(_proposal);
          expect(prop1.voteCount).to.be.bignumber.equal(new BN(0));
          expect(prop2.description).to.be.equal(_proposal2);
          expect(prop2.voteCount).to.be.bignumber.equal(new BN(0));

          // Not allowed on other states
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
          // TODO dans un before propre a describe
          // define the owner as voter
          await ownerAddOwnerAsVoter();

          await ownerAddVoter1();

          await expectRevert(VotingInstance.addProposal(_proposal, { from: _voter1 }), "Proposals are not allowed yet");

          await VotingInstance.startProposalsRegistering({ from: _owner });
          await expectRevert(VotingInstance.addProposal("", { from: _owner }), "Vous ne pouvez pas ne rien proposer");
        });

        it("genesis proposal is 0, others starts at 1", async () => {
          // TODO dans un before propre a describe
          // define the owner as voter
          await ownerAddOwnerAsVoter();

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

      describe("VotingSessionStarted state", () => {
        const _proposal = "new awesome propsal for voting";
        const _proposal2 = "another one";
        it("voter can vote only on VotingSessionStarted state", async () => {
          // TODO dans un before propre a describe
          // define the owner as voter
          await ownerAddOwnerAsVoter();

          //Add a voter
          await ownerAddVoter1();

          await expectRevert(VotingInstance.setVote(1, { from: _owner }), "Voting session havent started yet");

          await VotingInstance.startProposalsRegistering({ from: _owner });
          await expectRevert(VotingInstance.setVote(1, { from: _owner }), "Voting session havent started yet");
          //Add proposals for test
          await VotingInstance.addProposal(_proposal, { from: _voter1 });
          await VotingInstance.addProposal(_proposal2, { from: _voter1 });

          await VotingInstance.endProposalsRegistering({ from: _owner });
          await expectRevert(VotingInstance.setVote(1, { from: _owner }), "Voting session havent started yet");

          // ok
          await VotingInstance.startVotingSession({ from: _owner });
          let tx = await VotingInstance.setVote(1, { from: _voter1 });
          expectEvent(tx, "Voted", { voter: _voter1, proposalId: new BN(1) });

          // Not allowed on other states
          await VotingInstance.endVotingSession({ from: _owner });
          await expectRevert(VotingInstance.setVote(1, { from: _voter1 }), "Voting session havent started yet");

          await VotingInstance.tallyVotes({ from: _owner });
          await expectRevert(VotingInstance.setVote(1, { from: _voter1 }), "Voting session havent started yet");
        });

        it("voter can vote only once ", async () => {
          // TODO dans un before propre a describe
          // define the owner as voter
          await ownerAddOwnerAsVoter();

          //Add a voter
          await ownerAddVoter1();

          await expectRevert(VotingInstance.setVote(1, { from: _owner }), "Voting session havent started yet");

          await VotingInstance.startProposalsRegistering({ from: _owner });
          await expectRevert(VotingInstance.setVote(1, { from: _owner }), "Voting session havent started yet");
          //Add proposals for test
          await VotingInstance.addProposal(_proposal, { from: _voter1 });
          await VotingInstance.addProposal(_proposal2, { from: _voter1 });

          await VotingInstance.endProposalsRegistering({ from: _owner });
          await expectRevert(VotingInstance.setVote(1, { from: _owner }), "Voting session havent started yet");

          // ok
          await VotingInstance.startVotingSession({ from: _owner });
          let tx = await VotingInstance.setVote(1, { from: _voter1 });
          expectEvent(tx, "Voted", { voter: _voter1, proposalId: new BN(1) });

          //2nd time KO
          await expectRevert(VotingInstance.setVote(1, { from: _voter1 }), "You have already voted");
        });

        it("voter vote and proposal not found ", async () => {
          // TODO dans un before propre a describe
          // define the owner as voter
          await ownerAddOwnerAsVoter();

          //Add a voter
          await ownerAddVoter1();

          await expectRevert(VotingInstance.setVote(1, { from: _owner }), "Voting session havent started yet");

          await VotingInstance.startProposalsRegistering({ from: _owner });
          await expectRevert(VotingInstance.setVote(1, { from: _owner }), "Voting session havent started yet");
          //Add proposals for test
          await VotingInstance.addProposal(_proposal, { from: _voter1 });
          await VotingInstance.addProposal(_proposal2, { from: _voter1 });

          await VotingInstance.endProposalsRegistering({ from: _owner });
          await expectRevert(VotingInstance.setVote(1, { from: _owner }), "Voting session havent started yet");

          //proposal not found
          await VotingInstance.startVotingSession({ from: _owner });
          //await expectRevert(VotingInstance.setVote(-1, { from: _owner }), "Proposal not found"); //marche pas -1
          await expectRevert(VotingInstance.setVote(3, { from: _owner }), "Proposal not found"); // GENESIS bloc
        });
      });
      describe("Management states event emited", () => {
        it("check each event is emited on worflow change", async () => {
          let tx = await VotingInstance.startProposalsRegistering({ from: _owner });
          expectEvent(tx, "WorkflowStatusChange", { previousStatus: new BN(0), newStatus: new BN(1) });

          tx = await VotingInstance.endProposalsRegistering({ from: _owner });
          expectEvent(tx, "WorkflowStatusChange", { previousStatus: new BN(1), newStatus: new BN(2) });

          tx = await VotingInstance.startVotingSession({ from: _owner });
          expectEvent(tx, "WorkflowStatusChange", { previousStatus: new BN(2), newStatus: new BN(3) });

          tx = await VotingInstance.endVotingSession({ from: _owner });
          expectEvent(tx, "WorkflowStatusChange", { previousStatus: new BN(3), newStatus: new BN(4) });

          tx = await VotingInstance.tallyVotes({ from: _owner });
          expectEvent(tx, "WorkflowStatusChange", { previousStatus: new BN(4), newStatus: new BN(5) });
        });
      });
    });

    /**
     * Smart contract Workflow
     */
    describe("Smart contract workflow", () => {
      describe("1", () => {});
      describe("1", () => {});
      describe("1", () => {});
      describe("1", () => {});
      describe("1", () => {});
    });
  });
});
// oublié les events
