"""
Kyneto Data Preparation
=======================
Cleans and prepares data from the Protocol Simulator for ML modeling.
Handles missing values, normalizes features, and engineers new features.
"""

import pandas as pd
import numpy as np
import os
from datetime import datetime

# Paths
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
PROVIDERS_FILE = os.path.join(DATA_DIR, 'providers_v2.csv')
EVENTS_FILE = os.path.join(DATA_DIR, 'events_v2.csv')
OUTPUT_FILE = os.path.join(DATA_DIR, 'training_data_v2.csv')


def load_data():
    """Load provider and event data from CSV files."""
    print("[DIR] Loading data...")
    
    if not os.path.exists(PROVIDERS_FILE):
        raise FileNotFoundError(f"Providers file not found. Run simulator.py first.")
    
    providers = pd.read_csv(PROVIDERS_FILE)
    events = pd.read_csv(EVENTS_FILE) if os.path.exists(EVENTS_FILE) else pd.DataFrame()
    
    print(f"   Loaded {len(providers)} providers")
    print(f"   Loaded {len(events)} events")
    
    return providers, events


def clean_providers(df: pd.DataFrame) -> pd.DataFrame:
    """Clean and validate provider data."""
    print("[CLEAN] Cleaning provider data...")
    
    # Handle missing values
    df['region'] = df['region'].fillna('Unknown')
    df['stake'] = df['stake'].fillna(df['stake'].median())
    
    # Clamp values to valid ranges
    df['uptime_pct'] = df['uptime_pct'].clip(0, 1)
    df['post_success_rate'] = df['post_success_rate'].clip(0, 1)
    df['avg_latency'] = df['avg_latency'].clip(0, 10000)
    
    # Ensure non-negative counts
    df['proof_misses'] = df['proof_misses'].clip(lower=0)
    df['slashing_count'] = df['slashing_count'].clip(lower=0)
    
    return df


def engineer_features(providers: pd.DataFrame, events: pd.DataFrame) -> pd.DataFrame:
    """Create derived features for modeling."""
    print("[GEAR] Engineering features...")
    
    df = providers.copy()
    
    # Utilization ratio
    df['utilization_ratio'] = (df['utilization_gb'] / df['capacity_gb']).fillna(0).clip(0, 1)
    
    # Stake per GB (economic density)
    df['stake_per_gb'] = (df['stake'] / df['capacity_gb']).replace([np.inf, -np.inf], 0).fillna(0)
    
    # Risk score (composite metric)
    df['risk_score'] = (
        (1 - df['uptime_pct']) * 30 +
        (1 - df['post_success_rate']) * 40 +
        df['proof_misses'] * 2 +
        df['slashing_count'] * 10
    ).clip(0, 100)
    
    # Reliability tier (target for classification)
    df['reliability_tier'] = pd.cut(
        df['risk_score'],
        bins=[-1, 10, 25, 50, 100],
        labels=['platinum', 'gold', 'silver', 'bronze']
    )
    
    # Aggregate event stats if events exist
    if not events.empty and 'provider_id' in events.columns:
        event_stats = events.groupby('provider_id').agg({
            'success': 'mean',
            'latency_ms': 'mean'
        }).rename(columns={
            'success': 'event_success_rate',
            'latency_ms': 'event_avg_latency'
        })
        
        df = df.merge(event_stats, left_on='provider_id', right_index=True, how='left')
        df['event_success_rate'] = df['event_success_rate'].fillna(1.0)
        df['event_avg_latency'] = df['event_avg_latency'].fillna(df['avg_latency'])
    else:
        df['event_success_rate'] = df['post_success_rate']
        df['event_avg_latency'] = df['avg_latency']
    
    return df


def encode_categoricals(df: pd.DataFrame) -> pd.DataFrame:
    """Encode categorical variables for ML models."""
    print("[NUM] Encoding categorical variables...")
    
    # One-hot encode region
    region_dummies = pd.get_dummies(df['region'], prefix='region')
    df = pd.concat([df, region_dummies], axis=1)
    
    return df


def select_features(df: pd.DataFrame) -> pd.DataFrame:
    """Select final feature set for training."""
    print("[LIST] Selecting features...")
    
    # Features for modeling
    feature_cols = [
        'stake', 'capacity_gb', 'utilization_gb', 'node_age_days',
        'uptime_pct', 'avg_latency', 'post_success_rate', 'proof_misses',
        'slashing_count', 'utilization_ratio', 'stake_per_gb', 'risk_score',
        'event_success_rate', 'event_avg_latency'
    ]
    
    # Add region dummies
    region_cols = [c for c in df.columns if c.startswith('region_')]
    feature_cols.extend(region_cols)
    
    # Target columns
    target_cols = ['is_failed', 'reliability_tier', 'provider_id']
    
    # Select only existing columns
    all_cols = feature_cols + target_cols
    available_cols = [c for c in all_cols if c in df.columns]
    
    return df[available_cols]


def main():
    print("[>] Kyneto Data Preparation Pipeline")
    print("=" * 50)
    
    # Load data
    providers, events = load_data()
    
    # Clean
    providers = clean_providers(providers)
    
    # Feature engineering
    df = engineer_features(providers, events)
    
    # Encode categoricals
    df = encode_categoricals(df)
    
    # Select features
    final_df = select_features(df)
    
    # Save
    final_df.to_csv(OUTPUT_FILE, index=False)
    print(f"\n[OK] Saved training data to {OUTPUT_FILE}")
    print(f"   Shape: {final_df.shape}")
    print(f"   Columns: {list(final_df.columns)}")
    
    # Quick summary
    if 'is_failed' in final_df.columns:
        failed_pct = final_df['is_failed'].mean() * 100
        print(f"   Failed providers: {failed_pct:.1f}%")


if __name__ == '__main__':
    main()
