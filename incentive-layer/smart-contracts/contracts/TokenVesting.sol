// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title TokenVesting
 * @dev A token holder contract that can release its token balance gradually like a
 * typical vesting scheme, with a cliff and linear release period.
 */
contract TokenVesting is Ownable, ReentrancyGuard {
    struct VestingSchedule {
        address beneficiary;
        uint256 start;
        uint256 cliff;
        uint256 duration;
        uint256 totalAmount;
        uint256 releasedAmount;
        bool revoked;
    }

    IERC20 public immutable token;
    mapping(address => VestingSchedule) public vestingSchedules;
    address[] public beneficiaries;

    event VestingScheduleCreated(
        address indexed beneficiary,
        uint256 amount,
        uint256 start,
        uint256 cliff,
        uint256 duration
    );
    event TokensReleased(address indexed beneficiary, uint256 amount);
    event VestingScheduleRevoked(address indexed beneficiary);

    constructor(address _token) Ownable(msg.sender) {
        require(
            _token != address(0),
            "TokenVesting: token is the zero address"
        );
        token = IERC20(_token);
    }

    /**
     * @dev Creates a new vesting schedule for a beneficiary.
     * @param _beneficiary address of the beneficiary to whom vested tokens are transferred
     * @param _start the time (as Unix time) at which point vesting starts
     * @param _cliff duration in seconds of the cliff in which tokens will begin to vest
     * @param _duration duration in seconds of the period in which the tokens will vest
     * @param _amount total amount of tokens to be released at the end of the vesting
     */
    function createVestingSchedule(
        address _beneficiary,
        uint256 _start,
        uint256 _cliff,
        uint256 _duration,
        uint256 _amount
    ) external onlyOwner {
        require(
            _beneficiary != address(0),
            "TokenVesting: beneficiary is the zero address"
        );
        require(_amount > 0, "TokenVesting: amount must be greater than 0");
        require(
            vestingSchedules[_beneficiary].totalAmount == 0,
            "TokenVesting: schedule already exists"
        );

        uint256 cliffTimestamp = _start + _cliff;
        vestingSchedules[_beneficiary] = VestingSchedule({
            beneficiary: _beneficiary,
            start: _start,
            cliff: cliffTimestamp,
            duration: _duration,
            totalAmount: _amount,
            releasedAmount: 0,
            revoked: false
        });
        beneficiaries.push(_beneficiary);

        emit VestingScheduleCreated(
            _beneficiary,
            _amount,
            _start,
            cliffTimestamp,
            _duration
        );
    }

    /**
     * @dev Releases vested tokens for the caller.
     */
    function release() external nonReentrant {
        VestingSchedule storage schedule = vestingSchedules[msg.sender];
        require(
            schedule.totalAmount > 0,
            "TokenVesting: no vesting schedule found"
        );
        require(!schedule.revoked, "TokenVesting: vesting schedule revoked");

        uint256 vestedAmount = _calculateVestedAmount(schedule);
        uint256 releasableAmount = vestedAmount - schedule.releasedAmount;

        require(releasableAmount > 0, "TokenVesting: no tokens releasable");

        schedule.releasedAmount += releasableAmount;
        require(
            token.transfer(schedule.beneficiary, releasableAmount),
            "TokenVesting: transfer failed"
        );

        emit TokensReleased(schedule.beneficiary, releasableAmount);
    }

    /**
     * @dev Revokes the vesting schedule for a beneficiary.
     * @param _beneficiary address of the beneficiary
     */
    function revoke(address _beneficiary) external onlyOwner {
        VestingSchedule storage schedule = vestingSchedules[_beneficiary];
        require(
            schedule.totalAmount > 0,
            "TokenVesting: no vesting schedule found"
        );
        require(
            !schedule.revoked,
            "TokenVesting: vesting schedule already revoked"
        );

        schedule.revoked = true;

        // Transfer unvested tokens back to owner
        uint256 unvestedAmount = schedule.totalAmount - schedule.releasedAmount;
        if (unvestedAmount > 0) {
            require(
                token.transfer(owner(), unvestedAmount),
                "TokenVesting: refund failed"
            );
        }

        emit VestingScheduleRevoked(_beneficiary);
    }

    /**
     * @dev Calculates the amount of tokens that has already vested.
     * @param schedule the vesting schedule
     * @return the amount of vested tokens
     */
    function _calculateVestedAmount(
        VestingSchedule memory schedule
    ) internal view returns (uint256) {
        if (block.timestamp < schedule.cliff) {
            return 0;
        } else if (block.timestamp >= schedule.start + schedule.duration) {
            return schedule.totalAmount;
        } else {
            return
                (schedule.totalAmount * (block.timestamp - schedule.start)) /
                schedule.duration;
        }
    }

    /**
     * @dev Returns the releasable amount of tokens for a beneficiary.
     * @param _beneficiary address of the beneficiary
     */
    function getReleasableAmount(
        address _beneficiary
    ) external view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[_beneficiary];
        if (schedule.totalAmount == 0 || schedule.revoked) return 0;
        return _calculateVestedAmount(schedule) - schedule.releasedAmount;
    }
}
