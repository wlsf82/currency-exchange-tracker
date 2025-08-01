class CurrencyExchangeTracker {
  constructor() {
    this.currentCurrency = 'BRL';
    this.lastRates = null;
    this.isLoading = false;
    this.fetchInterval = null;
    this.currentView = 'single'; // 'single' or 'comparison'
    this.comparisonData = {}; // Store data for all currencies
    this.selectedCurrencies = ['BRL', 'EUR', 'USD']; // Default comparison selection
    this.isOnline = navigator.onLine; // Track online status

    // Currency configurations
    this.currencyConfig = {
      BRL: {
        name: 'Brazilian Real',
        symbol: 'BRL',
        icon: 'R$',
        flag: '🇧🇷',
        color: '#28a745',
        baseCode: 'BRL'
      },
      EUR: {
        name: 'Euro',
        symbol: 'EUR',
        icon: '€',
        flag: '🇪🇺',
        color: '#4a90e2',
        baseCode: 'EUR'
      },
      USD: {
        name: 'US Dollar',
        symbol: 'USD',
        icon: '$',
        flag: '🇺🇸',
        color: '#00875f',
        baseCode: 'USD'
      }
    };

    // Exchange rate API configuration
    this.apiConfig = {
      baseUrl: 'https://api.fxratesapi.com/latest?base=',
      fallbackUrl: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/'
    };

    this.initializeElements();
    this.registerServiceWorker();
    this.setupEventListeners();
    this.setupNetworkListeners(); // Add network event listeners
    this.updateTheme();
    this.updateCurrencyInfo();

    this.fetchExchangeRates(); // Initial fetch only
    this.startAutoFetch(); // Start automatic fetching every 30 seconds
    this.renderComparisonCards(); // Initialize comparison view
    this.initializeViewState(); // Set initial view state
    this.initializeConverter(); // Initialize currency converter
  }

  initializeViewState() {
    // Ensure the initial view is properly set
    if (this.currentView === 'single') {
      this.elements.singleView.classList.remove('hidden');
      this.elements.comparisonView.classList.add('hidden');
      const currencySelector = document.querySelector('.currency-selector');
      if (currencySelector) {
        currencySelector.style.display = 'flex';
      }
    }
  }

  initializeElements() {
    this.elements = {
      // Single view elements
      currencyFlag: document.getElementById('currencyFlag'),
      currencyName: document.getElementById('currencyName'),
      currencyCode: document.getElementById('currencyCode'),
      rateLabel1: document.getElementById('rateLabel1'),
      rateLabel2: document.getElementById('rateLabel2'),
      rateValue1: document.getElementById('rateValue1'),
      rateValue2: document.getElementById('rateValue2'),
      lastUpdated: document.getElementById('lastUpdated'),
      statusDot: document.getElementById('statusDot'),
      statusText: document.getElementById('statusText'),
      updateBtn: document.getElementById('updateBtn'),
      currencyButtons: document.querySelectorAll('.currency-btn'),

      // Converter elements
      fromAmount: document.getElementById('fromAmount'),
      fromCurrency: document.getElementById('fromCurrency'),
      toAmount: document.getElementById('toAmount'),
      toCurrency: document.getElementById('toCurrency'),

      // View toggle elements
      viewButtons: document.querySelectorAll('.view-btn'),
      singleView: document.getElementById('singleView'),
      comparisonView: document.getElementById('comparisonView'),

      // Comparison elements
      comparisonCards: document.getElementById('comparisonCards'),
      comparisonUpdateBtn: document.getElementById('comparisonUpdateBtn'),
      comparisonStatusDot: document.getElementById('comparisonStatusDot'),
      comparisonStatusText: document.getElementById('comparisonStatusText'),
      currencyCheckboxes: document.querySelectorAll('.currency-checkbox input[type="checkbox"]')
    };
  }

  setupEventListeners() {
    this.elements.updateBtn.addEventListener('click', () => {
      this.fetchExchangeRates();
    });

    this.elements.currencyButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const currency = e.currentTarget.dataset.currency;
        this.switchCurrency(currency);
      });
    });

    // View toggle listeners
    this.elements.viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });

    // Comparison update button
    this.elements.comparisonUpdateBtn.addEventListener('click', () => {
      if (this.selectedCurrencies.length >= 2) {
        this.fetchComparisonData();
      }
    });

    // Currency checkbox listeners for comparison
    this.elements.currencyCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        this.updateSelectedCurrencies();
      });
    });

    // Converter listeners
    this.elements.fromAmount.addEventListener('input', () => {
      this.updateConversion();
    });

    this.elements.fromCurrency.addEventListener('change', () => {
      this.updateConversion();
    });

    this.elements.toCurrency.addEventListener('change', () => {
      this.updateConversion();
    });
  }

  setupNetworkListeners() {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.handleOnlineStatus(true);
    });

    window.addEventListener('offline', () => {
      this.handleOnlineStatus(false);
    });

    // Set initial status
    this.handleOnlineStatus(navigator.onLine);
  }

  handleOnlineStatus(isOnline) {
    this.isOnline = isOnline;

    if (isOnline) {
      this.updateStatus('success', 'Back online - refreshing data...');
      // Restart auto-fetch when coming back online
      this.startAutoFetch();
      // Immediately fetch fresh data
      if (this.currentView === 'single') {
        this.fetchExchangeRates();
      } else if (this.selectedCurrencies.length >= 2) {
        this.fetchComparisonData();
      }
    } else {
      this.updateStatus('error', 'Offline - showing cached data');
      // Stop auto-fetch when going offline
      if (this.fetchInterval) {
        clearInterval(this.fetchInterval);
        this.fetchInterval = null;
      }
    }
  }

  switchCurrency(currency) {
    if (this.currentCurrency === currency || this.isLoading) return;

    // Update active button
    this.elements.currencyButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.currency === currency) {
        btn.classList.add('active');
      }
    });

    this.currentCurrency = currency;
    this.lastRates = null;
    this.updateTheme();
    this.updateCurrencyInfo();
    this.fetchExchangeRates();

    // Update converter
    this.elements.fromCurrency.value = currency;
    this.updateConversion();

    // Restart auto-fetch for the new currency
    this.startAutoFetch();
  }

  updateCurrencyInfo() {
    const config = this.currencyConfig[this.currentCurrency];
    this.elements.currencyFlag.textContent = config.flag;
    this.elements.currencyName.textContent = config.name;
    this.elements.currencyCode.textContent = config.symbol;
  }

  initializeConverter() {
    // Set default values
    this.elements.fromCurrency.value = this.currentCurrency;
    this.elements.toCurrency.value = this.currentCurrency === 'USD' ? 'EUR' : 'USD';
    this.updateConversion();
  }

  updateConversion() {
    const fromAmount = parseFloat(this.elements.fromAmount.value) || 0;
    const fromCurrency = this.elements.fromCurrency.value;
    const toCurrency = this.elements.toCurrency.value;

    if (fromAmount === 0 || fromCurrency === toCurrency) {
      this.elements.toAmount.value = fromAmount.toFixed(2);
      this.elements.toAmount.placeholder = '';
      return;
    }

    const rate = this.getExchangeRate(fromCurrency, toCurrency);
    if (rate) {
      const toAmount = fromAmount * rate;
      this.elements.toAmount.value = toAmount.toFixed(2);
      this.elements.toAmount.placeholder = '';
    } else {
      this.elements.toAmount.value = '';
      this.elements.toAmount.placeholder = 'N/A';
    }
  }

  getExchangeRate(fromCurrency, toCurrency) {
    if (!this.comparisonData[fromCurrency]) {
      return null;
    }

    const fromData = this.comparisonData[fromCurrency];
    if (fromData.rates && fromData.rates[toCurrency]) {
      return fromData.rates[toCurrency];
    }

    return null;
  }

  updateTheme() {
    const config = this.currencyConfig[this.currentCurrency];
    const root = document.documentElement;

    root.style.setProperty('--primary-color', config.color);
    root.style.setProperty('--gradient', `linear-gradient(135deg, ${config.color}, ${this.lightenColor(config.color, 20)})`);

    // Update meta theme-color for browser UI
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', config.color);
    }
  }

  lightenColor(color, percent) {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = this.clampRGB((num >> 16) + amt);
    const G = this.clampRGB((num >> 8 & 0x00FF) + amt);
    const B = this.clampRGB((num & 0x0000FF) + amt);
    return '#' + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1);
  }

  clampRGB(value) {
    return Math.min(255, Math.max(0, value));
  }

  async fetchExchangeRates() {
    if (this.isLoading) return;

    // Check if we're offline
    if (!this.isOnline) {
      this.updateStatus('error', 'Offline - cannot fetch new rates');
      return;
    }

    this.isLoading = true;
    this.setButtonLoadingState(true);
    this.updateStatus('loading', 'Fetching exchange rates...');

    try {
      const response = await fetch(`${this.apiConfig.baseUrl}${this.currentCurrency}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data && data.rates) {
        this.updateExchangeRates(data);
        this.comparisonData[this.currentCurrency] = data;
        this.setButtonSuccessState();
        this.updateStatus('success', 'Rates updated successfully');
        this.updateConversion();
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      this.handleFetchError();
    } finally {
      this.isLoading = false;
      this.setButtonLoadingState(false);
    }
  }

  async handleFetchError() {
    try {
      // Try fallback API (fawazahmed0/exchange-api format)
      const response = await fetch(`${this.apiConfig.fallbackUrl}${this.currentCurrency.toLowerCase()}.json`);
      if (response.ok) {
        const data = await response.json();
        // Convert fawazahmed0 format to our expected format
        if (data && data[this.currentCurrency.toLowerCase()]) {
          const convertedData = {
            base: this.currentCurrency,
            rates: {}
          };

          // Convert from the new API format to our expected format
          const ratesData = data[this.currentCurrency.toLowerCase()];
          for (const [currency, rate] of Object.entries(ratesData)) {
            convertedData.rates[currency.toUpperCase()] = rate;
          }

          this.updateExchangeRates(convertedData);
          this.comparisonData[this.currentCurrency] = convertedData;
          this.updateStatus('warning', 'Using fallback rates');
          return;
        }
      }
    } catch (fallbackError) {
      console.error('Fallback API also failed:', fallbackError);
    }

    // No data available - show error
    this.updateStatus('error', 'Unable to fetch rates - please check connection');
  }

  updateExchangeRates(data) {
    const rates = data.rates;

    // Get the two currencies to compare against the current one
    const allCurrencies = ['BRL', 'EUR', 'USD'];
    const otherCurrencies = allCurrencies.filter(curr => curr !== this.currentCurrency);

    // Update labels and values for the two comparison currencies
    const currency1 = otherCurrencies[0];
    const currency2 = otherCurrencies[1];

    // Update first comparison rate
    this.elements.rateLabel1.textContent = `to ${currency1}`;
    if (rates[currency1]) {
      const currency1Symbol = this.currencyConfig[currency1].icon;
      this.elements.rateValue1.textContent = `${currency1Symbol} ${rates[currency1].toFixed(2)}`;
    } else {
      this.elements.rateValue1.textContent = 'N/A';
    }

    // Update second comparison rate
    this.elements.rateLabel2.textContent = `to ${currency2}`;
    if (rates[currency2]) {
      const currency2Symbol = this.currencyConfig[currency2].icon;
      this.elements.rateValue2.textContent = `${currency2Symbol} ${rates[currency2].toFixed(2)}`;
    } else {
      this.elements.rateValue2.textContent = 'N/A';
    }

    // Update last updated time
    this.elements.lastUpdated.textContent = new Date().toLocaleTimeString();

    // Store current rates for next comparison
    this.lastRates = { ...rates };
  }

  updateStatus(type, message) {
    this.elements.statusText.textContent = message;
    this.elements.statusDot.className = `status-dot ${type}`;

    if (this.elements.comparisonStatusText) {
      this.elements.comparisonStatusText.textContent = message;
      this.elements.comparisonStatusDot.className = `status-dot ${type}`;
    }
  }

  setButtonLoadingState(isLoading) {
    const updateBtn = this.elements.updateBtn;
    if (isLoading) {
      updateBtn.disabled = true;
      updateBtn.classList.add('loading');
      updateBtn.classList.remove('success');
    } else {
      updateBtn.disabled = false;
      updateBtn.classList.remove('loading');
    }
  }

  setButtonSuccessState() {
    const updateBtn = this.elements.updateBtn;
    updateBtn.classList.add('success');
    updateBtn.classList.remove('loading');

    // Remove success state after animation
    setTimeout(() => {
      updateBtn.classList.remove('success');
    }, 600);
  }

  setComparisonButtonLoadingState(isLoading) {
    const comparisonUpdateBtn = this.elements.comparisonUpdateBtn;
    if (isLoading) {
      comparisonUpdateBtn.disabled = true;
      comparisonUpdateBtn.classList.add('loading');
      comparisonUpdateBtn.classList.remove('success');
    } else {
      comparisonUpdateBtn.disabled = false;
      comparisonUpdateBtn.classList.remove('loading');
    }
  }

  setComparisonButtonSuccessState() {
    const comparisonUpdateBtn = this.elements.comparisonUpdateBtn;
    comparisonUpdateBtn.classList.add('success');
    comparisonUpdateBtn.classList.remove('loading');

    // Remove success state after animation
    setTimeout(() => {
      comparisonUpdateBtn.classList.remove('success');
    }, 600);
  }

  switchView(view) {
    if (this.currentView === view) return;

    this.currentView = view;

    // Update view toggle buttons
    this.elements.viewButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.view === view) {
        btn.classList.add('active');
      }
    });

    // Toggle views
    if (view === 'single') {
      this.elements.singleView.classList.remove('hidden');
      this.elements.comparisonView.classList.add('hidden');
      document.querySelector('.currency-selector').style.display = 'flex';
    } else {
      this.elements.singleView.classList.add('hidden');
      this.elements.comparisonView.classList.remove('hidden');
      document.querySelector('.currency-selector').style.display = 'none';
      if (this.selectedCurrencies.length >= 2) {
        this.fetchComparisonData();
      } else {
        // Show the message if fewer than 2 currencies are selected
        this.renderComparisonCards();
      }
    }
  }

  async fetchComparisonData() {
    if (this.isLoading) return;

    // Check if we're offline
    if (!this.isOnline) {
      this.updateStatus('error', 'Offline - cannot fetch new comparison data');
      return;
    }

    this.isLoading = true;
    this.setComparisonButtonLoadingState(true);
    this.updateStatus('loading', 'Fetching comparison data...');

    try {
      const promises = this.selectedCurrencies.map(async (currency) => {
        if (this.comparisonData[currency] && this.isDataFresh(this.comparisonData[currency])) {
          return { currency, data: this.comparisonData[currency] };
        }

        try {
          const response = await fetch(`${this.apiConfig.baseUrl}${currency}`);
          if (!response.ok) throw new Error(`Failed to fetch ${currency}`);

          const data = await response.json();
          this.comparisonData[currency] = { ...data, fetchTime: Date.now() };
          return { currency, data: this.comparisonData[currency] };
        } catch (error) {
          console.error(`Error fetching ${currency}:`, error);
          return {
            currency,
            data: null
          };
        }
      });

      const results = await Promise.all(promises);
      results.forEach(({ currency, data }) => {
        if (data) {
          this.comparisonData[currency] = data;
        }
      });

      this.renderComparisonCards();
      this.setComparisonButtonSuccessState();
      this.updateStatus('success', 'Comparison data updated');
      this.updateConversion();
    } catch (error) {
      console.error('Error in comparison fetch:', error);
      this.updateStatus('error', 'Failed to update comparison data');
    } finally {
      this.isLoading = false;
      this.setComparisonButtonLoadingState(false);
    }
  }

  isDataFresh(data) {
    if (!data.fetchTime) return false;
    const fiveMinutes = 5 * 60 * 1000;
    return (Date.now() - data.fetchTime) < fiveMinutes;
  }

  renderComparisonCards() {
    if (!this.elements.comparisonCards) return;

    this.elements.comparisonCards.innerHTML = '';

    // Check if fewer than 2 currencies are selected
    if (this.selectedCurrencies.length < 2) {
      // Add class to indicate message card is shown
      this.elements.comparisonCards.classList.add('message-only');

      // Disable the update button when showing the message
      if (this.elements.comparisonUpdateBtn) {
        this.elements.comparisonUpdateBtn.disabled = true;
      }

      const messageCard = document.createElement('div');
      messageCard.className = 'comparison-message-card';
      messageCard.innerHTML = `
        <div class="comparison-message">
          <div class="message-icon">📊</div>
          <div class="message-text">Select at least two currencies to compare</div>
        </div>
      `;
      this.elements.comparisonCards.appendChild(messageCard);
      return;
    }

    // Remove the message-only class when showing comparison cards
    this.elements.comparisonCards.classList.remove('message-only');

    // Re-enable the update button when showing comparison cards
    if (this.elements.comparisonUpdateBtn) {
      this.elements.comparisonUpdateBtn.disabled = false;
    }

    this.selectedCurrencies.forEach(currency => {
      const config = this.currencyConfig[currency];
      const data = this.comparisonData[currency];

      if (!data) return;

      const card = document.createElement('div');
      card.className = 'comparison-card';
      card.style.borderColor = config.color;

      const rates = data.rates || {};
      const otherCurrencies = this.selectedCurrencies.filter(c => c !== currency);

      const rateItems = otherCurrencies.map(toCurrency => {
        const rate = rates[toCurrency];
        const toConfig = this.currencyConfig[toCurrency];

        return `
          <div class="comparison-rate">
            <span class="to-currency">${toConfig.flag} ${toCurrency}</span>
            <span class="rate-value">${rate ? `${toConfig.icon} ${rate.toFixed(2)}` : 'N/A'}</span>
          </div>
        `;
      }).join('');

      card.innerHTML = `
        <div class="comparison-header">
          <span class="currency-flag">${config.flag}</span>
          <div class="currency-info">
            <div class="currency-name">${config.name}</div>
            <div class="currency-code">${config.symbol}</div>
          </div>
        </div>
        <div class="comparison-rates">
          ${rateItems}
        </div>
        <div class="comparison-updated">
          Updated: ${new Date().toLocaleTimeString()}
        </div>
      `;

      this.elements.comparisonCards.appendChild(card);
    });
  }

  updateSelectedCurrencies() {
    const selected = Array.from(this.elements.currencyCheckboxes)
      .filter(checkbox => checkbox.checked)
      .map(checkbox => checkbox.dataset.currency);

    this.selectedCurrencies = selected;

    if (this.currentView === 'comparison') {
      if (this.selectedCurrencies.length >= 2) {
        this.fetchComparisonData();
      } else {
        // Show message immediately when fewer than 2 currencies are selected (including when none are selected)
        this.renderComparisonCards();
      }
    }
  }

  startAutoFetch() {
    if (this.fetchInterval) {
      clearInterval(this.fetchInterval);
    }

    // Only start auto-fetch if we're online
    if (!this.isOnline) {
      return;
    }

    // Fetch every 30 seconds
    this.fetchInterval = setInterval(() => {
      // Double-check online status before each fetch
      if (!this.isOnline) {
        clearInterval(this.fetchInterval);
        this.fetchInterval = null;
        return;
      }

      if (this.currentView === 'single') {
        this.fetchExchangeRates();
      } else if (this.selectedCurrencies.length >= 2) {
        this.fetchComparisonData();
      }
    }, 30000);
  }

  // Service Worker registration
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('./sw.js');
        console.log('Service Worker registered successfully:', registration.scope);

        // Handle service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('New service worker found, installing...');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('New service worker installed, will take control on next load');
              // Optionally reload the page to activate the new service worker immediately
              // window.location.reload();
            }
          });
        });

        // Listen for controlling service worker changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('Service worker controller changed, reloading...');
          window.location.reload();
        });

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }
}

// Initialize the app when DOM is loaded
let currencyTracker;

document.addEventListener('DOMContentLoaded', () => {
  currencyTracker = new CurrencyExchangeTracker();
});
