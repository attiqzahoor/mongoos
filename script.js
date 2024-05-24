document.addEventListener("DOMContentLoaded", function () {
    const connectWalletBtn = document.getElementById("connectWalletBtn");
    const walletAddressSpan = document.getElementById("walletAddress");
    const walletBalanceSpan = document.getElementById("walletBalance");
    const inscriptionsList = document.getElementById("inscriptionsList");
    const noInscriptionsMessage = document.getElementById("noInscriptionsMessage");
    const popup = document.getElementById("popup");
    const publishButton = document.getElementById("publishButton");
    const estimatedFeeDisplay = document.getElementById("estimatedFeeDisplay");
    const sellButton = document.getElementById("sellButton");
    const sellPage = document.getElementById("sellPage");
    const closeButton = document.querySelector(".close-button");
    const buyButton = document.getElementById("buyButton");
    const documentsContainer = document.getElementById("documentsContainer");

    let connectedAddress = null;
    let estimatedFee = 0;

    connectWalletBtn.addEventListener("click", async () => {
        try {
            if (typeof window.unisat !== 'undefined') {
                const accounts = await window.unisat.requestAccounts();
                const address = accounts[0];
                walletAddressSpan.textContent = address;
                connectedAddress = address;

                const balance = await window.unisat.getBalance();
                walletBalanceSpan.textContent = balance.total;

                inscriptionsList.innerHTML = '';
                noInscriptionsMessage.style.display = 'none';
                popup.style.display = 'none';

                await displayConnectedAccountInscriptions();
                checkPublishConditions();
            } else {
                popup.style.display = 'block';
            }
        } catch (error) {
            console.error('Error connecting to UniSat Wallet:', error);
        }
    });

    const displayData = (data) => {
        document.getElementById("inscriptionIdDisplay").innerText = data.data.inscriptionId;
        document.getElementById("heightDisplay").innerText = data.data.height;
        document.getElementById("contentTypeDisplay").innerText = data.data.contentType;
        document.getElementById("inscriptionNumberDisplay").innerText = data.data.inscriptionNumber;
        document.getElementById("addressDisplay").innerText = data.data.address;

        document.getElementById("inscriptionData").style.display = "block";

        const totalBytes = calculateBytesOfInscription(data.data);
        document.getElementById("totalBytesDisplay").innerText = totalBytes + ' bytes';

        calculateAndDisplayFee(totalBytes);
    };

    const searchButton = document.getElementById("searchButton");
    searchButton.addEventListener("click", async function () {
        const inscriptionId = document.getElementById("inscriptionId").value;
        if (inscriptionId) {
            try {
                const response = await fetch(`https://open-api-testnet.unisat.io/v1/indexer/inscription/info/${inscriptionId}`, {
                    method: 'GET',
                    headers: {
                        'accept': 'application/json',
                        'Authorization': 'Bearer c59bac93894b3c67296fbf4e656bda301c2bf09b9a296a8dd7f46667b08938de'
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();
                console.log("Inscription Data:", data);

                displayData(data);

            } catch (error) {
                console.error("Error fetching inscription data:", error);
                alert("Failed to fetch inscription data. Please try again.");
            }
        } else {
            alert("Please enter an Inscription ID");
        }
    });

    function getStringBytes(str) {
        return new TextEncoder().encode(str).length;
    }

    function calculateBytesOfInscription(inscription) {
        let totalBytes = 0;

        for (const key in inscription) {
            if (typeof inscription[key] === 'string') {
                totalBytes += getStringBytes(inscription[key]);
            } else if (Array.isArray(inscription[key])) {
                inscription[key].forEach(item => {
                    totalBytes += getStringBytes(item);
                });
            } else if (inscription[key] instanceof ArrayBuffer) {
                totalBytes += inscription[key].byteLength;
            }
        }

        return totalBytes;
    }

    const init = async () => {
        const response = await fetch('https://mempool.space/api/v1/fees/recommended');
        const feesRecommended = await response.json();

        const form = document.getElementById("feeRateForm");
        form.innerHTML = '';

        for (const [key, value] of Object.entries(feesRecommended)) {
            const radioWrapper = document.createElement("div");

            const radio = document.createElement("input");
            radio.type = "radio";
            radio.name = "feeRate";
            radio.id = key;
            radio.value = value;

            const label = document.createElement("label");
            label.htmlFor = key;
            label.textContent = `${key}: ${value} sat/vB`;

            radioWrapper.appendChild(radio);
            radioWrapper.appendChild(label);
            form.appendChild(radioWrapper);

            radio.addEventListener("change", () => {
                const totalBytes = parseInt(document.getElementById("totalBytesDisplay").innerText);
                calculateAndDisplayFee(totalBytes);
            });
        }
    };

    function calculateAndDisplayFee(totalBytes) {
        const selectedFeeRate = document.querySelector('input[name="feeRate"]:checked');
        if (selectedFeeRate) {
            const feeRate = parseFloat(selectedFeeRate.value);
            const estimatedFee = (totalBytes / 1024) * feeRate;
            document.getElementById("estimatedFeeDisplay").innerText = `Estimated Fee: ${estimatedFee.toFixed(2)} sat`;
            checkPublishConditions();
        } else {
            document.getElementById("estimatedFeeDisplay").innerText = "Estimated Fee: N/A";
            estimatedFee = 0;
        }
    }

    function checkPublishConditions() {
        const balance = parseFloat(walletBalanceSpan.textContent);
        const inscriptionAddress = document.getElementById("addressDisplay").textContent;

        if (balance >= estimatedFee && inscriptionAddress === connectedAddress) {
            publishButton.disabled = false;
        } else {
            publishButton.disabled = true;
        }
    }

    init();

    sellButton.addEventListener("click", function () {
        sellPage.style.display = "block";
    });

    closeButton.addEventListener("click", function () {
        sellPage.style.display = "none";
    });

    window.addEventListener("click", function (event) {
        if (event.target === sellPage) {
            sellPage.style.display = "none";
        }
    });

  // Add event listener for the "Publish" button
publishButton.addEventListener("click", async () => {
    const inscriptionId = document.getElementById("inscriptionIdDisplay").innerText;
    const height = document.getElementById("heightDisplay").innerText;
    const contentType = document.getElementById("contentTypeDisplay").innerText;
    const inscriptionNumber = document.getElementById("inscriptionNumberDisplay").innerText;
    const address = document.getElementById("addressDisplay").innerText;
    const price = document.getElementById("estimatedFeeDisplay").innerText;
    const feeRateElement = document.querySelector('input[name="feeRate"]:checked');

    if (!feeRateElement) {
        alert('Please select a fee rate');
        return;
    }

    const feeRateValue = feeRateElement.value;
    const feeRateText = feeRateElement.nextSibling.textContent.trim(); // Extracting the text from the label
    const feeRate = `${feeRateValue} ${feeRateText}`; // Concatenating value and text

    const data = {
        inscriptionId,
        height,
        contentType,
        inscriptionNumber,
        address,
        price,
        feeRate // Storing the complete fee rate
    };

    try {
        const response = await fetch('http://localhost:3000/publish', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('Data published successfully');
        } else {
            alert('Error publishing data');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred');
    }
});


    // Add event listener for the "Buy" button
    buyButton.addEventListener("click", async () => {
        try {
            const response = await fetch('http://localhost:3000/documents', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const documents = await response.json();
            displayDocuments(documents);
        } catch (error) {
            console.error('Error fetching documents:', error);
            alert('Failed to fetch documents. Please try again.');
        }
    });

    function displayDocuments(documents) {
        documentsContainer.innerHTML = '';

        if (documents.length === 0) {
            documentsContainer.innerHTML = '<p>No documents found.</p>';
            return;
        }

        documents.forEach(doc => {
            const card = document.createElement('div');
            card.classList.add('card');

            card.innerHTML = `
                <div class="card-header">
                    <h3>${doc.inscriptionId}</h3>
                </div>
                <div class="card-body">
                    <p><strong>Height:</strong> ${doc.height}</p>
                    <p><strong>Content Type:</strong> ${doc.contentType}</p>
                    <p><strong>Inscription Number:</strong> ${doc.inscriptionNumber}</p>
                    <p><strong>Address:</strong> ${doc.address}</p>
                    <p><strong>Price:</strong> ${doc.price}</p>
                    <p><strong>Fee Rate:</strong> ${doc.feeRate}</p>
                </div>
            `;

            documentsContainer.appendChild(card);
        });
    }
});

