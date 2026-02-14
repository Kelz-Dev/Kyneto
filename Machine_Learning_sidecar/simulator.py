"""
Kyneto Protocol Simulator
=========================
Generates synthetic provider profiles and protocol events for data science modeling.
Based on specifications from data_understanding.md:
- 5,000 simulated provider profiles
- ~25,000 simulated events  
- 12 primary features
- 2% random noise injection for realistic simulation
- 3 months of simulated network activity
"""

import random
import csv
import os
from datetime import datetime, timedelta
from typing import List, Dict, Any
import math

# Configuration - Based on data_understanding.md specifications
NUM_PROVIDERS = 5000  # Per documentation: "5,000 simulated provider profiles"
SIMULATION_DAYS = 90  # Per documentation: "3 months of network activity"
TARGET_EVENTS = 25000  # Per documentation: "~25,000 simulated events"
NOISE_PERCENTAGE = 0.02  # Per documentation: "inject 2% random noise"
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), 'data')

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Region distribution (weighted) - Per documentation: "geographic_location"
REGIONS = ['US-East', 'US-West', 'EU-West', 'EU-Central', 'Asia-Pacific', 'South-America']
REGION_WEIGHTS = [0.25, 0.20, 0.20, 0.15, 0.15, 0.05]


def generate_provider_id() -> str:
    """Generate a random Ethereum-like address."""
    return '0x' + ''.join(random.choices('0123456789abcdef', k=40))


def inject_noise(value: float, noise_pct: float = NOISE_PERCENTAGE, min_val: float = 0.0, max_val: float = 1.0) -> float:
    """Inject random noise into a value to simulate real-world variability."""
    noise = random.uniform(-noise_pct, noise_pct)
    noisy_value = value * (1 + noise) + random.gauss(0, noise_pct * 0.5)
    return max(min_val, min(max_val, noisy_value))


def generate_providers(n: int) -> List[Dict[str, Any]]:
    """
    Generate n synthetic provider profiles with realistic noise.
    Per data_understanding.md - 12 primary features with realistic distributions.
    """
    providers = []
    base_date = datetime.now() - timedelta(days=SIMULATION_DAYS)
    
    # Realistic failure rate: ~15-25% of providers will eventually fail
    # This aligns with business goal of 80% precision (not 100%)
    target_failure_rate = random.uniform(0.15, 0.25)
    
    for i in range(n):
        # Determine provider reliability tier
        # Distribution: 10% platinum, 20% gold, 40% silver, 30% bronze
        reliability = random.choices(
            ['platinum', 'gold', 'silver', 'bronze'],
            weights=[0.10, 0.20, 0.40, 0.30]
        )[0]
        
        # Base stats vary by reliability tier with NOISE
        if reliability == 'platinum':
            uptime_base = inject_noise(0.98, 0.03, 0.90, 1.0)
            latency_base = inject_noise(50, 0.20, 20, 150) 
            fail_prob = inject_noise(0.03, 0.50, 0.01, 0.10)
        elif reliability == 'gold':
            uptime_base = inject_noise(0.93, 0.05, 0.85, 0.99)
            latency_base = inject_noise(120, 0.25, 50, 300)
            fail_prob = inject_noise(0.08, 0.40, 0.03, 0.15)
        elif reliability == 'silver':
            uptime_base = inject_noise(0.85, 0.08, 0.70, 0.95)
            latency_base = inject_noise(250, 0.30, 100, 500)
            fail_prob = inject_noise(0.18, 0.35, 0.10, 0.30)
        else:  # bronze - high failure candidates
            uptime_base = inject_noise(0.70, 0.15, 0.50, 0.85)
            latency_base = inject_noise(450, 0.35, 200, 800)
            fail_prob = inject_noise(0.35, 0.30, 0.20, 0.50)
        
        # Registration date (random within simulation period)
        days_ago = random.randint(1, SIMULATION_DAYS)
        registered_at = base_date + timedelta(days=SIMULATION_DAYS - days_ago)
        
        # Stake with realistic distribution (log-normal for economic data)
        stake = round(math.exp(random.gauss(8.5, 1.5)), 2)  # Range ~500 to 100,000
        stake = max(500, min(100000, stake))
        
        # Capacity with noise
        capacity = int(inject_noise(random.randint(100, 5000), 0.10, 50, 10000))
        
        provider = {
            'provider_id': generate_provider_id(),
            'stake': stake,
            'capacity_gb': capacity,
            'utilization_gb': 0,
            'region': random.choices(REGIONS, weights=REGION_WEIGHTS)[0],
            'node_age_days': days_ago,
            'uptime_pct': round(uptime_base, 4),
            'avg_latency': round(latency_base, 2),
            'post_success_rate': round(1.0 - fail_prob, 4),
            'proof_misses': 0,
            'slashing_count': 0,
            'is_failed': False,
            'reliability_tier': reliability,
            'registered_at': registered_at.isoformat(),
            '_fail_probability': fail_prob  # Internal tracking
        }
        
        # Add 5% missing region data per documentation
        if random.random() < 0.05:
            provider['region'] = None
        
        providers.append(provider)
    
    return providers


