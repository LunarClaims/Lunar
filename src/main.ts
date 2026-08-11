import './style.css'
import stockData from '../public/stock.json'

interface StockItem {
  username: string
  status: string
  tier?: string | null
  bin_cents?: number | null
  offer_cents?: number | null
}

interface StockExport {
  updated_at: string
  items: StockItem[]
}

type StatusFilter = 'all' | 'available' | 'sold'

const CONTACT = {
  telegramUrl: 'https://t.me/lunarclaims',
  telegramLabel: '@lunarclaims',
  handles: [
    { label: '@hispanics999', href: 'https://t.me/hispanics999' },
  ],
} as const

const app = document.getElementById('app')!
const catalog = {
  ...(stockData as StockExport),
  items: (stockData as StockExport).items.filter((item) => item.status !== 'pending'),
}
let statusFilter: StatusFilter = 'all'
let minPrice = ''
let maxPrice = ''
let sortBy: 'name' | 'price-asc' | 'price-desc' = 'price-asc'

function formatUsd(cents: number | null | undefined): string {
  if (cents == null || cents <= 0) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatUpdated(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

function listPrice(item: StockItem): number | null {
  return item.bin_cents ?? item.offer_cents ?? null
}

function statusLabel(status: string): string {
  if (status === 'available') return 'Available'
  if (status === 'sold') return 'Sold'
  return status
}

function parsePriceInput(value: string): number | null {
  const trimmed = value.trim().replace(/[$,]/g, '')
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n < 0) return null
  return Math.round(n * 100)
}

function filteredItems(items: StockItem[]): StockItem[] {
  const minCents = parsePriceInput(minPrice)
  const maxCents = parsePriceInput(maxPrice)

  let result = items.filter((item) => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false

    const price = listPrice(item)
    if (minCents != null && (price == null || price < minCents)) return false
    if (maxCents != null && (price == null || price > maxCents)) return false
    return true
  })

  result = [...result].sort((a, b) => {
    if (sortBy === 'name') return a.username.localeCompare(b.username)
    const pa = listPrice(a)
    const pb = listPrice(b)
    if (pa == null && pb == null) return a.username.localeCompare(b.username)
    if (pa == null) return 1
    if (pb == null) return -1
    if (sortBy === 'price-desc') return pb - pa
    return pa - pb
  })

  return result
}

function renderCard(item: StockItem, index: number): string {
  const statusClass =
    item.status === 'available' ? 'badge-available' : item.status === 'sold' ? 'badge-sold' : 'badge-tier'
  const tierBadge = item.tier ? `<span class="badge badge-tier">${escapeHtml(item.tier)}</span>` : ''
  const soldClass = item.status === 'sold' ? ' card-sold' : ''

  return `
    <article class="card${soldClass}" style="animation-delay: ${Math.min(index * 45, 360)}ms">
      <div class="card-top">
        <span class="username">/${escapeHtml(item.username)}</span>
        <div class="badges">
          <span class="badge ${statusClass}">${escapeHtml(statusLabel(item.status))}</span>
          ${tierBadge}
        </div>
      </div>
      <div class="prices">
        <div class="price-block">
          <span class="price-label">BIN</span>
          <span class="price-value ${item.bin_cents != null && item.bin_cents > 0 ? 'accent' : 'muted'}">${formatUsd(item.bin_cents)}</span>
        </div>
        <div class="price-block">
          <span class="price-label">${item.status === 'sold' ? 'Sold for' : 'Offer'}</span>
          <span class="price-value ${item.offer_cents != null && item.offer_cents > 0 ? '' : 'muted'}">${formatUsd(item.offer_cents)}</span>
        </div>
      </div>
    </article>
  `
}

function renderContact(): string {
  const handleLinks = CONTACT.handles
    .map(
      (handle) => `
        <a class="contact-handle" href="${handle.href}" target="_blank" rel="noopener noreferrer">
          <span class="contact-handle-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M9.78 14.52 9.4 18.1c.55 0 .79-.24 1.08-.52l2.59-2.48 5.37 3.93c.98.54 1.68.26 1.95-.9l3.52-16.5h.01c.31-1.45-.52-2.02-1.47-1.67L2.2 9.44c-1.42.55-1.4 1.34-.24 1.7l5.26 1.64 12.2-7.68c.57-.35 1.09-.16.66.2"/></svg>
          </span>
          <span class="contact-handle-label">${escapeHtml(handle.label)}</span>
          <span class="contact-handle-arrow" aria-hidden="true">↗</span>
        </a>`,
    )
    .join('')

  return `
    <aside class="contact-panel">
      <div class="contact-inner">
        <div class="contact-channel-badge">
          <span class="telegram-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M9.78 14.52 9.4 18.1c.55 0 .79-.24 1.08-.52l2.59-2.48 5.37 3.93c.98.54 1.68.26 1.95-.9l3.52-16.5h.01c.31-1.45-.52-2.02-1.47-1.67L2.2 9.44c-1.42.55-1.4 1.34-.24 1.7l5.26 1.64 12.2-7.68c.57-.35 1.09-.16.66.2"/></svg>
          </span>
          Telegram channel
        </div>
        <h2 class="contact-title">@${escapeHtml(CONTACT.telegramLabel.replace('@', ''))}</h2>
        <p class="contact-copy">Message the channel with the username you want — we'll reply with availability and next steps.</p>
        <a class="contact-telegram" href="${CONTACT.telegramUrl}" target="_blank" rel="noopener noreferrer">
          <span class="telegram-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M9.78 14.52 9.4 18.1c.55 0 .79-.24 1.08-.52l2.59-2.48 5.37 3.93c.98.54 1.68.26 1.95-.9l3.52-16.5h.01c.31-1.45-.52-2.02-1.47-1.67L2.2 9.44c-1.42.55-1.4 1.34-.24 1.7l5.26 1.64 12.2-7.68c.57-.35 1.09-.16.66.2"/></svg>
          </span>
          Open ${escapeHtml(CONTACT.telegramLabel)}
        </a>
        <div class="contact-divider">
          <span>Or DM us directly</span>
        </div>
        <div class="contact-handles">${handleLinks}</div>
      </div>
    </aside>
  `
}

