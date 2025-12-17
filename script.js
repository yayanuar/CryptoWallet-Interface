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
    // Fetch ETH balance
    const balanceResp = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${walletAddress}&tag=latest&apikey=${API_KEY}`);
    const balanceData = await balanceResp.json();
    const balanceETH = (balanceData.result / 1e18).toFixed(4);

    // Fetch last 5 transactions
    const txResp = await fetch(`https://api.etherscan.io/api?module=account&action=txlist&address=${walletAddress}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc&apikey=${API_KEY}`);
    const txData = await txResp.json();

    let txHTML = "<ul>";
    if (!txData.result || txData.result.length === 0) {
      txHTML += "<li>No recent transactions</li>";
    } else {
      txData.result.forEach(tx => {
        const valueETH = (tx.value / 1e18).toFixed(4);
        txHTML += `<li>Hash: ${tx.hash.substring(0,10)}... | Value: ${valueETH} ETH</li>`;
      });
    }
    txHTML += "</ul>";

    resultDiv.innerHTML = `
      <h3>Wallet Analysis Result:</h3>
      <p><strong>Address:</strong> ${walletAddress}</p>
      <p><strong>Balance:</strong> ${balanceETH} ETH</p>
      <p><strong>Recent Transactions:</strong></p>
      ${txHTML}
    `;
  } catch (error) {
    resultDiv.innerHTML = `<p style="color: #ff4f4f;">Error fetching wallet data. Try again.</p>`;
    console.error(error);
  }

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
