// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title ProofVerifier
 * @dev Verifies Proof-of-Replication (PoRep) and Proof-of-Spacetime (PoSt)
 *
 * NOTE: This version uses Merkle proofs for challenge-response.
 */
contract ProofVerifier is Ownable {
    uint256 public constant POST_INTERVAL = 24 hours;
    uint256 public constant GRACE_PERIOD = 2 hours;
    uint256 public constant CHALLENGE_SECTORS = 10;

    struct PoRepProof {
        bytes32 sealedCID; // Merkle root of sealed (encrypted) shard
        bytes32 unsealedCID; // Hash of original shard
        uint256 timestamp;
        bool verified;
    }

    struct PoStChallenge {
        uint256 dealId;
        address provider;
        uint256 challengeTimestamp;
        uint256 deadline;
        uint256[] leafIndices; // Indices of sectors to prove
        bool submitted;
        bool verified;
    }

    // Deal ID => Provider => PoRep proof
    mapping(uint256 => mapping(address => PoRepProof)) public porepProofs;

    // Challenge ID => PoSt challenge
    mapping(uint256 => PoStChallenge) public postChallenges;
    uint256 public challengeCount;

    // Provider => Deal ID => Last PoSt timestamp
    mapping(address => mapping(uint256 => uint256)) public lastPostSubmission;

    // Provider => consecutive misses
    mapping(address => uint256) public consecutiveMisses;

    // Events
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

    constructor() Ownable(msg.sender) {}

    /**
     * @dev Submit Proof-of-Replication (initial proof when storing shard)
     */
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

        // In production, verify zk-SNARK proof here
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

    /**
     * @dev Create a PoSt challenge for a provider
     */
    function createPoStChallenge(
        uint256 dealId,
        address provider,
        uint256[] calldata leafIndices
    ) external onlyOwner returns (uint256) {
        require(
            leafIndices.length == CHALLENGE_SECTORS,
            "Invalid sector count"
        );

        uint256 challengeId = challengeCount++;
        postChallenges[challengeId] = PoStChallenge({
            dealId: dealId,
            provider: provider,
            challengeTimestamp: block.timestamp,
            deadline: block.timestamp + POST_INTERVAL + GRACE_PERIOD,
            leafIndices: leafIndices,
            submitted: false,
            verified: false
        });

        emit PoStChallengeCreated(challengeId, dealId, provider);
        return challengeId;
    }

    /**
     * @dev Submit PoSt proof response
     * @param challengeId The ID of the challenge
     * @param leafData The actual data at the challenged indices
     * @param proofs The Merkle paths for each leaf
     */
    function submitPoSt(
        uint256 challengeId,
        bytes32[] calldata leafData,
        bytes32[][] calldata proofs
    ) external {
        PoStChallenge storage challenge = postChallenges[challengeId];
        require(challenge.provider == msg.sender, "Not challenge owner");
        require(!challenge.submitted, "Already submitted");
        require(block.timestamp <= challenge.deadline, "Deadline passed");
        require(leafData.length == CHALLENGE_SECTORS, "Invalid leaf count");

        // Get the Merkle root from the PoRep
        bytes32 root = porepProofs[challenge.dealId][msg.sender].sealedCID;
        require(root != bytes32(0), "PoRep not found");

        // Verify Merkle proofs
        for (uint256 i = 0; i < CHALLENGE_SECTORS; i++) {
            bytes32 leaf = keccak256(abi.encodePacked(leafData[i]));
            require(
                MerkleProof.verify(proofs[i], root, leaf),
                "Invalid Merkle proof"
            );
        }

        challenge.submitted = true;
        challenge.verified = true;

        lastPostSubmission[msg.sender][challenge.dealId] = block.timestamp;
        consecutiveMisses[msg.sender] = 0;

        emit PoStSubmitted(challengeId, msg.sender);
        emit PoStVerified(challengeId);
    }

    /**
     * @dev Check for missed PoSt (called by automated service)
     */
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

    /**
     * @dev Verify PoRep proof (simplified - production uses zk-SNARKs)
     */
    function _verifyPoRepProof(
        bytes32 sealedCID,
        bytes32 unsealedCID,
        bytes calldata proofData
    ) internal pure returns (bool) {
        // Simplified verification
        // In production: verify zk-SNARK that proves sealedCID = Seal(unsealedCID, providerID)

        // For now, just check that proof data is not empty and CIDs are valid
        if (proofData.length == 0) return false;
        if (sealedCID == bytes32(0) || unsealedCID == bytes32(0)) return false;

        // In production, use Groth16 or PLONK verification
        return true;
    }

    /**
     * @dev Get PoRep proof for a deal/provider
     */
    function getPoRepProof(
        uint256 dealId,
        address provider
    )
        external
        view
        returns (
            bytes32 sealedCID,
            bytes32 unsealedCID,
            uint256 timestamp,
            bool verified
        )
    {
        PoRepProof storage proof = porepProofs[dealId][provider];
        return (
            proof.sealedCID,
            proof.unsealedCID,
            proof.timestamp,
            proof.verified
        );
    }

    /**
     * @dev Get PoSt challenge details
     */
    function getPoStChallenge(
        uint256 challengeId
    )
        external
        view
        returns (
            uint256 dealId,
            address provider,
            uint256 challengeTimestamp,
            uint256 deadline,
            bool submitted,
            bool verified
        )
    {
        PoStChallenge storage challenge = postChallenges[challengeId];
        return (
            challenge.dealId,
            challenge.provider,
            challenge.challengeTimestamp,
            challenge.deadline,
            challenge.submitted,
            challenge.verified
        );
    }

    /**
     * @dev Get the challenged leaf indices for a specific challenge
     */
    function getChallengeIndices(
        uint256 challengeId
    ) external view returns (uint256[] memory) {
        return postChallenges[challengeId].leafIndices;
    }

    /**
     * @dev Check if provider needs to submit PoSt for a deal
     */
    function needsPoSt(
        address provider,
        uint256 dealId
    ) external view returns (bool) {
        uint256 lastSubmission = lastPostSubmission[provider][dealId];
        if (lastSubmission == 0) return true; // Never submitted
        return block.timestamp >= lastSubmission + POST_INTERVAL;
    }

    /**
     * @dev Get consecutive misses for a provider
     */
    function getConsecutiveMisses(
        address provider
    ) external view returns (uint256) {
        return consecutiveMisses[provider];
    }
}
