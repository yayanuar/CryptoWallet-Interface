const themeToggleBtn = document.getElementById("themeToggle");
const analyzeBtn = document.getElementById("analyzeBtn");
const resultDiv = document.getElementById("result");
const walletInput = document.querySelector(".input-section input");

let txChart = null;

/* ================= THEME TOGGLE ================= */

// Load saved theme
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  themeToggleBtn.textContent = "☀️";
} else {
  themeToggleBtn.textContent = "🌙";
}

// Toggle theme
themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    themeToggleBtn.textContent = "☀️";
    localStorage.setItem("theme", "dark");
  } else {
    themeToggleBtn.textContent = "🌙";
    localStorage.setItem("theme", "light");
  }
});

/* ================= TRANSACTION CHART ================= */

function drawTransactionChart(transactions, walletAddress) {
  const ctx = document.getElementById("txChart").getContext("2d");

  if (txChart) {
    txChart.destroy();
  }

  const sentTxs = transactions.filter(
    tx => tx.from.toLowerCase() === walletAddress.toLowerCase()
  );

  const values = sentTxs.map(tx => parseInt(tx.value) / 1e18);
  const labels = values.map((_, i) => `Tx ${i + 1}`);

  txChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "ETH Sent",
        data: values
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          display: true
        }
      }
    }
  });
}

/* ================= WALLET ANALYSIS ================= */

analyzeBtn.addEventListener("click", async () => {
  const walletAddress = walletInput.value.trim();

  if (!walletAddress) {
    alert("Please enter a wallet address!");
    return;
  }

  resultDiv.classList.remove("hidden");
  resultDiv.innerHTML = "<p>Analyzing wallet in real-time...</p>";

  try {
    const response = await fetch("http://localhost:5000/analyze-wallet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ wallet_address: walletAddress })
    });

    const data = await response.json();

    /* -------- Reasons -------- */
    let reasonsHTML = "<ul>";
    data.reasons.forEach(reason => {
      reasonsHTML += `<li>${reason}</li>`;
    });
    reasonsHTML += "</ul>";

    /* -------- Risk Breakdown -------- */
    let breakdownHTML = "<ul>";
    for (const key in data.risk_breakdown) {
      breakdownHTML += `<li>${key.replace(/_/g, " ")}: ${data.risk_breakdown[key]} pts</li>`;
    }
    breakdownHTML += "</ul>";

    /* -------- Display Result -------- */
    resultDiv.innerHTML = `
      <h3>Wallet Analysis Result</h3>

      <p><strong>Wallet Address:</strong> ${data.wallet}</p>
      <p><strong>Risk Level:</strong> ${data.risk_level}</p>
      <p><strong>Risk Score:</strong> ${data.risk_score}/100</p>

      <p><strong>Why Flagged:</strong></p>
      ${reasonsHTML}

      <p><strong>Risk Score Breakdown:</strong></p>
      ${breakdownHTML}

      <p><strong>Statistics:</strong></p>
      <ul>
        <li>Total Transactions: ${data.stats.total_transactions}</li>
        <li>Unique Receivers: ${data.stats.unique_receivers}</li>
        <li>Total Sent (Wei): ${data.stats.total_sent_wei}</li>
      </ul>

      <p><strong>Real-Time Information:</strong></p>
      <ul>
        <li>ETH Balance (Wei): ${data.real_time.eth_balance_wei}</li>
        <li>Last Activity: ${data.real_time.last_activity}</li>
        <li>Analysis Time: ${data.real_time.analysis_time}</li>
      </ul>
    `;

    /* -------- Draw Chart -------- */
    if (data.transactions && data.transactions.length > 0) {
      drawTransactionChart(data.transactions, walletAddress);
    }

  } catch (error) {
    console.error(error);
    resultDiv.innerHTML = `
      <p style="color:red;">
        Error connecting to backend. Make sure Flask server is running.
      </p>
    `;
  }
});
