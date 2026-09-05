(() => {
  const form = document.querySelector('.filters');
  if (!form) return;

  form.classList.add('is-dynamic');

  const statusSelect = document.getElementById('status-filter');
  const severitySelect = document.getElementById('severity-filter');
  const clearWrapper = document.getElementById('clear-filters-wrapper');
  const resultsContainer = document.getElementById('incidents-results');

  let currentAbortController = null;

  async function updateResults(url, push = true) {
    if (currentAbortController) {
      currentAbortController.abort();
    }
    currentAbortController = new AbortController();

    if (resultsContainer) {
      resultsContainer.classList.add('is-loading');
    }

    try {
      const response = await fetch(url, {
        signal: currentAbortController.signal,
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });

      if (!response.ok) throw new Error('Falha ao atualizar incidentes');

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const newResults = doc.getElementById('incidents-results');
      const newClearWrapper = doc.getElementById('clear-filters-wrapper');

      if (resultsContainer && newResults) {
        resultsContainer.innerHTML = newResults.innerHTML;
      }

      if (clearWrapper && newClearWrapper) {
        clearWrapper.innerHTML = newClearWrapper.innerHTML;
      }

      if (push && window.location.href !== url) {
        window.history.pushState(null, '', url);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Erro na atualização de filtros:', error);
      }
    } finally {
      if (resultsContainer) {
        resultsContainer.classList.remove('is-loading');
      }
    }
  }

  function onFilterChange() {
    const params = new URLSearchParams();
    if (statusSelect && statusSelect.value) params.set('status', statusSelect.value);
    if (severitySelect && severitySelect.value) params.set('severity', severitySelect.value);

    const queryString = params.toString();
    const url = queryString ? `/?${queryString}` : '/';
    updateResults(url, true);
  }

  statusSelect?.addEventListener('change', onFilterChange);
  severitySelect?.addEventListener('change', onFilterChange);

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    onFilterChange();
  });

  document.addEventListener('click', (event) => {
    const clearTrigger = event.target.closest('.clear-filters, .clear-filters-btn');
    if (clearTrigger) {
      event.preventDefault();
      if (statusSelect) statusSelect.value = '';
      if (severitySelect) severitySelect.value = '';
      updateResults('/', true);
    }
  });

  window.addEventListener('popstate', () => {
    const urlParams = new URLSearchParams(window.location.search);
    if (statusSelect) statusSelect.value = urlParams.get('status') || '';
    if (severitySelect) severitySelect.value = urlParams.get('severity') || '';
    updateResults(window.location.pathname + window.location.search, false);
  });
})();