def simulate_events(providers: List[Dict[str, Any]], days: int, target_events: int) -> List[Dict[str, Any]]:
    """
    Simulate protocol events with realistic noise and failure patterns.
    Per documentation: ~25,000 events, various failure modes including
    sudden disconnects and gradual latency increases.
    """
    events = []
    base_date = datetime.now() - timedelta(days=days)
    
    # Calculate events per day to hit target
    events_per_day = target_events // days
    
    # Pre-calculate failure probabilities
    provider_map = {p['provider_id']: p for p in providers}
    
    # Track "degrading" providers (simulate gradual latency increases)
    degrading_providers = set(random.sample(
        [p['provider_id'] for p in providers], 
        k=int(len(providers) * 0.10)  # 10% will degrade over time
    ))
    
    for day in range(days):
        current_date = base_date + timedelta(days=day)
        
        # Add daily variance to event count (+-15%)
        daily_events = int(events_per_day * random.uniform(0.85, 1.15))
        
        for _ in range(daily_events):
            provider = random.choice(providers)
            pid = provider['provider_id']
            prov = provider_map[pid]
            
            # Determine event type
            event_type = random.choices(
                ['post_challenge', 'deal_created', 'deal_completed', 'heartbeat'],
                weights=[0.40, 0.20, 0.15, 0.25]
            )[0]
            
            # Calculate latency with noise and potential degradation
            base_latency = prov['avg_latency']
            if pid in degrading_providers:
                # Gradual latency increase over time
                degradation_factor = 1.0 + (day / days) * random.uniform(0.5, 2.0)
                base_latency *= degradation_factor
                prov['avg_latency'] = round(base_latency, 2)
            
            latency = inject_noise(base_latency, 0.15, 10, 2000)
            
            event = {
                'event_id': f"evt_{day}_{random.randint(10000, 99999)}",
                'provider_id': pid,
                'event_type': event_type,
                'timestamp': (current_date + timedelta(
                    hours=random.randint(0, 23), 
                    minutes=random.randint(0, 59)
                )).isoformat(),
                'success': True,
                'latency_ms': round(latency, 2),
                'data_size_gb': 0
            }
            
            # Simulate failures with noise
            if event_type == 'post_challenge':
                fail_prob = prov['_fail_probability']
                
                # Add daily variance to failure probability
                daily_fail_prob = inject_noise(fail_prob, 0.20, 0.0, 1.0)
                
                # Sudden disconnect simulation (5% chance of random failure)
                if random.random() < 0.05:
                    daily_fail_prob = min(1.0, daily_fail_prob + 0.30)
                
                if random.random() < daily_fail_prob:
                    event['success'] = False
                    prov['proof_misses'] += 1
                    
                    # Trigger slashing after threshold
                    if prov['proof_misses'] >= 3 and random.random() < 0.70:
                        prov['slashing_count'] += 1
            
            elif event_type == 'deal_created':
                event['data_size_gb'] = random.randint(1, 100)
                prov['utilization_gb'] += event['data_size_gb']
            
            elif event_type == 'deal_completed':
                event['data_size_gb'] = random.randint(1, 50)
            
            events.append(event)
    
    # Mark failed providers based on realistic criteria
    # Target: 15-25% failure rate per documentation design
    for provider in providers:
        prov = provider_map[provider['provider_id']]
        
        # Calculate failure score based on multiple factors
        # Higher score = more likely to fail
        proof_miss_factor = min(1.0, prov['proof_misses'] / 5) * 0.25
        slashing_factor = min(1.0, prov['slashing_count'] / 2) * 0.20
        uptime_factor = max(0, 1.0 - prov['uptime_pct']) * 0.25  # Low uptime = high factor
        latency_factor = min(1.0, prov['avg_latency'] / 500) * 0.15
        
        # Add inherent reliability factor based on original _fail_probability
        inherent_factor = prov['_fail_probability'] * 0.15
        
        failure_score = (
            proof_miss_factor + 
            slashing_factor + 
            uptime_factor + 
            latency_factor + 
            inherent_factor
        )
        
        # Add noise to failure score itself
        failure_score = inject_noise(failure_score, 0.25, 0.0, 1.0)
        
        # Lower threshold to achieve ~15-25% failure rate
        # Using 0.26 as threshold with noise to get variability
        failure_threshold = inject_noise(0.26, 0.30, 0.20, 0.40)
        
        if failure_score > failure_threshold:
            provider['is_failed'] = True
    
    return events


