document.addEventListener('DOMContentLoaded', function () {
    // Page Navigation
    const buttons = document.querySelectorAll('.footbtn');
    const pages = document.querySelectorAll('.page');
    const pageMap = {
        'RECEIPT': 'receipt-page',
        'OVERVIEW': 'overview-page',
        'WALLET': 'wallet-page'
    };

    buttons.forEach(button => {
        button.addEventListener('click', function () {
            buttons.forEach(btn => btn.classList.remove('active'));
            pages.forEach(page => page.classList.remove('active'));
            const buttonText = this.querySelector('p').textContent;
            this.classList.add('active');
            document.getElementById(pageMap[buttonText]).classList.add('active');
        });
    });

    // Activate first page by default
    buttons[0].click();

    // Add Transaction Page
    const addBtn = document.querySelector('.addbtn');
    const footer = document.querySelector('footer');
    let previousPage = null;

    addBtn.addEventListener('click', function () {
        previousPage = document.querySelector('.page.active');
        pages.forEach(page => page.classList.remove('active'));
        footer.classList.add('hidden');
        addBtn.classList.add('hidden');
        document.getElementById('add-page').classList.add('active');
        setDefaults(); // Set default wallet and category
        updateCategoryView('expense'); // Show expense categories by default
    });

    // Cancel Button
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('cancel-btn')) {
            document.getElementById('add-page').classList.remove('active');
            if (previousPage) previousPage.classList.add('active');
            footer.classList.remove('hidden');
            addBtn.classList.remove('hidden');
        }
    });

    // Transaction Type Buttons
    document.querySelectorAll('.type-btn').forEach(button => {
        button.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('selected'));
            this.classList.add('selected');
            document.querySelector('input[name="type"]').value = this.dataset.type;
            updateCategoryView(this.dataset.type); // Update categories based on type
        });
    });

    // Wallet and Category Selection
    const viewToggles = document.querySelectorAll('.view-toggle');
    const categoryGrid = document.querySelector('#category-grid');
    const categories = {
        income: ['Allowance', 'Awards', 'Coupons', 'Grants', 'Lottery', 'Random Cash', 'Refunds', 'Rental', 'Salary', 'Sale'],
        expense: ['Baby', 'Beauty', 'Bills', 'Car', 'Clothing', 'Education', 'Electronics', 'Entertainment', 'Food', 'Health', 'Home', 'Insurance', 'Shopping', 'Social', 'Sport', 'Subscription', 'Tax', 'Telephone', 'Transportation'],
        transfer: ['Cash', 'Card', 'Savings']
    };

    // View Toggle Logic
    viewToggles.forEach(button => {
        button.addEventListener('click', function () {
            viewToggles.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            document.querySelectorAll('.view-container').forEach(view => view.classList.add('hidden'));
            document.querySelector(`.${this.dataset.view}-view`).classList.remove('hidden');
        });
    });

    // Category View Generator
    function updateCategoryView(type) {
        const items = categories[type === 'transfer' ? 'transfer' : type === 'income' ? 'income' : 'expense']
            .map(item => `
                <div class="option-item" data-value="${item.toLowerCase()}">
                    <span>${item}</span>
                </div>
            `).join('');
        categoryGrid.innerHTML = items;
    }

    // Handle Option Selection
    document.addEventListener('click', function (e) {
        if (e.target.closest('.option-item')) {
            const option = e.target.closest('.option-item');
            const viewType = option.closest('.view-container').classList.contains('wallet-view') ? 'wallet' : 'category';
            document.querySelector(`[data-view="${viewType}"]`).textContent = option.textContent;
            document.querySelectorAll('.view-container').forEach(view => view.classList.add('hidden'));
            viewToggles.forEach(btn => btn.classList.remove('active'));
            console.log(`Selected ${viewType}:`, option.dataset.value);
        }
    });

    // Close Views When Clicking Outside
    document.addEventListener('click', function (e) {
        if (!e.target.closest('.view-container') && !e.target.closest('.view-toggle')) {
            document.querySelectorAll('.view-container').forEach(view => view.classList.add('hidden'));
            viewToggles.forEach(btn => btn.classList.remove('active'));
        }
    });

    // Set Default Wallet and Category
    function setDefaults() {
        const walletButton = document.querySelector('[data-view="wallet"]');
        walletButton.textContent = 'Cash';
        const categoryButton = document.querySelector('[data-view="category"]');
        categoryButton.textContent = 'Food';
    }

    // Balance Styling
    function updateBalanceStyle() {
        const balanceElement = Array.from(document.querySelectorAll('.toptableinfo'))
            .find(el => el.querySelector('.cat').textContent.trim() === 'Balance');
        const valueElement = balanceElement.querySelector('.val');
        const numericValue = parseFloat(valueElement.textContent.replace(/,/g, ''));

        balanceElement.classList.remove('valuered', 'valueorange', 'valueyellow', 'valuegreen');
        if (numericValue < 51) {
            balanceElement.classList.add('valuered');
        } else if (numericValue <= 250) {
            balanceElement.classList.add('valueorange');
        } else if (numericValue <= 500) {
            balanceElement.classList.add('valueyellow');
        } else if (numericValue > 500) {
            balanceElement.classList.add('valuegreen');
        }
    }

    // Initial Balance Check
    updateBalanceStyle();

    // Watch for Balance Changes
    const balanceValueElement = document.querySelector('.toptableinfo:has(.cat:contains("Balance")) .val');
    if (balanceValueElement) {
        const observer = new MutationObserver(updateBalanceStyle);
        observer.observe(balanceValueElement, { characterData: true, subtree: true });
    }
});


