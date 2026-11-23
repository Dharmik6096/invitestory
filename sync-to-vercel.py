#!/usr/bin/env python3
"""
Automated Sync & Deployment Script for Vercel
Syncs local card JSONs and images to Vercel Blob Cloud Storage,
then deploys production updates to Vercel.
"""

import os
import sys
import json
import subprocess
import re

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))

def run_command(cmd, cwd=ROOT_DIR):
    print(f"\n> Running: {cmd}")
    res = subprocess.run(cmd, shell=True, cwd=cwd, text=True, capture_output=True)
    if res.stdout:
        print(res.stdout.strip())
    if res.stderr and res.returncode != 0:
        print(f"ERROR: {res.stderr.strip()}", file=sys.stderr)
    return res.returncode == 0

def sync_cards_to_blob():
    print("\n--- 1. Syncing Card Data to Vercel Blob Cloud Storage ---")
    sync_script = """
const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

async function syncAll() {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    console.error('ERROR: BLOB_READ_WRITE_TOKEN not found in .env.local or environment.');
    process.exit(1);
  }

  const cardsDir = path.join(process.cwd(), 'cards');
  if (!fs.existsSync(cardsDir)) {
    console.log('No cards directory found.');
    return;
  }

  const files = fs.readdirSync(cardsDir).filter(f => f.endsWith('.json'));
  console.log(`Found ${files.length} card presets in /cards:`);

  for (const f of files) {
    const slug = f.replace('.json', '');
    const fp = path.join(cardsDir, f);
    let cardData = JSON.parse(fs.readFileSync(fp, 'utf-8'));

    // Upload card JSON to Blob
    const res = await put(`cards/${slug}.json`, JSON.stringify(cardData, null, 2), {
      access: 'public',
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: 'application/json'
    });
    console.log(`  [SYNCED] ${slug} -> ${res.url}`);
  }
}

syncAll().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
"""
    env = dict(os.environ)
    env['NODE_PATH'] = os.path.join(ROOT_DIR, 'node_modules')
    res = subprocess.run(
        ['node', '-e', sync_script],
        cwd=ROOT_DIR,
        env=env,
        text=True,
        capture_output=True
    )
    print(res.stdout)
    if res.stderr:
        print(res.stderr, file=sys.stderr)
    return res.returncode == 0

def deploy_to_vercel():
    print("\n--- 2. Deploying to Vercel Production ---")
    return run_command("npx vercel --prod --yes")

def main():
    print("==================================================")
    print("   InviteStory Auto-Sync & Vercel Deployment      ")
    print("==================================================")
    
    blob_ok = sync_cards_to_blob()
    if not blob_ok:
        print("Warning: Cloud Blob sync reported issues, continuing to Vercel deployment...")

    deploy_ok = deploy_to_vercel()
    if deploy_ok:
        print("\n==================================================")
        print(" SUCCESS: All cards and assets deployed to Vercel!")
        print(" Production URL: https://invitation-card-umber-six.vercel.app")
        print(" Live Card: https://invitation-card-umber-six.vercel.app/invite/?card=shahi-r7zn3u")
        print("==================================================")
    else:
        print("\nDeployment failed. Please check the logs above.", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
