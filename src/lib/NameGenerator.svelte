<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import { adapters, getAdapter } from './adapters/registry';
  import { FallbackAdapter } from './adapters/fallback';

  // State runes
  let selectedApiId = $state(adapters[0].id);
  let selectedSubcategory = $state(adapters[0].subcategories[0].id);
  let wordCount = $state(3);
  let casing = $state('kebab-case');
  let splitWords = $state(true);
  let generatedName = $state('');
  let isLoading = $state(false);
  let isCopied = $state(false);
  let statusMessage = $state({ type: 'info', text: 'Configure and click Generate' });
  let savedNames = $state<string[]>([]);
  let history = $state<string[]>([]);

  // Helper to re-case an already formatted name
  function recase(name: string, targetCasing: string): string {
    if (!name) return name;
    const normalized = name
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
      .replace(/[-_\s]+/g, ' ')
      .trim();
    const words = normalized.split(' ').filter(Boolean);
    return cleanAndFormat(words, targetCasing);
  }

  // Reactive effect to update name, history, and saved list casing dynamically when format changes
  let lastCasing = $state('kebab-case');
  $effect(() => {
    const newCasing = casing;
    if (newCasing !== lastCasing) {
      untrack(() => {
        if (generatedName) {
          generatedName = recase(generatedName, newCasing);
        }
        history = history.map(name => recase(name, newCasing));
        savedNames = savedNames.map(name => recase(name, newCasing));
        
        // Persist modified lists
        localStorage.setItem('project_name_generator_history', JSON.stringify(history));
        localStorage.setItem('project_name_generator_saved', JSON.stringify(savedNames));
      });
      lastCasing = newCasing;
    }
  });

  // In-memory cache for API items
  const itemCache: Record<string, string[]> = {};

  // Computed subcategories based on selected API
  const currentAdapter = $derived(getAdapter(selectedApiId));
  const subcategories = $derived(currentAdapter.subcategories);

  // Reset subcategory if it's not valid for the new API
  function handleApiChange(e: Event) {
    const select = e.target as HTMLSelectElement;
    selectedApiId = select.value;
    const adapter = getAdapter(selectedApiId);
    selectedSubcategory = adapter.subcategories[0].id;
  }

  // Tokenize and clean phrases into words
  function extractWords(items: string[], shouldSplit: boolean): string[] {
    if (!shouldSplit) {
      return items.map(item => item.replace(/[^a-zA-Z0-9\s-_]/g, '').trim()).filter(Boolean);
    }
    
    const wordSet = new Set<string>();
    items.forEach(item => {
      // Split by spaces, hyphens, underscores
      const parts = item.split(/[\s\-_]+/);
      parts.forEach(part => {
        const clean = part.replace(/[^a-zA-Z0-9]/g, '');
        // Filter out single-character initials or purely numeric tokens
        if (clean.length >= 2 && !/^\d+$/.test(clean)) {
          wordSet.add(clean);
        }
      });
    });
    
    return Array.from(wordSet);
  }

  // Random selection helper
  function getRandomSelection(pool: string[], count: number): string[] {
    if (pool.length === 0) return [];
    const selected: string[] = [];
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * pool.length);
      selected.push(pool[idx]);
    }
    return selected;
  }

  // Format words into the desired casing style
  function cleanAndFormat(words: string[], casingType: string): string {
    if (words.length === 0) return 'No words found';

    if (casingType === 'kebab-case') {
      return words.map(w => w.toLowerCase().replace(/[\s_]+/g, '-')).join('-');
    }
    if (casingType === 'snake_case') {
      return words.map(w => w.toLowerCase().replace(/[\s-]+/g, '_')).join('_');
    }
    if (casingType === 'camelCase') {
      return words.map((w, idx) => {
        const flat = w.replace(/[\s-_]+/g, '');
        if (idx === 0) return flat.toLowerCase();
        return flat.charAt(0).toUpperCase() + flat.slice(1).toLowerCase();
      }).join('');
    }
    if (casingType === 'PascalCase') {
      return words.map(w => {
        const flat = w.replace(/[\s-_]+/g, '');
        return flat.charAt(0).toUpperCase() + flat.slice(1).toLowerCase();
      }).join('');
    }
    // Space Separated / Title Case
    return words.map(w => {
      const cleanWord = w.replace(/[-_]+/g, ' ').trim();
      return cleanWord.replace(/\b\w/g, c => c.toUpperCase());
    }).join(' ');
  }

  // Core generator process
  async function generate() {
    isLoading = true;
    isCopied = false;
    statusMessage = { type: 'info', text: 'Fetching fresh options...' };

    const cacheKey = `${selectedApiId}-${selectedSubcategory}`;
    let items = itemCache[cacheKey];

    try {
      if (!items) {
        const adapter = getAdapter(selectedApiId);
        items = await adapter.fetchItems(selectedSubcategory);
        if (!items || items.length === 0) {
          throw new Error('API returned an empty dataset');
        }
        itemCache[cacheKey] = items;
      }
      statusMessage = { type: 'success', text: `Loaded data from ${currentAdapter.name}` };
    } catch (err: any) {
      console.warn(`Request to ${selectedApiId} failed:`, err);
      statusMessage = { 
        type: 'warning', 
        text: `Network issues accessing ${currentAdapter.name}. Using local offline backup.` 
      };

      // Fallback
      try {
        items = await FallbackAdapter.fetchItems('all');
      } catch {
        statusMessage = { type: 'error', text: 'Critical error: Local fallback database is empty.' };
        isLoading = false;
        return;
      }
    }

    const pool = extractWords(items, splitWords);
    if (pool.length === 0) {
      statusMessage = { type: 'error', text: 'No words could be tokenized. Try another API/subcategory.' };
      isLoading = false;
      return;
    }

    const selectedWords = getRandomSelection(pool, wordCount);
    generatedName = cleanAndFormat(selectedWords, casing);

    // Save to history list
    addToHistory(generatedName);
    isLoading = false;
  }

  // Copy to clipboard
  async function copyToClipboard(text: string) {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      isCopied = true;
      setTimeout(() => {
        isCopied = false;
      }, 1800);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }

  // History & Save names functions
  function addToHistory(name: string) {
    if (history.includes(name)) {
      // Move to top of history
      history = [name, ...history.filter(n => n !== name)];
    } else {
      history = [name, ...history.slice(0, 9)];
    }
    localStorage.setItem('project_name_generator_history', JSON.stringify(history));
  }

  function toggleSave(name: string) {
    if (!name) return;
    if (savedNames.includes(name)) {
      savedNames = savedNames.filter(n => n !== name);
    } else {
      savedNames = [name, ...savedNames];
    }
    localStorage.setItem('project_name_generator_saved', JSON.stringify(savedNames));
  }

  function deleteSaved(name: string) {
    savedNames = savedNames.filter(n => n !== name);
    localStorage.setItem('project_name_generator_saved', JSON.stringify(savedNames));
  }

  function clearHistory() {
    history = [];
    localStorage.removeItem('project_name_generator_history');
  }

  onMount(() => {
    const savedHist = localStorage.getItem('project_name_generator_history');
    if (savedHist) history = JSON.parse(savedHist);
    const savedFavs = localStorage.getItem('project_name_generator_saved');
    if (savedFavs) savedNames = JSON.parse(savedFavs);
    
    // Initial name generation
    generate();
  });
