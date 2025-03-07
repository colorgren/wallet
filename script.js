document.addEventListener('DOMContentLoaded', function() {
    // Database Setup
    const dbName = 'WalletAppDB';
    const dbVersion = 1;
    let db;
    const request = indexedDB.open(dbName, dbVersion);

    // Page Elements - ADD PAGE
    const buttons = document.querySelectorAll('.footbtn');
    const pages = document.querySelectorAll('.page');
    const addBtn = document.querySelector('.addbtn');
    const footer = document.querySelector('footer');
    const categoryGrid = document.querySelector('#category-grid');
    const walletViewOptions = document.querySelector('.wallet-view .option-item');
    const categoryViewOptions = document.querySelectorAll('.category-view .option-item');
    const dateInput = document.getElementById('date-input');
    const timeInput = document.getElementById('time-input');
    const amountInput = document.getElementById('amount');
    const descriptionInput = document.getElementById('description');
    const typeButtons = document.querySelectorAll('.type-btn');
    const viewToggles = document.querySelectorAll('.view-toggle');
    const submitBtn = document.querySelector('.submit-btn');
    const cancelBtn = document.querySelector('.cancel-btn');

    // Page Elements - EDIT PAGE (NEW SELECTORS FOR EDIT PAGE)
    const editPage = document.getElementById('edit-page'); // Select the edit page
    const editCategoryGrid = document.getElementById('edit-category-grid'); // Edit page category grid
    const editDateInput = document.getElementById('edit-date-input');
    const editTimeInput = document.getElementById('edit-time-input');
    const editAmountInput = document.getElementById('edit-amount');
    const editDescriptionInput = document.getElementById('edit-description');
    const editTypeButtons = document.querySelectorAll('.edit-type-btn'); // Type buttons in Edit page
    const editViewToggles = document.querySelectorAll('.edit-view-toggle'); // View toggles in Edit page
    const editSubmitBtn = document.querySelector('.edit-submit-btn'); // Submit button in Edit Page
    const editCancelBtn = document.querySelector('.edit-cancel-btn'); // Cancel button in Edit Page
    const editTransactionIdInput = document.getElementById('edit-transaction-id'); // Hidden ID input in Edit page


    const receiptArea = document.querySelector('.receiptarea');
    const toptableInfos = document.querySelectorAll('.toptableinfo');
    const transactionPopup = document.getElementById('transaction-popup');
    const popupCategory = document.getElementById('popup-category');
    const popupType = document.getElementById('popup-type');
    const popupWallet = document.getElementById('popup-wallet');
    const popupAmount = document.getElementById('popup-amount');
    const popupDate = document.getElementById('popup-date');
    const popupTime = document.getElementById('popup-time');
    const popupDescription = document.getElementById('popup-description');
    const editTransactionBtn = document.getElementById('edit-transaction-btn');
    const deleteTransactionBtn = document.getElementById('delete-transaction-btn');
    const closePopupBtn = document.getElementById('close-popup-btn');
    const transactionIdInput = document.getElementById('transaction-id'); // Original Add page hidden ID input (still used for adding new)


    // Configuration
    const pageMap = {
        'RECEIPT': 'receipt-page',
        'OVERVIEW': 'overview-page',
        'WALLET': 'wallet-page'
    };

    const categories = {
        income: ['Allowance', 'Awards', 'Coupons', 'Grants', 'Lottery', 'Random Cash', 'Refunds', 'Rental', 'Salary', 'Sale'],
        expense: ['Baby', 'Beauty', 'Bills', 'Car', 'Clothing', 'Education', 'Electronics', 'Entertainment', 'Food', 'Health', 'Home', 'Insurance', 'Shopping', 'Social', 'Sport', 'Subscription', 'Tax', 'Telephone', 'Transportation'],
        transfer: ['Cash', 'Card', 'Savings']
    };

    let selectedWallet; // No default selected wallet anymore
    let selectedCategory; // No default selected category anymore
    let editSelectedWallet = 'cash';
    let editSelectedCategory = 'food';
    let currentTransactionId = null;


    // Database Initialization
    request.onerror = (event) => console.error('Database error:', event.target.error);

    request.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains('transactions')) {
            const store = db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('amount', 'amount', { unique: false });
        }
    };

    request.onsuccess = (event) => {
        db = event.target.result;
        loadTransactions();
        updateBalance();
    };

    // Page Navigation (same as before)
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            buttons.forEach(btn => btn.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));
            const pageId = pageMap[this.querySelector('p').textContent];
            document.getElementById(pageId).classList.add('active');
            this.classList.add('active');
        });
    });

    // Add Transaction Page Button (same as before, but hides edit page too)
    addBtn.addEventListener('click', function() {
        pages.forEach(page => page.classList.remove('active'));
        editPage.style.display = 'none'; // Hide edit page when showing add page - NEW
        footer.classList.add('hidden');
        addBtn.classList.add('hidden');
        document.getElementById('add-page').classList.add('active');
        setDefaults();
        updateCategoryView('expense');
        transactionIdInput.value = '';
        submitBtn.textContent = 'Add Transaction';
    });

    // Cancel Button (Add Page - same as before)
    cancelBtn.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('add-page').classList.remove('active');
        document.getElementById('receipt-page').classList.add('active');
        footer.classList.remove('hidden');
        addBtn.classList.remove('hidden');
        transactionIdInput.value = ''; // Clear transaction ID on cancel
        submitBtn.textContent = 'Add Transaction'; // Reset submit button text on cancel, too, for clarity
    });

    // Transaction Type Handling (Add Page - same as before)
    typeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            typeButtons.forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            updateCategoryView(e.target.dataset.type);
        });
    });

    // Wallet/Category Selection - View Toggles (Add Page - MODIFIED)
    viewToggles.forEach(button => {
        button.addEventListener('click', function() {
            viewToggles.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.view-container').forEach(view => view.classList.add('hidden'));
            document.querySelector(`.${this.dataset.view}-view`).classList.remove('hidden');
        });
    });

    // Wallet and Category Option Selection (Add Page - MODIFIED)
    document.querySelectorAll('.view-container').forEach(viewContainer => {
        viewContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('option-item')) {
                const selectedOption = event.target;
                const viewType = this.classList[1].split('-')[0]; // 'wallet' or 'category'

                // Deselect previously selected option in the same view
                this.querySelectorAll('.option-item.selected').forEach(option => {
                    option.classList.remove('selected');
                });
                selectedOption.classList.add('selected');

                if (viewType === 'wallet') {
                    selectedWallet = selectedOption.dataset.value;
                    const walletToggleButton = Array.from(viewToggles).find(toggle => toggle.dataset.view === 'wallet');
                    walletToggleButton.classList.remove('incomplete-field'); // Remove yellow when wallet selected
                    viewToggles.forEach(toggle => {
                        if (toggle.dataset.view === 'wallet') {
                            toggle.textContent = selectedOption.textContent; // Update toggle text
                        }
                    });
                } else if (viewType === 'category') {
                    selectedCategory = selectedOption.dataset.value;
                    const categoryToggleButton = Array.from(viewToggles).find(toggle => toggle.dataset.view === 'category');
                    categoryToggleButton.classList.remove('incomplete-field'); // Remove yellow when category selected
                    viewToggles.forEach(toggle => {
                        if (toggle.dataset.view === 'category') {
                            toggle.textContent = selectedOption.textContent; // Update toggle text
                        }
                    });
                }
                this.classList.add('hidden');
                viewToggles.forEach(btn => btn.classList.remove('active'));
            }
        });
    });


    // ---- EDIT PAGE EVENT LISTENERS (NEW EVENT LISTENERS FOR EDIT PAGE) ----

    // Cancel Button (Edit Page - NEW)
    editCancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        editPage.style.display = 'none'; // Hide edit page
        document.getElementById('receipt-page').classList.add('active'); // Show receipt page
        footer.classList.remove('hidden');
        addBtn.classList.remove('hidden');
        editTransactionIdInput.value = ''; // Clear edit transaction ID
    });

    // Transaction Type Handling (Edit Page - NEW)
    editTypeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            editTypeButtons.forEach(btn => btn.classList.remove('selected'));
            e.target.classList.add('selected');
            updateEditCategoryView(e.target.dataset.type); // Call separate update function for edit page
        });
    });

    // Wallet/Category Selection - View Toggles (Edit Page - NEW)
    editViewToggles.forEach(button => {
        button.addEventListener('click', function() {
            editViewToggles.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.edit-view-container').forEach(view => view.classList.add('hidden'));
            document.querySelector(`.${this.dataset.view}-view`).classList.remove('hidden');
        });
    });

    // Wallet and Category Option Selection (Edit Page - NEW)
    document.querySelectorAll('.edit-view-container').forEach(viewContainer => {
        viewContainer.addEventListener('click', function(event) {
            if (event.target.classList.contains('option-item')) {
                const selectedOption = event.target;
                const viewType = this.classList[1].split('-')[0]; // 'wallet' or 'category'

                // Deselect previously selected option in the same view
                this.querySelectorAll('.option-item.selected').forEach(option => {
                    option.classList.remove('selected');
                });
                selectedOption.classList.add('selected');

                if (viewType === 'wallet') {
                    editSelectedWallet = selectedOption.dataset.value;
                    editViewToggles.forEach(toggle => {
                        if (toggle.dataset.view === 'wallet') {
                            toggle.textContent = selectedOption.textContent;
                        }
                    });
                } else if (viewType === 'category') {
                    editSelectedCategory = selectedOption.dataset.value;
                    editViewToggles.forEach(toggle => {
                        if (toggle.dataset.view === 'category') {
                            toggle.textContent = selectedOption.textContent;
                        }
                    });
                }
                this.classList.add('hidden');
                editViewToggles.forEach(btn => btn.classList.remove('active'));
            }
        });
    });


    // Date/Time Handling (same for both pages, initialize once)
    initializeDateTime();

    // Input Event Listeners for real-time validation clear
    dateInput.addEventListener('input', () => {
        if (dateInput.value) {
            dateInput.classList.remove('incomplete-field');
        }
    });
    timeInput.addEventListener('input', () => {
        if (timeInput.value) {
            timeInput.classList.remove('incomplete-field');
        }
    });
    amountInput.addEventListener('input', () => {
        if (amountInput.value && !isNaN(parseFloat(amountInput.value))) {
            amountInput.classList.remove('incomplete-field');
        }
    });


    // Form Submission (ADD PAGE - MODIFIED to require Wallet and Category selection and visual cue)
    submitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const selectedTypeButton = document.querySelector('.type-btn.selected');
        if (!selectedTypeButton) {
            alert('Please select transaction type');
            return;
        }
        const transactionType = selectedTypeButton.dataset.type;

        const walletToggleButton = Array.from(viewToggles).find(toggle => toggle.dataset.view === 'wallet');
        const categoryToggleButton = Array.from(viewToggles).find(toggle => toggle.dataset.view === 'category');

        let isFormValid = true; // Assume form is valid initially

        // Reset all incomplete field styles at the beginning of validation
        resetIncompleteFieldsStyles();

        if (!dateInput.value) {
            dateInput.classList.add('incomplete-field');
            isFormValid = false;
        }
        if (!timeInput.value) {
            timeInput.classList.add('incomplete-field');
            isFormValid = false;
        }
        if (!amountInput.value || isNaN(parseFloat(amountInput.value))) {
            amountInput.classList.add('incomplete-field');
            isFormValid = false;
        }
        if (!selectedWallet) {
            walletToggleButton.classList.add('incomplete-field');
            isFormValid = false;
        }
        if (!selectedCategory) {
            categoryToggleButton.classList.add('incomplete-field');
            isFormValid = false;
        }


        if (!isFormValid) {
            alert('Please fill in all required fields (marked in yellow).'); // General alert if any field is incomplete
            return; // Stop submission if form is not valid
        }


        const transaction = {
            date: dateInput.value,
            time: timeInput.value,
            category: selectedCategory,
            wallet: selectedWallet,
            amount: parseFloat(amountInput.value),
            type: transactionType,
            description: descriptionInput.value
        };

        const transactionIdToUpdate = transactionIdInput.value; // Get ID from hidden input

        if (isNaN(transaction.amount)) {
            alert('Please enter a valid amount');
            return;
        }

        try {
            const tx = db.transaction('transactions', 'readwrite');
            const store = tx.objectStore('transactions');
            let dbRequest;

            if (transactionIdToUpdate) {
                // **EDIT MODE: Update existing transaction**
                transaction.id = parseInt(transactionIdToUpdate); // Add ID to transaction object for update
                dbRequest = store.put(transaction); // Use 'put' to update
            } else {
                // **ADD NEW MODE: Add new transaction**
                dbRequest = store.add(transaction); // Use 'add' to add new
            }

            await new Promise((resolve, reject) => {
                dbRequest.onsuccess = () => {
                    tx.oncomplete = resolve;
                };
                dbRequest.onerror = () => {
                    tx.onerror = reject;
                    console.error("IndexedDB Error (Add/Update):", tx.error);
                    reject(tx.error);
                };
            });

            await loadTransactions();
            updateBalance();
            showPage('receipt-page');
            amountInput.value = '';
            descriptionInput.value = '';
            transactionIdInput.value = ''; // Clear transaction ID after saving
            submitBtn.textContent = 'Add Transaction'; // Reset button text
            selectedWallet = undefined; // Reset selected wallet for next add
            selectedCategory = undefined; // Reset selected category for next add
            setToggleDefaultText(); // Reset toggle button text to default
            resetIncompleteFieldsStyles(); // Ensure styles are reset on successful submit


        } catch (error) {
            console.error('Transaction error:', error);
            alert('Failed to save transaction.');
        }
    });


    // Form Submission (EDIT PAGE - NEW SUBMIT BUTTON FOR EDITING)
    editSubmitBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const selectedTypeButton = document.querySelector('.edit-type-btn.selected');
        if (!selectedTypeButton) {
            alert('Please select transaction type (Edit)');
            return;
        }
        const transactionType = selectedTypeButton.dataset.type;

        const transaction = {
            id: parseInt(editTransactionIdInput.value), // Get ID from hidden input in Edit page
            date: editDateInput.value,
            time: editTimeInput.value,
            category: editSelectedCategory,
            wallet: editSelectedWallet,
            amount: parseFloat(editAmountInput.value),
            type: transactionType,
            description: editDescriptionInput.value
        };


        if (isNaN(transaction.amount)) {
            alert('Please enter a valid amount (Edit)');
            return;
        }

        try {
            const tx = db.transaction('transactions', 'readwrite');
            const store = tx.objectStore('transactions');
            await store.put(transaction); // Use 'put' to UPDATE transaction

            await loadTransactions();
            updateBalance();
            showPage('receipt-page'); // Go back to receipt page
            editPage.style.display = 'none'; // Hide edit page after submit
            editTransactionIdInput.value = ''; // Clear edit transaction ID
        } catch (error) {
            console.error('Transaction edit error:', error);
            alert('Failed to save transaction changes.');
        }
    });


    // Receipt Area Transaction Click and Popup (same as before)
    receiptArea.addEventListener('click', async function(e) {
        if (e.target.closest('.transdiv')) {
            const transDiv = e.target.closest('.transdiv');
            const transactionId = transDiv.dataset.transactionId;
            if (!transactionId) return; // Exit if no transaction ID

            currentTransactionId = transactionId; // Store for edit/delete

            try {
                const transaction = await getTransactionById(parseInt(transactionId));
                if (transaction) {
                    populatePopup(transaction);
                    transactionPopup.classList.remove('hidden');
                }
            } catch (error) {
                console.error("Error fetching transaction for popup:", error);
            }
        }
    });


    // Close Popup Button (same as before)
    closePopupBtn.addEventListener('click', function() {
        transactionPopup.classList.add('hidden'); // Hide popup
        currentTransactionId = null; // Clear stored transaction ID
    });


    // Edit Transaction Button in Popup (MODIFIED to show EDIT PAGE instead of ADD PAGE)
    editTransactionBtn.addEventListener('click', async function() {
        const transactionId = currentTransactionId;
        if (!transactionId) return;

        try {
            const transaction = await getTransactionById(parseInt(transactionId));
            if (transaction) {
                populateEditForm(transaction); // Populate the NEW edit form
                document.getElementById('receipt-page').classList.remove('active'); // Hide receipt page
                document.getElementById('add-page').classList.remove('active'); // Hide add page (if it was active)
                editPage.style.display = 'block'; // Show the EDIT PAGE - NEW!
                footer.classList.add('hidden');
                addBtn.classList.add('hidden');
                transactionPopup.classList.add('hidden');
            }
        } catch (error) {
            console.error("Error fetching transaction for edit:", error);
            alert('Error loading transaction for editing.');
        }
    });

    // Delete Transaction Button in Popup (same as before)
    deleteTransactionBtn.addEventListener('click', async function() {
        const transactionId = currentTransactionId;
        if (!transactionId) return;

        if (confirm('Are you sure you want to delete this transaction?')) {
            try {
                await deleteTransaction(parseInt(transactionId));
                await loadTransactions();
                updateBalance();
                transactionPopup.classList.add('hidden'); // Hide popup after delete
                currentTransactionId = null; // Clear stored transaction ID
            } catch (error) {
                console.error("Error deleting transaction:", error);
                alert('Error deleting transaction.');
            }
        }
    });


    // Helper Functions (most remain the same, some updated for EDIT PAGE)
    function showPage(pageId) {
        pages.forEach(page => page.classList.remove('active'));
        document.getElementById(pageId).classList.add('active');
        footer.classList.remove('hidden');
        addBtn.classList.remove('hidden');
        document.getElementById('add-page').classList.remove('active'); // Hide add page after submission
    }
    async function loadTransactions() {
        receiptArea.innerHTML = '<div class="loading">Loading transactions...</div>';

        return new Promise((resolve, reject) => {
            const tx = db.transaction('transactions', 'readonly');
            const store = tx.objectStore('transactions');
            const index = store.index('date'); // Use the date index
            const request = index.openCursor(null, 'prev'); // Open cursor in reverse date order

            const transactions = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    transactions.push(cursor.value);
                    cursor.continue();
                } else {
                    receiptArea.innerHTML = '';
                    if (!transactions.length) {
                        receiptArea.innerHTML = '<p class="no-transactions">No transactions found</p>';
                        return resolve();
                    }
                    const groupedTransactions = groupByDate(transactions);
                    groupedTransactions.forEach(group => {
                        receiptArea.innerHTML += `<p class="daytitle">${formatDisplayDate(group.date)}</p>`;
                        group.transactions.forEach(trans => {
                            receiptArea.innerHTML += `
                                <div class="transdiv" data-transaction-id="${trans.id}">
                                    <div class="transleft">
                                        <p class="transcat">${trans.description ? trans.description : trans.category}</p>
                                        <p class="transtype">${trans.wallet}</p>
                                    </div>
                                    <div class="transright">
                                        <p class="transamt" style="color: ${trans.type === 'expense' ? '#f44336' : '#4CAF50'}">
                                            ${trans.type === 'expense' ? '-' : ''}${trans.amount.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <hr>
                            `;
                        });
                    });
                    resolve();
                }
            };

            request.onerror = (event) => {
                console.error("Error loading transactions from IndexedDB:", event.target.error);
                receiptArea.innerHTML = '<p class="error-loading">Error loading transactions.</p>';
                reject(event.target.error);
            };
        });
    }
    function updateBalance() {
        const incomeValElem = toptableInfos[0].querySelector('.val');
        const expenseValElem = toptableInfos[1].querySelector('.val');
        const balanceValElem = toptableInfos[2].querySelector('.val');

        let totalIncome = 0;
        let totalExpenses = 0;

        const tx = db.transaction('transactions', 'readonly');
        const store = tx.objectStore('transactions');
        const request = store.getAll();

        request.onsuccess = () => {
            const transactions = request.result;
            transactions.forEach(trans => {
                if (trans.type === 'income') {
                    totalIncome += trans.amount;
                } else if (trans.type === 'expense') {
                    totalExpenses += trans.amount;
                }
            });

            const balance = totalIncome - totalExpenses;

            incomeValElem.textContent = totalIncome.toFixed(2);
            expenseValElem.textContent = totalExpenses.toFixed(2);
            balanceValElem.textContent = balance.toFixed(2);

            // Update balance value color
            toptableInfos[2].classList.remove('valuered', 'valueorange', 'valueyellow', 'valuegreen');
            if (balance < 51) toptableInfos[2].classList.add('valuered');
            else if (balance <= 250) toptableInfos[2].classList.add('valueorange');
            else if (balance <= 500) toptableInfos[2].classList.add('valueyellow');
            else toptableInfos[2].classList.add('valuegreen');
        };
        request.onerror = (event) => {
            console.error("Error fetching transactions for balance update:", event.target.error);
        };
    }
    function setDefaults() {
        // Reset view toggle button text to default (no selection)
        setToggleDefaultText();

        // Select 'Expense' type button by default in Add page
        typeButtons.forEach(btn => btn.classList.remove('selected'));
        typeButtons[1].classList.add('selected'); // Assuming 'Expense' is the second button
        updateCategoryView('expense'); // Update categories based on default type

        // Ensure incomplete-field class is removed when going to Add page
        resetIncompleteFieldsStyles();
    }

    function resetIncompleteFieldsStyles() {
        dateInput.classList.remove('incomplete-field');
        timeInput.classList.remove('incomplete-field');
        amountInput.classList.remove('incomplete-field');
        const walletToggleButton = Array.from(viewToggles).find(toggle => toggle.dataset.view === 'wallet');
        const categoryToggleButton = Array.from(viewToggles).find(toggle => toggle.dataset.view === 'category');
        walletToggleButton.classList.remove('incomplete-field');
        categoryToggleButton.classList.remove('incomplete-field');
    }

    function setToggleDefaultText() { // NEW FUNCTION to reset toggle button text
        viewToggles.forEach(toggle => {
            if (toggle.dataset.view === 'wallet') {
                toggle.textContent = 'Select Wallet'; // Default text
            } else if (toggle.dataset.view === 'category') {
                toggle.textContent = 'Select Category'; // Default text
            }
        });
    }


    function updateCategoryView(type) { // Update Category View for ADD PAGE - same as before
        const viewType = type === 'transfer' ? 'transfer' : type === 'income' ? 'income' : 'expense';
        categoryGrid.innerHTML = categories[viewType].map(item => `
            <div class="option-item" data-value="${item.toLowerCase()}">
                <span>${item}</span>
            </div>
        `).join('');
    }

    function updateEditCategoryView(type) { // Update Category View for EDIT PAGE - NEW FUNCTION
        const viewType = type === 'transfer' ? 'transfer' : type === 'income' ? 'income' : 'expense';
        editCategoryGrid.innerHTML = categories[viewType].map(item => `
            <div class="option-item edit-category-option" data-value="${item.toLowerCase()}">
                <span>${item}</span>
            </div>
        `).join('');
    }


    function groupByDate(transactions) {
        // First sort all transactions by datetime
        const sortedTransactions = transactions.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateB - dateA; // Newest first
        });

        // Then group by date
        const groups = sortedTransactions.reduce((acc, trans) => {
            const dateKey = trans.date;
            if (!acc[dateKey]) acc[dateKey] = { date: dateKey, transactions: [] };
            acc[dateKey].transactions.push(trans);
            return acc;
        }, {});

        // Finally sort groups by date
        return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function formatDisplayDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function updateDateDisplay() {
        // No updates needed for labels, inputs directly used
    }

    function updateTimeDisplay() {
        // No updates needed for labels, inputs directly used
    }

    async function getTransactionById(id) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('transactions', 'readonly');
            const store = tx.objectStore('transactions');
            const request = store.get(id);
            request.onsuccess = (event) => {
                resolve(event.target.result);
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    async function deleteTransaction(id) {
        return new Promise((resolve, reject) => {
            const tx = db.transaction('transactions', 'readwrite');
            const store = tx.objectStore('transactions');
            const request = store.delete(id);
            request.onsuccess = () => {
                resolve(true);
            };
            request.onerror = (event) => {
                reject(event.target.error);
            };
        });
    }

    function populatePopup(transaction) {
        popupCategory.textContent = transaction.category;
        popupType.textContent = transaction.type;
        popupWallet.textContent = transaction.wallet;
        popupAmount.textContent = transaction.amount.toFixed(2);
        popupDate.textContent = formatDisplayDate(transaction.date);
        popupTime.textContent = transaction.time;
        popupDescription.textContent = transaction.description || 'No description';
    }


    function populateEditForm(transaction) {
        editDateInput.value = transaction.date;
        editTimeInput.value = transaction.time;
        editAmountInput.value = transaction.amount;
        editDescriptionInput.value = transaction.description;
        editTransactionIdInput.value = transaction.id;

        // Select the correct type button in EDIT PAGE
        editTypeButtons.forEach(btn => btn.classList.remove('selected'));
        editTypeButtons.forEach(btn => {
            if (btn.dataset.type === transaction.type) {
                btn.classList.add('selected');
            }
        });
        updateEditCategoryView(transaction.type); // Use updateEditCategoryView for EDIT PAGE categories

        // Set view toggle button texts (Wallet and Category) in EDIT PAGE
        editViewToggles.forEach(toggle => {
            if (toggle.dataset.view === 'wallet') {
                toggle.textContent = transaction.wallet;
            } else if (toggle.dataset.view === 'category') {
                toggle.textContent = transaction.category;
            }
        });
        editSelectedWallet = transaction.wallet;
        editSelectedCategory = transaction.category;
    }


    function initializeDateTime() {
        const now = new Date();
        dateInput.value = now.toISOString().split('T')[0]; // Set default for ADD PAGE
        timeInput.value = now.toTimeString().substring(0, 5); // Set default for ADD PAGE
        editDateInput.value = now.toISOString().split('T')[0]; // Set default for EDIT PAGE - NEW
        editTimeInput.value = now.toTimeString().substring(0, 5); // Set default for EDIT PAGE - NEW
        dateInput.addEventListener('change', updateDateDisplay);
        timeInput.addEventListener('change', updateTimeDisplay);
        editDateInput.addEventListener('change', updateDateDisplay); // Add listener for EDIT PAGE - NEW
        editTimeInput.addEventListener('change', updateTimeDisplay); // Add listener for EDIT PAGE - NEW
    }


    // Initial Setup
    buttons[0].click();
});

const clearHistoryButton = document.getElementById('clear-history');

clearHistoryButton.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear ALL transaction history? This action cannot be undone.')) {
        clearTransactionHistory();
    }
});

async function clearTransactionHistory() {
    const dbName = 'WalletAppDB'; // Database name
    const storeName = 'transactions'; // Object store name

    const request = indexedDB.open(dbName);

    request.onerror = (event) => {
        console.error("Error opening database to clear history:", event.target.error);
        alert("Error clearing transaction history.");
    };

    request.onsuccess = async (event) => {
        db = event.target.result;

        if (!db.objectStoreNames.contains(storeName)) {
            alert("No transactions to clear.");
            return;
        }

        const tx = db.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        const clearRequest = store.clear(); // Clear all data in the object store

        clearRequest.onsuccess = async () => {
            await loadTransactions(); // Reload (now empty) transactions
            updateBalance(); // Update balance to zero
            alert("Transaction history cleared successfully.");
        };

        clearRequest.onerror = (event) => {
            console.error("Error clearing object store:", event.target.error);
            alert("Error clearing transaction history.");
        };
    };
    window.location.reload();
}