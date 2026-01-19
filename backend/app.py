from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import time
import os

app = Flask(__name__)
CORS(app)  # allow frontend to connect

# ================= CONFIG =================
ETHERSCAN_API_KEY = os.getenv("ETHERSCAN_API_KEY", "YOUR_ETHERSCAN_API_KEY")

# ================= LOAD SCAM DATA =================
with open("data/scam_wallets.json") as f:
    SCAM_WALLETS = set(wallet.lower() for wallet in json.load(f))


# ================= ETHERSCAN FUNCTIONS =================
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


def fetch_balance(wallet):
    url = "https://api.etherscan.io/api"
    params = {
        "module": "account",
        "action": "balance",
        "address": wallet,
        "tag": "latest",
        "apikey": ETHERSCAN_API_KEY
    }
    res = requests.get(url, params=params).json()
    return int(res.get("result", 0))


# ================= WALLET ANALYSIS =================
def analyze_wallet(wallet, txs):
    score = 0
    reasons = []

    total_tx = len(txs)
    receivers = set()
    total_sent = 0
    timestamps = []

    for tx in txs:
        if tx["from"].lower() == wallet.lower():
            receivers.add(tx["to"].lower())
            total_sent += int(tx["value"])
        timestamps.append(int(tx["timeStamp"]))

    # Rule 1: Scam dataset
    scam_score = 40 if wallet.lower() in SCAM_WALLETS else 0
    if scam_score:
        reasons.append("Found in scam wallet database")
    score += scam_score

    # Rule 2: High transaction count
    high_tx_score = 15 if total_tx > 200 else 0
    if high_tx_score:
        reasons.append("High transaction frequency")
    score += high_tx_score

    # Rule 3: Large outflow
    outflow_score = 15 if total_sent > 100 * 10**18 else 0
    if outflow_score:
        reasons.append("Large asset outflow detected")
    score += outflow_score

    # Rule 4: Many receivers
    receiver_score = 10 if len(receivers) > 30 else 0
    if receiver_score:
        reasons.append("Many unique receivers")
    score += receiver_score

    # Rule 5: Rapid transactions
    rapid_score = 0
    if len(timestamps) > 5:
        timestamps.sort()
        if timestamps[-1] - timestamps[-5] < 300:
            rapid_score = 10
            reasons.append("Rapid fund movement")
    score += rapid_score

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
        "risk_breakdown": {
            "scam_database": scam_score,
            "high_transaction_count": high_tx_score,
            "large_outflow": outflow_score,
            "many_receivers": receiver_score,
            "rapid_transactions": rapid_score
        },
        "stats": {
            "total_transactions": total_tx,
            "unique_receivers": len(receivers),
            "total_sent_wei": total_sent
        }
    }


# ================= API ROUTE =================
@app.route("/analyze-wallet", methods=["POST"])
def analyze():
    data = request.json
    wallet = data.get("wallet_address")

    if not wallet:
        return jsonify({"error": "Wallet address required"}), 400

    txs = fetch_transactions(wallet)
    balance = fetch_balance(wallet)

    analysis = analyze_wallet(wallet, txs)

    # Real-time info
    if txs:
        last_activity = time.strftime(
            "%Y-%m-%d %H:%M:%S",
            time.gmtime(int(txs[0]["timeStamp"]))
        )
    else:
        last_activity = "No transactions"

    analysis["real_time"] = {
        "eth_balance_wei": balance,
        "last_activity": last_activity,
        "analysis_time": time.strftime("%Y-%m-%d %H:%M:%S", time.gmtime())
    }

    # Send limited tx history for visualization
    analysis["transactions"] = txs[:10]

    return jsonify(analysis)


# ================= RUN SERVER =================
if __name__ == "__main__":
    app.run(debug=True, port=5000)