document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('date-input');
    const timeInput = document.getElementById('time-input');
    
    // Set initial values to current datetime
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentTime = now.toTimeString().substring(0, 5);

    dateInput.value = today;
    timeInput.value = currentTime;

    // Update displayed values
    dateInput.addEventListener('change', updateDateDisplay);
    timeInput.addEventListener('change', updateTimeDisplay);

    function updateDateDisplay() {
        const date = new Date(this.value);
        const options = { month: 'short', day: 'numeric', year: 'numeric' };
        this.nextElementSibling.textContent = date.toLocaleDateString('en-US', options);
    }

    function updateTimeDisplay() {
        const [hours, minutes] = this.value.split(':');
        const time = new Date();
        time.setHours(hours);
        time.setMinutes(minutes);
        this.nextElementSibling.textContent = time.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).replace(/ /g, '');
    }

    // Initial display update
    updateDateDisplay.call(dateInput);
    updateTimeDisplay.call(timeInput);
});


document.addEventListener('DOMContentLoaded', function() {
    // Database Setup
    const dbName = 'WalletAppDB';
    const dbVersion = 1;
    let db;
    const request = indexedDB.open(dbName, dbVersion);

    request.onerror = function(event) {
        console.error('Database error:', event.target.error);
    };

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains('transactions')) {
            const store = db.createObjectStore('transactions', {
                keyPath: 'id',
                autoIncrement: true
            });
            store.createIndex('date', 'date', { unique: false });
            store.createIndex('amount', 'amount', { unique: false });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        loadTransactions();
        updateBalance();
    };

    document.querySelector('.submit-btn').addEventListener('click', async function(e) {
        e.preventDefault();
        
        // Validate inputs
        const amountInput = document.querySelector('input[type="number"]');
        const amountValue = parseFloat(amountInput.value);
        
        if (isNaN(amountValue)) {
            alert('Please enter a valid amount');
            return;
        }
    
        const transaction = {
            date: document.getElementById('date-input').value,
            time: document.getElementById('time-input').value,
            category: document.querySelector('[data-view="category"]').textContent,
            wallet: document.querySelector('[data-view="wallet"]').textContent,
            amount: amountValue,
            type: document.querySelector('.type-btn.selected').dataset.type,
            description: document.querySelector('input[type="text"]').value
        };
    
        try {
            // Create transaction and keep reference
            const tx = db.transaction('transactions', 'readwrite');
            const store = tx.objectStore('transactions');
            
            // Wrap in Promise to properly await completion
            await new Promise((resolve, reject) => {
                const request = store.add(transaction);
                
                request.onsuccess = () => {
                    // Keep transaction alive until completion
                    tx.oncomplete = () => {
                        console.log('Transaction committed');
                        resolve();
                    };
                    
                    tx.onerror = (event) => {
                        reject(event.target.error);
                    };
                };
                
                request.onerror = (event) => {
                    reject(event.target.error);
                };
            });
    
            // Update UI after successful commit
            document.querySelector('.add-form').reset();
            await loadTransactions();
            updateBalance();
            
            // Return to receipt page
            document.getElementById('add-page').classList.remove('active');
            document.getElementById('receipt-page').classList.add('active');
            footer.classList.remove('hidden');
            addBtn.classList.remove('hidden');
    
        } catch (error) {
            console.error('Transaction failed:', error);
            alert('Failed to save transaction. Please try again.');
        }
    });

    // Enhanced loadTransactions function
    async function loadTransactions() {
        const receiptArea = document.querySelector('.receiptarea');
        receiptArea.innerHTML = '<div class="loading">Loading transactions...</div>';

        return new Promise((resolve) => {
            const tx = db.transaction('transactions', 'readonly');
            const store = tx.objectStore('transactions');
            const request = store.getAll();

            request.onsuccess = function() {
                receiptArea.innerHTML = '';
                const transactions = request.result;
                
                if (transactions.length === 0) {
                    receiptArea.innerHTML = '<p class="no-transactions">No transactions found</p>';
                    return resolve();
                }

                const grouped = groupByDate(transactions);
                grouped.forEach(group => {
                    receiptArea.innerHTML += `<p class="daytitle">${formatDisplayDate(group.date)}</p>`;
                    group.transactions.forEach(trans => {
                        receiptArea.innerHTML += `
                            <div class="transdiv">
                                <div class="transleft">
                                    <p class="transcat">${trans.category}</p>
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
            };

            request.onerror = function() {
                receiptArea.innerHTML = '<p class="error">Error loading transactions</p>';
                resolve();
            };
        });
    }

    function groupByDate(transactions) {
        const groups = {};
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        transactions.forEach(trans => {
            const dateKey = trans.date;
            if (!groups[dateKey]) {
                groups[dateKey] = {
                    date: trans.date,
                    transactions: []
                };
            }
            groups[dateKey].transactions.push(trans);
        });

        return Object.values(groups);
    }

    function formatDisplayDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric'
        });
    }
});

