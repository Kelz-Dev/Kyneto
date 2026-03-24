"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlockchainListener = void 0;
var ethers_1 = require("ethers");
/**
 * BlockchainListener - Listens to smart contract events and syncs to database
 * Processes events from all 7 contracts
 */
var BlockchainListener = /** @class */ (function () {
    function BlockchainListener(rpcUrl, db, logger) {
        this.contracts = new Map();
        this.provider = new ethers_1.ethers.JsonRpcProvider(rpcUrl);
        this.logger = logger;
        this.db = db;
    }
    /**
     * Initialize contracts
     */
    BlockchainListener.prototype.initialize = function (contractAddresses) {
        return __awaiter(this, void 0, void 0, function () {
            var contracts, _i, contracts_1, _a, name_1, address, events, contract;
            return __generator(this, function (_b) {
                this.logger.info('Initializing blockchain listener...');
                contracts = [
                    { name: 'marketplace', address: contractAddresses.marketplace, events: marketplaceABI },
                    { name: 'registry', address: contractAddresses.registry, events: registryABI },
                    { name: 'pledges', address: contractAddresses.pledges, events: pledgesABI },
                    { name: 'prover', address: contractAddresses.prover, events: proverABI },
                    { name: 'slashing', address: contractAddresses.slashing, events: slashingABI },
                    { name: 'payments', address: contractAddresses.payments, events: paymentsABI }
                ];
                for (_i = 0, contracts_1 = contracts; _i < contracts_1.length; _i++) {
                    _a = contracts_1[_i], name_1 = _a.name, address = _a.address, events = _a.events;
                    contract = new ethers_1.ethers.Contract(address, events, this.provider);
                    this.contracts.set(name_1, contract);
                    this.logger.info("Loaded ".concat(name_1, " contract at ").concat(address));
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Start listening to all events
     */
    BlockchainListener.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var marketplace, registry, pledges, prover, slashing, payments;
            var _this = this;
            return __generator(this, function (_a) {
                this.logger.info('Starting blockchain event listeners...');
                marketplace = this.contracts.get('marketplace');
                marketplace.on('DealCreated', function (dealId, client, fileSizeGB, totalCost, event) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleDealCreated(dealId, client, fileSizeGB, totalCost, event)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                marketplace.on('ShardAssigned', function (dealId, provider, shardIndex, shardCID, event) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleShardAssigned(dealId, provider, shardIndex, shardCID, event)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                marketplace.on('DealCompleted', function (dealId, event) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleDealCompleted(dealId, event)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                marketplace.on('ShardLost', function (dealId, provider, shardIndex, event) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleShardLost(dealId, provider, shardIndex, event)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                registry = this.contracts.get('registry');
                registry.on('ProviderRegistered', function (provider, peerId, region, event) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleProviderRegistered(provider, peerId, region, event)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                registry.on('ReputationUpdated', function (provider, newScore, reason, event) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleReputationUpdated(provider, newScore, reason, event)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                pledges = this.contracts.get('pledges');
                pledges.on('PledgeCreated', function (provider, pledgeId, capacityGB, duration, collateral, event) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handlePledgeCreated(provider, pledgeId, capacityGB, duration, collateral, event)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                prover = this.contracts.get('prover');
                prover.on('PoStSubmitted', function (challengeId, provider, event) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handlePoStSubmitted(challengeId, provider, event)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                prover.on('PoStMissed', function (challengeId, provider, event) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handlePoStMissed(challengeId, provider, event)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                slashing = this.contracts.get('slashing');
                slashing.on('ProviderSlashed', function (provider, amount, reason, event) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleProviderSlashed(provider, amount, reason, event)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                payments = this.contracts.get('payments');
                payments.on('RewardsWithdrawn', function (provider, amount, event) { return __awaiter(_this, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, this.handleRewardsWithdrawn(provider, amount, event)];
                            case 1:
                                _a.sent();
                                return [2 /*return*/];
                        }
                    });
                }); });
                this.logger.info('✅ All event listeners active');
                return [2 /*return*/];
            });
        });
    };
    /**
     * Event handlers
     */
    BlockchainListener.prototype.handleDealCreated = function (dealId, client, fileSizeGB, totalCost, event) {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info("Deal created: #".concat(dealId, " by ").concat(client));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.db.query("INSERT INTO deals (deal_id, client_address, file_size_gb, total_cost, status, created_at, block_number)\n         VALUES ($1, $2, $3, $4, 'active', NOW(), $5)", [dealId.toString(), client, fileSizeGB.toString(), totalCost.toString(), event.log.blockNumber])];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.logger.error('Error handling DealCreated:', error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlockchainListener.prototype.handleShardAssigned = function (dealId, provider, shardIndex, shardCID, event) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.debug("Shard assigned: Deal ".concat(dealId, ", Shard ").concat(shardIndex, " \u2192 ").concat(provider));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.db.query("INSERT INTO shards (deal_id, provider_address, shard_index, shard_cid, active, created_at)\n         VALUES ($1, $2, $3, $4, true, NOW())", [dealId.toString(), provider, shardIndex.toString(), shardCID])];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        this.logger.error('Error handling ShardAssigned:', error_2);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlockchainListener.prototype.handleDealCompleted = function (dealId, event) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info("Deal completed: #".concat(dealId));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.db.query('UPDATE deals SET status = $1, completed_at = NOW() WHERE deal_id = $2', ['completed', dealId.toString()])];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_3 = _a.sent();
                        this.logger.error('Error handling DealCompleted:', error_3);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlockchainListener.prototype.handleShardLost = function (dealId, provider, shardIndex, event) {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.warn("Shard lost: Deal ".concat(dealId, ", Shard ").concat(shardIndex, " from ").concat(provider));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.db.query('UPDATE shards SET active = false, lost_at = NOW() WHERE deal_id = $1 AND provider_address = $2', [dealId.toString(), provider])];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_4 = _a.sent();
                        this.logger.error('Error handling ShardLost:', error_4);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlockchainListener.prototype.handleProviderRegistered = function (provider, peerId, region, event) {
        return __awaiter(this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info("Provider registered: ".concat(provider, " (").concat(region, ")"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.db.query("INSERT INTO providers (address, peer_id, region, reputation_score, active, registered_at)\n         VALUES ($1, $2, $3, 50, true, NOW())\n         ON CONFLICT (address) DO NOTHING", [provider, peerId, region])];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_5 = _a.sent();
                        this.logger.error('Error handling ProviderRegistered:', error_5);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlockchainListener.prototype.handleReputationUpdated = function (provider, newScore, reason, event) {
        return __awaiter(this, void 0, void 0, function () {
            var error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.debug("Reputation updated: ".concat(provider, " \u2192 ").concat(newScore, " (").concat(reason, ")"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.db.query('UPDATE providers SET reputation_score = $1 WHERE address = $2', [newScore.toString(), provider])];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_6 = _a.sent();
                        this.logger.error('Error handling ReputationUpdated:', error_6);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlockchainListener.prototype.handlePledgeCreated = function (provider, pledgeId, capacityGB, duration, collateral, event) {
        return __awaiter(this, void 0, void 0, function () {
            var error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info("Pledge created: ".concat(provider, " - ").concat(capacityGB, "GB for ").concat(duration, "s"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.db.query("INSERT INTO capacity_pledges (provider_address, pledge_id, capacity_gb, duration_seconds, collateral, active, created_at)\n         VALUES ($1, $2, $3, $4, $5, true, NOW())", [provider, pledgeId.toString(), capacityGB.toString(), duration.toString(), collateral.toString()])];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_7 = _a.sent();
                        this.logger.error('Error handling PledgeCreated:', error_7);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlockchainListener.prototype.handlePoStSubmitted = function (challengeId, provider, event) {
        return __awaiter(this, void 0, void 0, function () {
            var error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.debug("PoSt submitted: Challenge ".concat(challengeId, " by ").concat(provider));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.db.query('UPDATE providers SET last_proof_at = NOW() WHERE address = $1', [provider])];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_8 = _a.sent();
                        this.logger.error('Error handling PoStSubmitted:', error_8);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlockchainListener.prototype.handlePoStMissed = function (challengeId, provider, event) {
        return __awaiter(this, void 0, void 0, function () {
            var error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.warn("PoSt missed: Challenge ".concat(challengeId, " by ").concat(provider));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.db.query("INSERT INTO proof_misses (provider_address, challenge_id, missed_at)\n         VALUES ($1, $2, NOW())", [provider, challengeId.toString()])];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_9 = _a.sent();
                        this.logger.error('Error handling PoStMissed:', error_9);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlockchainListener.prototype.handleProviderSlashed = function (provider, amount, reason, event) {
        return __awaiter(this, void 0, void 0, function () {
            var error_10;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.warn("Provider slashed: ".concat(provider, " - ").concat(ethers_1.ethers.formatEther(amount), " STK (").concat(reason, ")"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.db.query("INSERT INTO slashing_events (provider_address, amount, reason, slashed_at)\n         VALUES ($1, $2, $3, NOW())", [provider, amount.toString(), reason])];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_10 = _a.sent();
                        this.logger.error('Error handling ProviderSlashed:', error_10);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    BlockchainListener.prototype.handleRewardsWithdrawn = function (provider, amount, event) {
        return __awaiter(this, void 0, void 0, function () {
            var error_11;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger.info("Rewards withdrawn: ".concat(provider, " - ").concat(ethers_1.ethers.formatEther(amount), " STK"));
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.db.query("INSERT INTO withdrawals (provider_address, amount, withdrawn_at)\n         VALUES ($1, $2, NOW())", [provider, amount.toString()])];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_11 = _a.sent();
                        this.logger.error('Error handling RewardsWithdrawn:', error_11);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    return BlockchainListener;
}());
exports.BlockchainListener = BlockchainListener;
// Minimal ABIs (only events)
var marketplaceABI = [
    'event DealCreated(uint256 indexed dealId, address indexed client, uint256 fileSizeGB, uint256 totalCost)',
    'event ShardAssigned(uint256 indexed dealId, address indexed provider, uint256 shardIndex, string shardCID)',
    'event DealCompleted(uint256 indexed dealId)',
    'event ShardLost(uint256 indexed dealId, address indexed provider, uint256 shardIndex)'
];
var registryABI = [
    'event ProviderRegistered(address indexed provider, string peerId, string region)',
    'event ReputationUpdated(address indexed provider, uint256 newScore, string reason)'
];
var pledgesABI = [
    'event PledgeCreated(address indexed provider, uint256 indexed pledgeId, uint256 capacityGB, uint256 duration, uint256 collateral)'
];
var proverABI = [
    'event PoStSubmitted(uint256 indexed challengeId, address indexed provider)',
    'event PoStMissed(uint256 indexed challengeId, address indexed provider)'
];
var slashingABI = [
    'event ProviderSlashed(address indexed provider, uint256 amount, string reason)'
];
var paymentsABI = [
    'event RewardsWithdrawn(address indexed provider, uint256 amount)'
];
