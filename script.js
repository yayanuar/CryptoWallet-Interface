const API_KEY = "555"; 
const themeToggleBtn = document.getElementById("themeToggle");

// Load saved theme
if(localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
  themeToggleBtn.textContent = "☀️"; // sun for dark mode
} else {
  themeToggleBtn.textContent = "🌙"; // moon for light mode
}

// Toggle dark/light mode on click
themeToggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");

  if (document.body.classList.contains("dark-mode")) {
    themeToggleBtn.textContent = "☀️"; // sun icon
    localStorage.setItem("theme", "dark");
  } else {
    themeToggleBtn.textContent = "🌙"; // moon icon
    localStorage.setItem("theme", "light");
  }
});

// Wallet analysis
document.getElementById("analyzeBtn").addEventListener("click", async () => {
  const walletAddress = document.querySelector(".input-section input").value.trim();
  const resultDiv = document.getElementById("result");

  if (!walletAddress) {
    alert("Please enter a wallet address!");
    return;
  }

  resultDiv.classList.remove("hidden");
  resultDiv.innerHTML = `<p>Loading...</p>`;

  try {
    // 🔹 Call local Flask backend instead of Etherscan directly
    const response = await fetch("http://localhost:5000/analyze-wallet", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ wallet_address: walletAddress })
    });

    const data = await response.json();

    // Display result
    let reasonsHTML = "<ul>";
    data.reasons.forEach(r => {
      reasonsHTML += `<li>${r}</li>`;
    });
    reasonsHTML += "</ul>";

    resultDiv.innerHTML = `
      <h3>Wallet Analysis Result:</h3>
      <p><strong>Address:</strong> ${data.wallet}</p>
      <p><strong>Risk Level:</strong> ${data.risk_level}</p>
      <p><strong>Risk Score:</strong> ${data.risk_score}/100</p>
      <p><strong>Why flagged:</strong></p>
      ${reasonsHTML}
      <p><strong>Stats:</strong></p>
      <ul>
        <li>Total Transactions: ${data.stats.total_transactions}</li>
        <li>Unique Receivers: ${data.stats.unique_receivers}</li>
        <li>Total Sent (Wei): ${data.stats.total_sent_wei}</li>
      </ul>
    `;
  } catch (error) {
    resultDiv.innerHTML = `<p style="color: #ff4f4f;">Error fetching wallet data from backend. Try again.</p>`;
    console.error(error);
  }
});


  function updateArticleDates() {
  const dateElements = document.querySelectorAll(".date");

  dateElements.forEach(el => {
    const articleDate = new Date(el.dataset.date);
    const today = new Date();

    const diffTime = today - articleDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      el.textContent = "Today";
    } else if (diffDays === 1) {
      el.textContent = "1 day ago";
    } else {
      el.textContent = `${diffDays} days ago`;
    }
  });
}

updateArticleDates();

});