</script>

<div class="generator-container">
  <!-- Header -->
  <header class="app-header">
    <div class="logo-badge">Codename Forge</div>
    <h1>Random Project Name Generator</h1>
    <p class="subtitle">Assemble unique, theme-based codenames utilizing public api data feeds.</p>
  </header>

  <!-- Main Generation Sandbox -->
  <div class="sandbox-grid">
    
    <!-- Configurator Panel -->
    <div class="panel config-panel">
      <h2>Configure API Feeds</h2>
      
      <div class="form-group">
        <label for="api-select">API Provider</label>
        <select id="api-select" value={selectedApiId} onchange={handleApiChange}>
          {#each adapters as adapter}
            <option value={adapter.id}>{adapter.name}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <label for="subcategory-select">Dataset Subcategory</label>
        <select id="subcategory-select" bind:value={selectedSubcategory}>
          {#each subcategories as cat}
            <option value={cat.id}>{cat.name}</option>
          {/each}
        </select>
      </div>

      <div class="form-group">
        <div class="slider-header">
          <label for="word-count-slider">Codenames Length</label>
          <span class="badge">{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
        </div>
        <input 
          id="word-count-slider" 
          type="range" 
          min="1" 
          max="8" 
          bind:value={wordCount}
          class="range-slider"
        />
      </div>

      <div class="form-group">
        <label for="casing-select">Output Casing Format</label>
        <select id="casing-select" bind:value={casing}>
          <option value="kebab-case">kebab-case (project-codename-here)</option>
          <option value="snake_case">snake_case (project_codename_here)</option>
          <option value="camelCase">camelCase (projectCodenameHere)</option>
          <option value="PascalCase">PascalCase (ProjectCodenameHere)</option>
          <option value="space">Space Separated (Project Codename Here)</option>
        </select>
      </div>

      <div class="form-group toggle-group">
        <div class="toggle-description">
          <span class="toggle-title">Tokenize API Values</span>
          <span class="toggle-subtitle">Extract single words (e.g. "Spock", "Kirk") instead of whole names/phrases.</span>
        </div>
        <label class="switch">
          <input type="checkbox" bind:checked={splitWords} />
          <span class="slider-round"></span>
        </label>
      </div>

      <button 
        type="button" 
        class="btn btn-primary btn-generate" 
        onclick={generate}
        disabled={isLoading}
      >
        {#if isLoading}
          <span class="spinner"></span> Working...
        {:else}
          Generate New Codename
        {/if}
      </button>
    </div>

    <!-- Output Display Panel -->
    <div class="display-panel">
      <!-- Generated Name Card -->
      <div class="name-card">
        <div class="card-glow"></div>
        <div class="name-container">
          {#if isLoading}
            <div class="shimmer-line"></div>
          {:else}
            <span class="name-text">{generatedName || 'No Name Generated'}</span>
          {/if}
        </div>
        
        <div class="name-actions">
          <button 
            type="button" 
            class="btn btn-secondary btn-action" 
            onclick={() => copyToClipboard(generatedName)}
            disabled={!generatedName || isLoading}
            aria-label="Copy to clipboard"
          >
            {#if isCopied}
              <svg class="action-icon success" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              Copied!
            {:else}
              <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            {/if}
          </button>

          <button 
            type="button" 
            class="btn btn-secondary btn-action" 
            onclick={() => toggleSave(generatedName)}
            disabled={!generatedName || isLoading}
            aria-label="Favorite name"
          >
            {#if savedNames.includes(generatedName)}
              <svg class="action-icon star-active" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              Starred
            {:else}
              <svg class="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              Star Name
            {/if}
          </button>
        </div>
      </div>

      <!-- Feed Status Indicator -->
      <div class="status-badge {statusMessage.type}">
        <span class="status-dot"></span>
        <span class="status-text">{statusMessage.text}</span>
      </div>

      <!-- Saved & History Split -->
      <div class="lists-container">
        <!-- Starred Column -->
        <div class="list-section">
          <div class="section-title-bar">
            <h3>Starred Codenames</h3>
            <span class="badge badge-accent">{savedNames.length}</span>
          </div>
          
          <div class="list-scroll">
            {#if savedNames.length === 0}
              <p class="empty-state">Starred names will appear here.</p>
            {:else}
              <ul class="items-list">
                {#each savedNames as item}
                  <li class="item-row">
                    <button type="button" class="item-text-btn" onclick={() => copyToClipboard(item)}>
                      {item}
                    </button>
                    <button type="button" class="btn-delete" onclick={() => deleteSaved(item)} aria-label="Delete saved name">
                      <svg class="delete-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>

        <!-- History Column -->
        <div class="list-section">
          <div class="section-title-bar">
            <h3>Recent History</h3>
            {#if history.length > 0}
              <button type="button" class="btn-clear" onclick={clearHistory}>Clear</button>
            {/if}
          </div>

          <div class="list-scroll">
            {#if history.length === 0}
              <p class="empty-state">Codenames history is empty.</p>
            {:else}
              <ul class="items-list">
                {#each history as item}
                  <li class="item-row history-row">
                    <button type="button" class="item-text-btn" onclick={() => copyToClipboard(item)}>
                      {item}
                    </button>
                    {#if savedNames.includes(item)}
                      <svg class="star-icon-small" viewBox="0 0 24 24" fill="currentColor">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                    {:else}
                      <button type="button" class="btn-star-small" onclick={() => toggleSave(item)} aria-label="Star name">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                      </button>
                    {/if}
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
        </div>
      </div>
      
    </div>
  </div>
</div>