def save_to_csv(data: List[Dict[str, Any]], filename: str, exclude_fields: List[str] = None):
    """Save data to CSV file, optionally excluding internal fields."""
    if not data:
        return
    
    exclude_fields = exclude_fields or []
    
    # Get fields, excluding internal ones
    fieldnames = [k for k in data[0].keys() if k not in exclude_fields]
    
    filepath = os.path.join(OUTPUT_DIR, filename)
    with open(filepath, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames, extrasaction='ignore')
        writer.writeheader()
        writer.writerows(data)
    
    print(f"[OK] Saved {len(data)} records to {filepath}")


def main():
    print("[>] Kyneto Protocol Simulator")
    print("    Based on data_understanding.md specifications:")
    print(f"    - Providers: {NUM_PROVIDERS}")
    print(f"    - Target Events: ~{TARGET_EVENTS}")
    print(f"    - Noise Level: {NOISE_PERCENTAGE*100}%")
    print(f"    - Simulation Days: {SIMULATION_DAYS}")
    print()
    
    print("   Generating providers...")
    providers = generate_providers(NUM_PROVIDERS)
    
    print("   Simulating events...")
    events = simulate_events(providers, SIMULATION_DAYS, TARGET_EVENTS)
    
    # Save without internal fields
    save_to_csv(providers, 'providers_v2.csv', exclude_fields=['reliability_tier', '_fail_probability'])
    save_to_csv(events, 'events_v2.csv')
    
    # Summary statistics
    failed_count = sum(1 for p in providers if p['is_failed'])
    missing_region = sum(1 for p in providers if p.get('region') is None)
    
    print(f"\n[STATS] Summary:")
    print(f"   Total Providers: {len(providers)}")
    print(f"   Total Events: {len(events)}")
    print(f"   Failed Providers: {failed_count} ({failed_count/len(providers)*100:.1f}%)")
    print(f"   Missing Region: {missing_region} ({missing_region/len(providers)*100:.1f}%)")
    print(f"\n   Target failure rate aligns with 80% precision goal (not 100%)")


if __name__ == '__main__':
    main()
