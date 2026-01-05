from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import time

app = Flask(__name__)
CORS(app)  # allow frontend to connect

ETHERSCAN_API_KEY = "YOUR_ETHERSCAN_API_KEY"

# Load scam dataset
with open("data/scam_wallets.json") as f:
    SCAM_WALLETS = set(json.load(f))


def fetch_transactions(wallet):
    url = "https://api.etherscan.io/api"
    params = {
        "module": "account",
        "action": "txlist",
        "address": wallet,
        "startblock": 0,
        "endblock": 99999999,
        "sort": "desc",
        "apikey": ETHERSCAN_API_KEY
    }
    res = requests.get(url, params=params).json()
    return res.get("result", [])


def analyze_wallet(wallet, txs):
    score = 0
    reasons = []

    total_tx = len(txs)
    receivers = set()
    total_sent = 0
    timestamps = []

    for tx in txs:
        if tx["from"].lower() == wallet.lower():
            receivers.add(tx["to"])
            total_sent += int(tx["value"])
        timestamps.append(int(tx["timeStamp"]))

    # Rule 1: Scam dataset
    if wallet.lower() in SCAM_WALLETS:
        score += 40
        reasons.append("Found in scam wallet database")

    # Rule 2: High transaction count
    if total_tx > 200:
        score += 15
        reasons.append("High transaction frequency")

    # Rule 3: Large outflow (example threshold)
    if total_sent > 100 * 10**18:
        score += 15
        reasons.append("Large asset outflow detected")

    # Rule 4: Many unique receivers
    if len(receivers) > 30:
        score += 10
        reasons.append("Many unique receivers")

    # Rule 5: Rapid transactions
    if len(timestamps) > 5:
        timestamps.sort()
        if timestamps[-1] - timestamps[-5] < 300:
            score += 10
            reasons.append("Rapid fund movement")

    score = min(score, 100)

    if score >= 60:
        risk_level = "High"
    elif score >= 30:
        risk_level = "Medium"
    else:
        risk_level = "Low"

    return {
        "wallet": wallet,
        "risk_score": score,
        "risk_level": risk_level,
        "reasons": reasons,
        "stats": {
            "total_transactions": total_tx,
            "unique_receivers": len(receivers),
            "total_sent_wei": total_sent
        }
    }


@app.route("/analyze-wallet", methods=["POST"])
def analyze():
    data = request.json
    wallet = data.get("wallet_address")

    if not wallet:
        return jsonify({"error": "Wallet address required"}), 400

    txs = fetch_transactions(wallet)
    result = analyze_wallet(wallet, txs)
    return jsonify(result)


if __name__ == "__main__":
    app.run(debug=True, port=5000)
