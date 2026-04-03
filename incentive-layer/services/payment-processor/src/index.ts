import { Pool } from 'pg';
import { Logger } from 'winston';
import { ethers } from 'ethers';

/**
 * PaymentProcessor - Automated monthly payment distribution
 * Processes capacity rewards, usage rewards, and proof bonuses
 */
export class PaymentProcessor {
    private db: Pool;
    private logger: Logger;
    private provider: ethers.Provider;
    private paymentsContract: ethers.Contract;
    private wallet: ethers.Wallet;
    private processingInterval: NodeJS.Timeout | null = null;

    private readonly DISTRIBUTION_INTERVAL = 30 * 24 * 60 * 60 * 1000; // 30 days

    constructor(
        db: Pool,
        rpcUrl: string,
        paymentsAddress: string,
        privateKey: string,
        logger: Logger
    ) {
        this.db = db;
        this.logger = logger;
        this.provider = new ethers.JsonRpcProvider(rpcUrl);
        this.wallet = new ethers.Wallet(privateKey, this.provider);

        const paymentsABI = [
            'function distributeCapacityRewards(address provider, uint256 pledgeId)',
            'function distributeUsageRewards(uint256 dealId)',
            'function payProofBonus(address provider)'
        ];
        this.paymentsContract = new ethers.Contract(paymentsAddress, paymentsABI, this.wallet);
    }

    /**
     * Start automated payment processing
     */
    start() {
        this.logger.info('Starting payment processor...');

        // Process payments daily (check which are due)
        this.processingInterval = setInterval(async () => {
            await this.processPayments();
        }, 24 * 60 * 60 * 1000); // Daily

        // Also run immediately
        this.processPayments();

        this.logger.info('Payment processor started');
    }

    /**
     * Stop payment processing
     */
    stop() {
        if (this.processingInterval) {
            clearInterval(this.processingInterval);
            this.processingInterval = null;
            this.logger.info('Payment processor stopped');
        }
    }

    /**
     * Process all pending payments
     */
    private async processPayments() {
        try {
            await this.processCapacityRewards();
            await this.processUsageRewards();
            await this.processProofBonuses();
        } catch (error) {
            this.logger.error('Error processing payments:', error);
        }
    }

    /**
     * Process monthly capacity rewards
     */
    private async processCapacityRewards() {
        try {
            // Find pledges that need monthly payment
            const result = await this.db.query(`
        SELECT provider_address, pledge_id
        FROM capacity_pledges
        WHERE active = true
          AND (last_payment_at IS NULL OR last_payment_at < NOW() - INTERVAL '30 days')
        LIMIT 50
      `);

            this.logger.info(`Processing capacity rewards for ${result.rows.length} pledges`);

            for (const row of result.rows) {
                try {
                    const tx = await this.paymentsContract.distributeCapacityRewards(
                        row.provider_address,
                        row.pledge_id
                    );
                    await tx.wait();

                    // Update last payment time
                    await this.db.query(
                        'UPDATE capacity_pledges SET last_payment_at = NOW() WHERE provider_address = $1 AND pledge_id = $2',
                        [row.provider_address, row.pledge_id]
                    );

                    this.logger.info(`Capacity rewards paid: ${row.provider_address} pledge ${row.pledge_id}`);

                } catch (error) {
                    this.logger.error(`Error paying capacity rewards to ${row.provider_address}:`, error);
                }
            }

        } catch (error) {
            this.logger.error('Error processing capacity rewards:', error);
        }
    }

    /**
     * Process usage rewards for completed deals
     */
    private async processUsageRewards() {
        try {
            // Find completed deals not yet paid (exclude cancelled deals)
            const result = await this.db.query(`
        SELECT deal_id
        FROM deals
        WHERE status = 'completed'
          AND status != 'cancelled'
          AND payment_processed = false
        LIMIT 50
      `);

            this.logger.info(`Processing usage rewards for ${result.rows.length} deals`);

            for (const row of result.rows) {
                try {
                    const tx = await this.paymentsContract.distributeUsageRewards(row.deal_id);
                    await tx.wait();

                    // Mark as paid
                    await this.db.query(
                        'UPDATE deals SET payment_processed = true WHERE deal_id = $1',
                        [row.deal_id]
                    );

                    this.logger.info(`Usage rewards paid for deal #${row.deal_id}`);

                } catch (error) {
                    this.logger.error(`Error paying usage rewards for deal ${row.deal_id}:`, error);
                }
            }

        } catch (error) {
            this.logger.error('Error processing usage rewards:', error);
        }
    }

    /**
     * Process proof submission bonuses
     */
    private async processProofBonuses() {
        try {
            // Find providers who submitted proofs in last 24h but not paid bonus
            const result = await this.db.query(`
        SELECT DISTINCT provider_address
        FROM proof_submissions
        WHERE submitted_at > NOW() - INTERVAL '24 hours'
          AND bonus_paid = false
        LIMIT 100
      `);

            this.logger.info(`Processing proof bonuses for ${result.rows.length} providers`);

            for (const row of result.rows) {
                try {
                    const tx = await this.paymentsContract.payProofBonus(row.provider_address);
                    await tx.wait();

                    // Mark bonuses as paid
                    await this.db.query(
                        `UPDATE proof_submissions 
             SET bonus_paid = true 
             WHERE provider_address = $1 
               AND submitted_at > NOW() - INTERVAL '24 hours'`,
                        [row.provider_address]
                    );

                    this.logger.debug(`Proof bonus paid: ${row.provider_address}`);

                } catch (error) {
                    this.logger.error(`Error paying proof bonus to ${row.provider_address}:`, error);
                }
            }

        } catch (error) {
            this.logger.error('Error processing proof bonuses:', error);
        }
    }

    /**
     * Get payment statistics
     */
    async getPaymentStats() {
        const result = await this.db.query(`
      SELECT
        (SELECT SUM(amount) FROM capacity_payments WHERE paid_at > NOW() - INTERVAL '30 days') as capacity_paid_30d,
        (SELECT SUM(amount) FROM usage_payments WHERE paid_at > NOW() - INTERVAL '30 days') as usage_paid_30d,
        (SELECT COUNT(*) FROM proof_submissions WHERE bonus_paid = true AND submitted_at > NOW() - INTERVAL '30 days') as bonuses_paid_30d
    `);

        return result.rows[0];
    }
}