function render() {
  const items = filteredItems(catalog.items)
  const counts = {
    all: catalog.items.length,
    available: catalog.items.filter((i) => i.status === 'available').length,
    sold: catalog.items.filter((i) => i.status === 'sold').length,
  }

  app.innerHTML = `
    <div class="page">
      <div class="shell">
        <header class="hero">
          <img class="hero-logo" src="/hero-logo.png" alt="Lunar" width="280" height="280" />
          <h1>Pinterest Stock</h1>
          <p class="hero-sub">Live Inventory · last change ${formatUpdated(catalog.updated_at)}</p>
        </header>

        <section class="toolbar">
          <div class="toolbar-row">
            <div class="filters" role="tablist" aria-label="Status">
              ${(['all', 'available', 'sold'] as StatusFilter[])
                .map((filter) => {
                  const label = filter === 'all' ? 'All' : filter === 'available' ? 'Available' : 'Sold'
                  return `
                <button type="button" class="filter-btn ${statusFilter === filter ? 'active' : ''}" data-filter="${filter}">
                  ${label}
                  <span class="count">${counts[filter]}</span>
                </button>`
                })
                .join('')}
            </div>
            <div class="toolbar-controls">
              <div class="price-inline" aria-label="Price filter">
                <span class="price-inline-label">Price</span>
                <input type="text" inputmode="decimal" class="price-inline-input" placeholder="Min" data-min-price value="${escapeHtml(minPrice)}" />
                <span class="price-sep">–</span>
                <input type="text" inputmode="decimal" class="price-inline-input" placeholder="Max" data-max-price value="${escapeHtml(maxPrice)}" />
                <button type="button" class="clear-prices" data-clear-prices ${!minPrice && !maxPrice ? 'hidden' : ''} title="Clear price filter">×</button>
              </div>
              <div class="sort-wrap">
                <label class="sort-label" for="sort-select">Sort</label>
                <select id="sort-select" class="sort-select" data-sort>
                  <option value="price-asc" ${sortBy === 'price-asc' ? 'selected' : ''}>Low → high</option>
                  <option value="price-desc" ${sortBy === 'price-desc' ? 'selected' : ''}>High → low</option>
                  <option value="name" ${sortBy === 'name' ? 'selected' : ''}>Name A–Z</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <div class="content-grid">
          <section class="catalog">
            ${
              items.length === 0
                ? `<div class="empty"><p>No listings match your filters.</p><button type="button" class="empty-reset" data-reset-filters>Reset filters</button></div>`
                : `<div class="grid">${items.map(renderCard).join('')}</div>`
            }
          </section>
          ${renderContact()}
        </div>
      </div>
    </div>
  `

  app.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((btn) => {
    btn.addEventListener('click', () => {
      statusFilter = btn.dataset.filter as StatusFilter
      render()
    })
  })

  app.querySelector<HTMLSelectElement>('[data-sort]')?.addEventListener('change', (e) => {
    sortBy = (e.target as HTMLSelectElement).value as typeof sortBy
    render()
  })

  const minInput = app.querySelector<HTMLInputElement>('[data-min-price]')
  const maxInput = app.querySelector<HTMLInputElement>('[data-max-price]')

  const applyPriceFilter = () => {
    minPrice = minInput?.value ?? ''
    maxPrice = maxInput?.value ?? ''
    render()
  }

  minInput?.addEventListener('change', applyPriceFilter)
  maxInput?.addEventListener('change', applyPriceFilter)
  minInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyPriceFilter()
  })
  maxInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') applyPriceFilter()
  })

  app.querySelector('[data-clear-prices]')?.addEventListener('click', () => {
    minPrice = ''
    maxPrice = ''
    render()
  })

  app.querySelector('[data-reset-filters]')?.addEventListener('click', () => {
    statusFilter = 'all'
    minPrice = ''
    maxPrice = ''
    sortBy = 'price-asc'
    render()
  })
}

render()
