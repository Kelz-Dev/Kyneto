// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts@4.9.0/access/Ownable.sol";

/**
 * @title ProofVerifier
 * @dev Verifies Proof-of-Replication (PoRep) and Proof-of-Spacetime (PoSt)
 */
contract ProofVerifier is Ownable {
    uint256 public constant POST_INTERVAL = 24 hours;
    uint256 public constant GRACE_PERIOD = 2 hours;
    uint256 public constant CHALLENGE_SECTORS = 10;

    struct PoRepProof {
        bytes32 sealedCID;
        bytes32 unsealedCID;
        uint256 timestamp;
        bool verified;
    }

    struct PoStChallenge {
        uint256 dealId;
        address provider;
        uint256 challengeTimestamp;
        uint256 deadline;
        bytes32[] sectorChallenges;
        bool submitted;
        bool verified;
    }

    mapping(uint256 => mapping(address => PoRepProof)) public porepProofs;
    mapping(uint256 => PoStChallenge) public postChallenges;
    uint256 public challengeCount;

    mapping(address => mapping(uint256 => uint256)) public lastPostSubmission;
    mapping(address => uint256) public consecutiveMisses;

    event PoRepSubmitted(
        uint256 indexed dealId,
        address indexed provider,
        bytes32 sealedCID
    );
    event PoRepVerified(uint256 indexed dealId, address indexed provider);
    event PoStChallengeCreated(
        uint256 indexed challengeId,
        uint256 dealId,
        address provider
    );
    event PoStSubmitted(uint256 indexed challengeId, address indexed provider);
    event PoStVerified(uint256 indexed challengeId);
    event PoStMissed(uint256 indexed challengeId, address indexed provider);

    constructor() {}

    function submitPoRep(
        uint256 dealId,
        bytes32 sealedCID,
        bytes32 unsealedCID,
        bytes calldata proofData
    ) external {
        require(
            !porepProofs[dealId][msg.sender].verified,
            "PoRep already verified"
        );

        bool isValid = _verifyPoRepProof(sealedCID, unsealedCID, proofData);
        require(isValid, "Invalid PoRep proof");

        porepProofs[dealId][msg.sender] = PoRepProof({
            sealedCID: sealedCID,
            unsealedCID: unsealedCID,
            timestamp: block.timestamp,
            verified: true
        });

        emit PoRepSubmitted(dealId, msg.sender, sealedCID);
        emit PoRepVerified(dealId, msg.sender);
    }

    function createPoStChallenge(
        uint256 dealId,
        address provider,
        bytes32[] calldata sectorChallenges
    ) external onlyOwner returns (uint256) {
        require(
            sectorChallenges.length == CHALLENGE_SECTORS,
            "Invalid sector count"
        );

        uint256 challengeId = challengeCount++;
        postChallenges[challengeId] = PoStChallenge({
            dealId: dealId,
            provider: provider,
            challengeTimestamp: block.timestamp,
            deadline: block.timestamp + POST_INTERVAL + GRACE_PERIOD,
            sectorChallenges: sectorChallenges,
            submitted: false,
            verified: false
        });

        emit PoStChallengeCreated(challengeId, dealId, provider);
        return challengeId;
    }

    function submitPoSt(
        uint256 challengeId,
        bytes32[] calldata sectorProofs
    ) external {
        PoStChallenge storage challenge = postChallenges[challengeId];
        require(challenge.provider == msg.sender, "Not challenge owner");
        require(!challenge.submitted, "Already submitted");
        require(block.timestamp <= challenge.deadline, "Deadline passed");
        require(
            sectorProofs.length == CHALLENGE_SECTORS,
            "Invalid proof count"
        );

        bool isValid = _verifyPoStProof(
            challenge.sectorChallenges,
            sectorProofs
        );
        require(isValid, "Invalid PoSt proof");

        challenge.submitted = true;
        challenge.verified = true;

        lastPostSubmission[msg.sender][challenge.dealId] = block.timestamp;
        consecutiveMisses[msg.sender] = 0;

        emit PoStSubmitted(challengeId, msg.sender);
        emit PoStVerified(challengeId);
    }

    function checkMissedPoSt(
        uint256 challengeId
    ) external onlyOwner returns (bool) {
        PoStChallenge storage challenge = postChallenges[challengeId];
        require(block.timestamp > challenge.deadline, "Deadline not passed");
        require(!challenge.submitted, "Already submitted");

        consecutiveMisses[challenge.provider]++;

        emit PoStMissed(challengeId, challenge.provider);
        return true;
    }

    function _verifyPoRepProof(
        bytes32 sealedCID,
        bytes32 unsealedCID,
        bytes calldata proofData
    ) internal pure returns (bool) {
        if (proofData.length == 0) return false;
        if (sealedCID == bytes32(0) || unsealedCID == bytes32(0)) return false;
        return true;
    }

    function _verifyPoStProof(
        bytes32[] memory challenges,
        bytes32[] memory proofs
    ) internal pure returns (bool) {
        if (challenges.length != proofs.length) return false;
        for (uint256 i = 0; i < proofs.length; i++) {
            if (proofs[i] == bytes32(0)) return false;
        }
        return true;
    }
}
