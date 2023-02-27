const Voting = artifacts.require('./Voting.sol');
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

//Passe les compte car on en a besoin pour effectuer des transactions
contract('Voting', accounts => {
  const _winningProposalID = new BN(0);
  const _workflowStatus = new BN(0);
  const _owner = accounts[0];
  const _voter1 = accounts[1];
  const _voter2 = accounts[2];
  const _voter3 = accounts[3];

  //on déclare l'instance
  let VotingInstance;

  async function ownerAddOwnerAsVoter() {
    //Add owner as voter to access functions & check he is registered
    let tx = await VotingInstance.addVoter(_owner, { from: _owner });
    expectEvent(tx, 'VoterRegistered', { voterAddress: _owner });
    expect((await VotingInstance.getVoter(_owner, { from: _owner })).isRegistered).to.be.equal(true);
  }

  async function ownerAddVoter(i) {
    if (i == 0 || i == 1 || i == 2 || i == 3) {
      //Add a voter
      let tx = await VotingInstance.addVoter(accounts[i], { from: _owner });
      expectEvent(tx, 'VoterRegistered', { voterAddress: accounts[i] });
      expect((await VotingInstance.getVoter(accounts[i], { from: accounts[i] })).isRegistered).to.be.equal(true);
    }
  }

  /**
   * Smart contract Deploiement
   */
  describe('Smart contract Deploiement', () => {
    beforeEach(async function () {
      // on crée une instance a chaque fois. new() pas deploy().
      VotingInstance = await Voting.new({ from: _owner });
      //identique à await Voting.new();
    });

    it('smart contract is instantiated and default values are defined', async () => {
      expect(await VotingInstance.winningProposalID()).to.be.bignumber.equal(_winningProposalID);
      expect(await VotingInstance.workflowStatus()).to.be.bignumber.equal(_workflowStatus);
    });

    it('smart contract is instantiated and _owner is owner', async () => {
      console.log(
        '    --> contract Voting  deployed at address ' +
          (await VotingInstance.address) +
          ' by address ' +
          (await VotingInstance.owner()),
      );
      expect(await VotingInstance.owner()).to.be.equal(_owner);
    });
  });

  /**
   * Smart contract Permissions
   */
  describe('Smart contract Permissions', () => {
    beforeEach(async function () {
      VotingInstance = await Voting.new({ from: _owner });
    });

    /**
     * j'aurai pu mettre 2 decribes avec 2 hook (owner, voter) mais je préfère tester une fonctionnalité dans son ensemble à la suite et utiliser une fonction plutot que de l'éclater dans le fichier.
     */
    describe('onlyOwner permissions', () => {
      it("An address which is not owner but voter can't access states management functions", async () => {
        await ownerAddVoter(1);

        await expectRevert(VotingInstance.startProposalsRegistering({ from: _voter1 }), 'caller is not the owner');
        await expectRevert(VotingInstance.endProposalsRegistering({ from: _voter1 }), 'caller is not the owner');
        await expectRevert(VotingInstance.startVotingSession({ from: _voter1 }), 'caller is not the owner');
        await expectRevert(VotingInstance.endVotingSession({ from: _voter1 }), 'caller is not the owner');
        await expectRevert(VotingInstance.tallyVotes({ from: _voter1 }), 'caller is not the owner');
      });

      it("An address which is not owner can't access states management functions", async () => {
        await expectRevert(VotingInstance.startProposalsRegistering({ from: _voter1 }), 'caller is not the owner');
        await expectRevert(VotingInstance.endProposalsRegistering({ from: _voter1 }), 'caller is not the owner');
        await expectRevert(VotingInstance.startVotingSession({ from: _voter1 }), 'caller is not the owner');
        await expectRevert(VotingInstance.endVotingSession({ from: _voter1 }), 'caller is not the owner');
        await expectRevert(VotingInstance.tallyVotes({ from: _voter1 }), 'caller is not the owner');
      });

      // CASE owner is OK => done in functionnal test

      it("An address which is not owner but voter can't access addVoter", async () => {
        //await ownerAddVoter(Voter.VOTER_1);
        await ownerAddVoter(1);

        await expectRevert(VotingInstance.addVoter(_voter2, { from: _voter1 }), 'caller is not the owner');
      });

      it("An address which is not owner can't access addVoter", async () => {
        await expectRevert(VotingInstance.addVoter(_voter2, { from: _voter1 }), 'caller is not the owner');
      });

      // CASE owner is OK => done in functionnal test
    });
    describe('onlyVoters permissions', () => {
      it("An address which is not voter can't access protected functions : no voter case", async () => {
        await expectRevert(VotingInstance.getVoter(_voter2, { from: _voter1 }), "You're not a voter");
        await expectRevert(VotingInstance.getOneProposal(1, { from: _voter1 }), "You're not a voter");
        await expectRevert(VotingInstance.addProposal('proposition', { from: _voter1 }), "You're not a voter");
        await expectRevert(VotingInstance.setVote(2, { from: _voter1 }), "You're not a voter");
      });

      it("An address which is not voter but owner can't access protected functions : owner case", async () => {
        await expectRevert(VotingInstance.getVoter(_voter2, { from: _owner }), "You're not a voter");
        await expectRevert(VotingInstance.getOneProposal(1, { from: _owner }), "You're not a voter");
        await expectRevert(VotingInstance.addProposal('proposition', { from: _owner }), "You're not a voter");
        await expectRevert(VotingInstance.setVote(2, { from: _owner }), "You're not a voter");
      });

      /// CASE voter is OK => done in functionnal test
    });
  });

  /**
   * Smart contract State Management
   */
  describe('State Management Constraints', () => {
    beforeEach(async function () {
      VotingInstance = await Voting.new({ from: _owner });

      // define the owner as voter
      await ownerAddOwnerAsVoter();
    });

    describe('RegisteringVoters state', () => {
      it('owner can addVoter only on RegisteringVoters state', async () => {
        // Add voter OK on RegisteringVoters state
        let tx = await VotingInstance.addVoter(_voter1, { from: _owner });
        expectEvent(tx, 'VoterRegistered', { voterAddress: _voter1 });

        // Revert on other states
        await VotingInstance.startProposalsRegistering({ from: _owner });
        await expectRevert(VotingInstance.addVoter(_voter1, { from: _owner }), 'Voters registration is not open yet');

        await VotingInstance.endProposalsRegistering({ from: _owner });
        await expectRevert(VotingInstance.addVoter(_voter1, { from: _owner }), 'Voters registration is not open yet');

        await VotingInstance.startVotingSession({ from: _owner });
        await expectRevert(VotingInstance.addVoter(_voter1, { from: _owner }), 'Voters registration is not open yet');

        await VotingInstance.endVotingSession({ from: _owner });
        await expectRevert(VotingInstance.addVoter(_voter1, { from: _owner }), 'Voters registration is not open yet');

        await VotingInstance.tallyVotes({ from: _owner });
        await expectRevert(VotingInstance.addVoter(_voter1, { from: _owner }), 'Voters registration is not open yet');
      });
      it('addVoter function event emited and onchain modifications', async () => {
        // before
        expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(false);

        // add voter
        let tx = await VotingInstance.addVoter(_voter1, { from: _owner });

        //check event and voters
        expectEvent(tx, 'VoterRegistered', { voterAddress: _voter1 });
        expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(true);
      });

      it('voter can be added only once', async () => {
        expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(false);

        //First time
        let tx = await VotingInstance.addVoter(_voter1, { from: _owner });
        expectEvent(tx, 'VoterRegistered', { voterAddress: _voter1 });
        expect((await VotingInstance.getVoter(_voter1, { from: _owner })).isRegistered).to.be.equal(true);

        //Second time error
        await expectRevert(VotingInstance.addVoter(_voter1, { from: _owner }), 'Already registered');
      });
    });

    describe('ProposalsRegistrationStarted state', () => {
      const _proposalGenesis = 'GENESIS';
      const _proposal = 'new awesome proposal for voting';
      const _proposal2 = 'another one';

      beforeEach(async function () {
        VotingInstance = await Voting.new({ from: _owner });

        // define the owner as voter
        await ownerAddOwnerAsVoter();

        //Add a voter
        await ownerAddVoter(1);

        //prepare state to ProposalsRegistrationStarted
        //------- Not allowed on RegisteringVoters state
        await expectRevert(VotingInstance.addProposal(_proposal, { from: _voter1 }), 'Proposals are not allowed yet');

        await VotingInstance.startProposalsRegistering({ from: _owner });
      });

      it('voter can addProposal only on ProposalsRegistrationStarted state', async () => {
        //------- OK on ProposalsRegistrationStarted state
        // only check events for validate function OK
        let tx = await VotingInstance.addProposal(_proposal, { from: _voter1 });
        expectEvent(tx, 'ProposalRegistered', { proposalId: new BN(1) });
        tx = await VotingInstance.addProposal(_proposal2, { from: _voter1 });
        expectEvent(tx, 'ProposalRegistered', { proposalId: new BN(2) });

        //---------- Not allowed on other states
        await VotingInstance.endProposalsRegistering({ from: _owner });
        await expectRevert(VotingInstance.addProposal(_proposal, { from: _voter1 }), 'Proposals are not allowed yet');

        await VotingInstance.startVotingSession({ from: _owner });
        await expectRevert(VotingInstance.addProposal(_proposal, { from: _voter1 }), 'Proposals are not allowed yet');

        await VotingInstance.endVotingSession({ from: _owner });
        await expectRevert(VotingInstance.addProposal(_proposal, { from: _voter1 }), 'Proposals are not allowed yet');

        await VotingInstance.tallyVotes({ from: _owner });
        await expectRevert(VotingInstance.addProposal(_proposal, { from: _voter1 }), 'Proposals are not allowed yet');
      });
      it('addProposal function event emited and onchain modifications', async () => {
        //------- OK on ProposalsRegistrationStarted state
        // check genesis
        const propGenesis = await VotingInstance.getOneProposal(0, { from: _voter1 });
        expect(propGenesis.description).to.be.equal(_proposalGenesis);
        expect(propGenesis.voteCount).to.be.bignumber.equal(new BN(0));

        // check events
        let tx = await VotingInstance.addProposal(_proposal, { from: _voter1 });
        expectEvent(tx, 'ProposalRegistered', { proposalId: new BN(1) });
        tx = await VotingInstance.addProposal(_proposal2, { from: _voter1 });
        expectEvent(tx, 'ProposalRegistered', { proposalId: new BN(2) });

        // check proposals
        const prop1 = await VotingInstance.getOneProposal(1, { from: _voter1 });
        const prop2 = await VotingInstance.getOneProposal(2, { from: _voter1 });
        expect(prop1.description).to.be.equal(_proposal);
        expect(prop1.voteCount).to.be.bignumber.equal(new BN(0));
        expect(prop2.description).to.be.equal(_proposal2);
        expect(prop2.voteCount).to.be.bignumber.equal(new BN(0));
      });

      it("voter can't add empty proposal", async () => {
        await expectRevert(VotingInstance.addProposal('', { from: _owner }), 'Vous ne pouvez pas ne rien proposer');
      });

      it('Genesis proposal is 0, others starts at 1', async () => {
        /* overkill car testé avant mais c'est pour un TU spécifique a GENESIS. à la limite l'enlever avant*/

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

      it('addProposal should add 10 proposals', async () => {
        //Un seul element dans le tableau : Genesis puis Exception
        //genesis
        const propGenesis = await VotingInstance.getOneProposal(0, { from: _voter1 });
        expect(propGenesis.description).to.be.equal(_proposalGenesis);
        expect(propGenesis.voteCount).to.be.bignumber.equal(new BN(0));

        //exception
        await expectRevert.unspecified(VotingInstance.getOneProposal(1, { from: _voter1 }));

        await VotingInstance.addProposal(_proposal, { from: _voter1 });
        await VotingInstance.addProposal(_proposal, { from: _voter1 });
        await VotingInstance.addProposal(_proposal, { from: _voter1 });
        await VotingInstance.addProposal(_proposal, { from: _voter1 });
        await VotingInstance.addProposal(_proposal, { from: _voter1 });
        await VotingInstance.addProposal(_proposal, { from: _voter1 });
        await VotingInstance.addProposal(_proposal, { from: _voter1 });
        await VotingInstance.addProposal(_proposal, { from: _voter1 });
        await VotingInstance.addProposal(_proposal2, { from: _voter1 });

        //the last element is the proposal2 after: exception
        const prop = await VotingInstance.getOneProposal(9, { from: _voter1 });
        expect(prop.description).to.be.equal(_proposal2);
        expect(prop.voteCount).to.be.bignumber.equal(new BN(0));

        //exception
        await expectRevert.unspecified(VotingInstance.getOneProposal(10, { from: _voter1 }));
      });
    });

    describe('VotingSessionStarted state', () => {
      const _proposal = 'new awesome propsal for voting';
      const _proposal2 = 'another one';

      beforeEach(async function () {
        VotingInstance = await Voting.new({ from: _owner });

        // define the owner as voter
        await ownerAddOwnerAsVoter();

        //Add a voter
        await ownerAddVoter(1);
        await ownerAddVoter(2);

        //Prepare State to VotingSessionStarted and add some proposals
        // check also not allowed ont thoses states
        await expectRevert(VotingInstance.setVote(1, { from: _owner }), 'Voting session havent started yet');

        await VotingInstance.startProposalsRegistering({ from: _owner });
        await expectRevert(VotingInstance.setVote(1, { from: _owner }), 'Voting session havent started yet');
        //Add proposals for test
        await VotingInstance.addProposal(_proposal, { from: _voter1 });
        await VotingInstance.addProposal(_proposal2, { from: _voter1 });

        await VotingInstance.endProposalsRegistering({ from: _owner });
        await expectRevert(VotingInstance.setVote(1, { from: _owner }), 'Voting session havent started yet');

        await VotingInstance.startVotingSession({ from: _owner });
      });

      it('voter can vote only on VotingSessionStarted state', async () => {
        //---- voter can vote on status
        let tx = await VotingInstance.setVote(1, { from: _voter1 });
        expectEvent(tx, 'Voted', { voter: _voter1, proposalId: new BN(1) });

        // Not allowed on other states
        await VotingInstance.endVotingSession({ from: _owner });
        await expectRevert(VotingInstance.setVote(1, { from: _voter1 }), 'Voting session havent started yet');

        await VotingInstance.tallyVotes({ from: _owner });
        await expectRevert(VotingInstance.setVote(1, { from: _voter1 }), 'Voting session havent started yet');
      });

      it('setVote function event emited and onchain modifications', async () => {
        //---- voter can vote on status and variables are set
        // before vote
        let voterResponse = await VotingInstance.getVoter(_voter1, { from: _voter1 });
        expect(voterResponse.hasVoted).to.be.false;
        expect(voterResponse.votedProposalId).to.be.bignumber.equal(new BN(0));

        let proposalResponse = await VotingInstance.getOneProposal(1, { from: _voter1 });
        expect(proposalResponse.voteCount).to.be.bignumber.equal(new BN(0));

        //vote
        let tx = await VotingInstance.setVote(1, { from: _voter1 });
        expectEvent(tx, 'Voted', { voter: _voter1, proposalId: new BN(1) });

        //after vote
        voterResponse = await VotingInstance.getVoter(_voter1, { from: _voter1 });
        expect(voterResponse.hasVoted).to.be.true;
        expect(voterResponse.votedProposalId).to.be.bignumber.equal(new BN(1));

        proposalResponse = await VotingInstance.getOneProposal(1, { from: _voter1 });
        expect(proposalResponse.voteCount).to.be.bignumber.equal(new BN(1));
      });

      it('Several voters vote and count is OK ', async () => {
        // check Before vote
        let voterResponse = await VotingInstance.getVoter(_voter1, { from: _voter1 });
        expect(voterResponse.hasVoted).to.be.false;
        expect(voterResponse.votedProposalId).to.be.bignumber.equal(new BN(0));

        voterResponse = await VotingInstance.getVoter(_voter2, { from: _voter2 });
        expect(voterResponse.hasVoted).to.be.false;
        expect(voterResponse.votedProposalId).to.be.bignumber.equal(new BN(0));

        let proposalResponse = await VotingInstance.getOneProposal(2, { from: _voter1 });
        expect(proposalResponse.voteCount).to.be.bignumber.equal(new BN(0));

        //Vote
        let tx = await VotingInstance.setVote(2, { from: _voter1 });
        expectEvent(tx, 'Voted', { voter: _voter1, proposalId: new BN(2) });
        tx = await VotingInstance.setVote(2, { from: _voter2 });
        expectEvent(tx, 'Voted', { voter: _voter2, proposalId: new BN(2) });

        // Check After vote
        voterResponse = await VotingInstance.getVoter(_voter1, { from: _voter1 });
        expect(voterResponse.hasVoted).to.be.true;
        expect(voterResponse.votedProposalId).to.be.bignumber.equal(new BN(2));

        voterResponse = await VotingInstance.getVoter(_voter2, { from: _voter2 });
        expect(voterResponse.hasVoted).to.be.true;
        expect(voterResponse.votedProposalId).to.be.bignumber.equal(new BN(2));

        proposalResponse = await VotingInstance.getOneProposal(2, { from: _voter1 });
        expect(proposalResponse.voteCount).to.be.bignumber.equal(new BN(2));
      });

      it('voter can vote only once ', async () => {
        // ok
        let tx = await VotingInstance.setVote(1, { from: _voter1 });
        expectEvent(tx, 'Voted', { voter: _voter1, proposalId: new BN(1) });

        //2nd time KO
        await expectRevert(VotingInstance.setVote(1, { from: _voter1 }), 'You have already voted');
      });

      it('voter vote and proposal not found ', async () => {
        //proposal not found
        //await expectRevert.unspecified(VotingInstance.setVote(-1, { from: _owner }), "Proposal not found"); //marche pas -1
        await expectRevert(VotingInstance.setVote(3, { from: _owner }), 'Proposal not found'); // GENESIS bloc
      });
    });
    describe('VotingSessionEnded state', () => {
      const _proposal = 'new awesome propsal for voting';
      const _proposal2 = 'another one';

      beforeEach(async function () {
        VotingInstance = await Voting.new({ from: _owner });

        // define the owner as voter
        await ownerAddOwnerAsVoter();

        //Add voters
        await ownerAddVoter(1);
        await ownerAddVoter(2);
        await ownerAddVoter(3);

        //Prepare State to VotingSessionStarted and add some proposals
        // check also not allowed ont thoses states
        await expectRevert(VotingInstance.tallyVotes({ from: _owner }), 'Current status is not voting session ended');

        await VotingInstance.startProposalsRegistering({ from: _owner });
        await expectRevert(VotingInstance.tallyVotes({ from: _owner }), 'Current status is not voting session ended');
        //Add proposals for test
        await VotingInstance.addProposal(_proposal, { from: _voter1 });
        await VotingInstance.addProposal(_proposal2, { from: _voter1 });

        await VotingInstance.endProposalsRegistering({ from: _owner });
        await expectRevert(VotingInstance.tallyVotes({ from: _owner }), 'Current status is not voting session ended');

        await VotingInstance.startVotingSession({ from: _owner });
        //Add some votes
        let tx = await VotingInstance.setVote(2, { from: _voter1 });
        expectEvent(tx, 'Voted', { voter: _voter1, proposalId: new BN(2) });
        tx = await VotingInstance.setVote(2, { from: _voter2 });
        expectEvent(tx, 'Voted', { voter: _voter2, proposalId: new BN(2) });

        //rpepare state
        tx = await VotingInstance.endVotingSession({ from: _owner });
      });
      it('owner can tallyVotes only on VotingSessionEnded state', async () => {
        //OK
        let tx = await VotingInstance.tallyVotes({ from: _owner });

        // Not allowed on other states
        await expectRevert(VotingInstance.tallyVotes({ from: _owner }), 'Current status is not voting session ended');
      });

      it('tallyVote function onchain modifications', async () => {
        //---- voter can vote on status and variables are set
        // before vote
        let winningId = await VotingInstance.winningProposalID.call();
        expect(winningId).to.be.bignumber.equal(new BN(0));

        let tx = await VotingInstance.tallyVotes({ from: _owner });

        winningId = await VotingInstance.winningProposalID.call();
        expect(winningId).to.be.bignumber.equal(new BN(2));
      });
    });

    describe('Management states event emited', () => {
      it('check each event is emited on worflow change', async () => {
        let tx = await VotingInstance.startProposalsRegistering({ from: _owner });
        expectEvent(tx, 'WorkflowStatusChange', { previousStatus: new BN(0), newStatus: new BN(1) });

        tx = await VotingInstance.endProposalsRegistering({ from: _owner });
        expectEvent(tx, 'WorkflowStatusChange', { previousStatus: new BN(1), newStatus: new BN(2) });

        tx = await VotingInstance.startVotingSession({ from: _owner });
        expectEvent(tx, 'WorkflowStatusChange', { previousStatus: new BN(2), newStatus: new BN(3) });

        tx = await VotingInstance.endVotingSession({ from: _owner });
        expectEvent(tx, 'WorkflowStatusChange', { previousStatus: new BN(3), newStatus: new BN(4) });

        tx = await VotingInstance.tallyVotes({ from: _owner });
        expectEvent(tx, 'WorkflowStatusChange', { previousStatus: new BN(4), newStatus: new BN(5) });
      });
    });
    describe('Management states check require on status', () => {
      it('check each status is checked on states management functions', async () => {
        await expectRevert(
          VotingInstance.endProposalsRegistering({ from: _owner }),
          'Registering proposals havent started yet',
        );
        await expectRevert(
          VotingInstance.startVotingSession({ from: _owner }),
          'Registering proposals phase is not finished',
        );
        await expectRevert(VotingInstance.endVotingSession({ from: _owner }), 'Voting session havent started yet');
        await expectRevert(VotingInstance.tallyVotes({ from: _owner }), 'Current status is not voting session ended');

        let tx = await VotingInstance.startProposalsRegistering({ from: _owner });
        expectEvent(tx, 'WorkflowStatusChange', { previousStatus: new BN(0), newStatus: new BN(1) });

        await expectRevert(
          VotingInstance.startProposalsRegistering({ from: _owner }),
          'Registering proposals cant be started now',
        );
      });
    });
  });

  /**
   * Smart contract Workflow
   */
  describe('Smart contract workflow', () => {
    const _proposals = [['Café'], ['Café + Sucre', 'Thé'], [], ['coca', 'Thé']];

    beforeEach(async function () {
      VotingInstance = await Voting.new({ from: _owner });
    });

    it('Scenario 1 with 3 voters no tie', async () => {
      //Add voters
      await ownerAddVoter(1);
      await ownerAddVoter(2);
      await ownerAddVoter(3);

      //Start proposals
      await VotingInstance.startProposalsRegistering({ from: _owner });

      await VotingInstance.addProposal(_proposals[3][0], { from: _voter3 });
      await VotingInstance.addProposal(_proposals[1][0], { from: _voter1 });
      await VotingInstance.addProposal(_proposals[1][1], { from: _voter1 });

      await VotingInstance.endProposalsRegistering({ from: _owner });
      await VotingInstance.startVotingSession({ from: _owner });

      //Add some votes
      let tx = await VotingInstance.setVote(1, { from: _voter1 });
      expectEvent(tx, 'Voted', { voter: _voter1, proposalId: new BN(1) });
      tx = await VotingInstance.setVote(2, { from: _voter2 });
      expectEvent(tx, 'Voted', { voter: _voter2, proposalId: new BN(2) });
      tx = await VotingInstance.setVote(1, { from: _voter3 });
      expectEvent(tx, 'Voted', { voter: _voter3, proposalId: new BN(1) });

      //pepare state
      tx = await VotingInstance.endVotingSession({ from: _owner });
      tx = await VotingInstance.tallyVotes({ from: _owner });

      //check the proposal 4 (_voter2 proposal1)
      winningId = await VotingInstance.winningProposalID.call();
      expect(winningId).to.be.bignumber.equal(new BN(1));
    });
    it('Scenario 1 with 3 voters and owner voter no tie', async () => {
      // define the owner as voter
      await ownerAddOwnerAsVoter();

      //Add voters
      await ownerAddVoter(1);
      await ownerAddVoter(2);
      await ownerAddVoter(3);

      //Start proposals
      await VotingInstance.startProposalsRegistering({ from: _owner });

      await VotingInstance.addProposal(_proposals[1][0], { from: _voter1 });
      await VotingInstance.addProposal(_proposals[3][0], { from: _voter3 });
      await VotingInstance.addProposal(_proposals[0][0], { from: _owner });
      await VotingInstance.addProposal(_proposals[1][1], { from: _voter1 });

      await VotingInstance.endProposalsRegistering({ from: _owner });
      await VotingInstance.startVotingSession({ from: _owner });

      //Add some votes
      let tx = await VotingInstance.setVote(4, { from: _voter1 });
      expectEvent(tx, 'Voted', { voter: _voter1, proposalId: new BN(4) });
      tx = await VotingInstance.setVote(2, { from: _owner });
      expectEvent(tx, 'Voted', { voter: _owner, proposalId: new BN(2) });
      tx = await VotingInstance.setVote(3, { from: _voter2 });
      expectEvent(tx, 'Voted', { voter: _voter2, proposalId: new BN(3) });
      tx = await VotingInstance.setVote(4, { from: _voter3 });
      expectEvent(tx, 'Voted', { voter: _voter3, proposalId: new BN(4) });

      //pepare state
      tx = await VotingInstance.endVotingSession({ from: _owner });
      tx = await VotingInstance.tallyVotes({ from: _owner });

      //check the proposal 4 (_voter2 proposal1)
      winningId = await VotingInstance.winningProposalID.call();
      expect(winningId).to.be.bignumber.equal(new BN(4));
    });
    it('Scenario 3 with tie, should take the first one', async () => {
      // define the owner as voter
      await ownerAddOwnerAsVoter();

      //Add voters
      await ownerAddVoter(1);
      await ownerAddVoter(2);
      await ownerAddVoter(3);

      //Start proposals
      await VotingInstance.startProposalsRegistering({ from: _owner });

      await VotingInstance.addProposal(_proposals[1][0], { from: _voter1 });
      await VotingInstance.addProposal(_proposals[3][0], { from: _voter3 });
      await VotingInstance.addProposal(_proposals[0][0], { from: _owner });
      await VotingInstance.addProposal(_proposals[1][1], { from: _voter1 });

      await VotingInstance.endProposalsRegistering({ from: _owner });
      await VotingInstance.startVotingSession({ from: _owner });

      //Add some votes
      let tx = await VotingInstance.setVote(4, { from: _voter1 });
      expectEvent(tx, 'Voted', { voter: _voter1, proposalId: new BN(4) });
      tx = await VotingInstance.setVote(4, { from: _owner });
      expectEvent(tx, 'Voted', { voter: _owner, proposalId: new BN(4) });
      tx = await VotingInstance.setVote(3, { from: _voter2 });
      expectEvent(tx, 'Voted', { voter: _voter2, proposalId: new BN(3) });
      tx = await VotingInstance.setVote(3, { from: _voter3 });
      expectEvent(tx, 'Voted', { voter: _voter3, proposalId: new BN(3) });

      //pepare state
      tx = await VotingInstance.endVotingSession({ from: _owner });
      tx = await VotingInstance.tallyVotes({ from: _owner });

      //check the proposal 3 (_voter2 proposal1)
      winningId = await VotingInstance.winningProposalID.call();
      expect(winningId).to.be.bignumber.equal(new BN(3));
    });
  });
});
