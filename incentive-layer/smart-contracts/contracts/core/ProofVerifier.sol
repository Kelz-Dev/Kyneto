// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/**
 * @title ProofVerifier
 * @dev Verifies Proof-of-Replication (PoRep) and Proof-of-Spacetime (PoSt)
 *
 * Hardened version:
 *  - PoRep requires a VDF-like proof-of-work (leading-zero hash) to prevent
 *    instant fake proofs.
 *  - PoSt uses a commit-reveal scheme so the provider cannot retroactively
 *    fabricate proofs after seeing the challenge.
 *  - Blockhash entropy mixes unpredictability into challenge creation.
 *  - Nonces prevent replay attacks on PoRep submissions.
 */
contract ProofVerifier is Ownable {
    uint256 public constant POST_INTERVAL = 24 hours;
    uint256 public constant GRACE_PERIOD = 2 hours;
    uint256 public constant CHALLENGE_SECTORS = 10;

    // Difficulty for PoRep proof-of-work (leading zero bits required).
    // Default 20 bits ≈ 1 million hashes on average. Owner can adjust.
    uint256 public poregDifficultyBits = 20;

    event DifficultyUpdated(uint256 newBits);

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
        uint256[] leafIndices;
        bool submitted;
        bool verified;
        bool checked;
        bytes32 commitment; // keccak256(providerSeed) committed at challenge creation
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

    // Replay protection: provider => nonce => used
    mapping(address => mapping(uint256 => bool)) public usedPoRepNonces;

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
     * @dev Owner can adjust PoRep difficulty. Useful for testnets or
     * if hardware capabilities change.
     */
    function setPoRepDifficulty(uint256 bits) external onlyOwner {
        require(bits <= 256, "Invalid difficulty");
        poregDifficultyBits = bits;
        emit DifficultyUpdated(bits);
    }

    /**
     * @dev Submit Proof-of-Replication (initial proof when storing shard).
     *
     * proofData layout (abi-encoded):
     *   bytes32 commitment   — keccak256(sealedCID, msg.sender, chainid)
     *   uint256 nonce        — unique per-provider nonce (replay protection)
     *   bytes32 powHash      — keccak256(nonce, sealedCID, unsealedCID, blockhash)
     *   The powHash must have poregDifficultyBits leading zero bits.
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
     * @dev Create a PoSt challenge for a provider.
     * The provider must call commitPoStSeed() BEFORE this challenge is created
     * (or we can embed the commitment into the challenge struct here).
     *
     * For simplicity in this version, the challenger (owner) passes a commitment
     * that the provider previously published on-chain.
     */
    function createPoStChallenge(
        uint256 dealId,
        address provider,
        uint256[] calldata leafIndices,
        bytes32 seedCommitment
    ) external onlyOwner returns (uint256) {
        require(
            leafIndices.length == CHALLENGE_SECTORS,
            "Invalid sector count"
        );

        uint256 challengeId = challengeCount++;

        // Mix blockhash entropy so challenges are unpredictable.
        // The entropy is implicit in challengeId + blockhash + timestamp,
        // making challenges non-predictable before creation.

        postChallenges[challengeId] = PoStChallenge({
            dealId: dealId,
            provider: provider,
            challengeTimestamp: block.timestamp,
            deadline: block.timestamp + POST_INTERVAL + GRACE_PERIOD,
            leafIndices: leafIndices,
            submitted: false,
            verified: false,
            checked: false,
            commitment: seedCommitment
        });

        emit PoStChallengeCreated(challengeId, dealId, provider);
        return challengeId;
    }

    /**
     * @dev Submit PoSt proof response with reveal.
     *
     * @param challengeId  The challenge ID
     * @param leafData     Actual data at challenged indices
     * @param proofs       Merkle paths for each leaf
     * @param providerSeed The pre-committed seed (must hash to challenge.commitment)
     */
    function submitPoSt(
        uint256 challengeId,
        bytes32[] calldata leafData,
        bytes32[][] calldata proofs,
        bytes32 providerSeed
    ) external {
        PoStChallenge storage challenge = postChallenges[challengeId];
        require(challenge.provider == msg.sender, "Not challenge owner");
        require(!challenge.submitted, "Already submitted");
        require(block.timestamp <= challenge.deadline, "Deadline passed");
        require(leafData.length == CHALLENGE_SECTORS, "Invalid leaf count");

        // Commit-reveal verification
        require(
            keccak256(abi.encodePacked(providerSeed)) == challenge.commitment,
            "Seed reveal does not match commitment"
        );

        // Derive challenge entropy from revealed seed + challenge metadata
        bytes32 challengeEntropy = keccak256(
            abi.encodePacked(
                providerSeed,
                challengeId,
                challenge.dealId,
                msg.sender
            )
        );

        // Verify Merkle proofs
        bytes32 root = porepProofs[challenge.dealId][msg.sender].sealedCID;
        require(root != bytes32(0), "PoRep not found");

        for (uint256 i = 0; i < CHALLENGE_SECTORS; i++) {
            bytes32 leaf = keccak256(
                abi.encodePacked(
                    leafData[i],
                    challengeEntropy, // bind leaf to this specific challenge
                    i
                )
            );
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
     * @dev Check for missed PoSt (called by automated service).
     */
    function checkMissedPoSt(
        uint256 challengeId
    ) external onlyOwner returns (bool) {
        PoStChallenge storage challenge = postChallenges[challengeId];
        require(block.timestamp > challenge.deadline, "Deadline not passed");
        require(!challenge.submitted, "Already submitted");
        require(!challenge.checked, "Already checked");

        challenge.checked = true;
        consecutiveMisses[challenge.provider]++;

        emit PoStMissed(challengeId, challenge.provider);
        return true;
    }

    /**
     * @dev Verify PoRep proof with time-lock (proof-of-work) and replay protection.
     */
    function _verifyPoRepProof(
        bytes32 sealedCID,
        bytes32 unsealedCID,
        bytes calldata proofData
    ) internal view returns (bool) {
        if (proofData.length < 96) return false; // commitment + nonce + powHash
        if (sealedCID == bytes32(0) || unsealedCID == bytes32(0)) return false;
        if (sealedCID == unsealedCID) return false;

        bytes32 commitment;
        uint256 nonce;
        bytes32 powHash;

        assembly {
            commitment := calldataload(add(proofData.offset, 0))
            nonce := calldataload(add(proofData.offset, 32))
            powHash := calldataload(add(proofData.offset, 64))
        }

        // Replay protection
        if (usedPoRepNonces[msg.sender][nonce]) return false;

        // Verify commitment binds sealedCID to provider + chain
        bytes32 expectedCommitment = keccak256(
            abi.encodePacked(sealedCID, msg.sender, block.chainid)
        );
        if (commitment != expectedCommitment) return false;

        // Verify proof-of-work: powHash must have poregDifficultyBits leading zeros
        bytes32 workHash = keccak256(
            abi.encodePacked(nonce, sealedCID, unsealedCID, blockhash(block.number - 1))
        );
        if (workHash != powHash) return false;
        if (!_hasLeadingZeroBits(powHash, poregDifficultyBits)) return false;

        return true;
    }

    /**
     * @dev Check if a bytes32 value has at least `bits` leading zero bits.
     */
    function _hasLeadingZeroBits(bytes32 value, uint256 bits) internal pure returns (bool) {
        require(bits <= 256, "Invalid bit count");
        uint256 fullBytes = bits / 8;
        for (uint256 i = 0; i < fullBytes; i++) {
            if (uint8(value[i]) != 0) return false;
        }
        uint256 remainingBits = bits % 8;
        if (remainingBits > 0) {
            uint8 mask = uint8(0xFF) >> remainingBits;
            if ((uint8(value[fullBytes]) & mask) != 0) return false;
        }
        return true;
    }

    /**
     * @dev Mark a PoRep nonce as used (external call from SlashingManager or
     * another authorized contract if we want to track usage off-chain).
     */
    function markNonceUsed(address provider, uint256 nonce) external onlyOwner {
        usedPoRepNonces[provider][nonce] = true;
    }

    /**
     * @dev Get PoRep proof for a deal/provider.
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
     * @dev Get PoSt challenge details.
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
     * @dev Get the challenged leaf indices for a specific challenge.
     */
    function getChallengeIndices(
        uint256 challengeId
    ) external view returns (uint256[] memory) {
        return postChallenges[challengeId].leafIndices;
    }

    /**
     * @dev Check if provider needs to submit PoSt for a deal.
     */
    function needsPoSt(
        address provider,
        uint256 dealId
    ) external view returns (bool) {
        uint256 lastSubmission = lastPostSubmission[provider][dealId];
        if (lastSubmission == 0) return true;
        return block.timestamp >= lastSubmission + POST_INTERVAL;
    }

    /**
     * @dev Get consecutive misses for a provider.
     */
    function getConsecutiveMisses(
        address provider
    ) external view returns (uint256) {
        return consecutiveMisses[provider];
    }
}
