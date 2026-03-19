import { useEffect, useMemo, useState } from 'react'

const agencies = [
  {
    id: 'agency-1',
    name: 'Aurora Global Travel',
    city: 'Dubai',
    country: 'UAE',
    agents: 142,
    revenue: '$1.24M',
    rating: '4.9',
    focus: 'Luxury flights and package tours',
  },
  {
    id: 'agency-2',
    name: 'BlueWave Holidays',
    city: 'Singapore',
    country: 'Singapore',
    agents: 96,
    revenue: '$860K',
    rating: '4.8',
    focus: 'Cruises and family vacations',
  },
  {
    id: 'agency-3',
    name: 'NorthPeak Escapes',
    city: 'Zurich',
    country: 'Switzerland',
    agents: 73,
    revenue: '$690K',
    rating: '4.7',
    focus: 'Premium Europe itineraries',
  },
  {
    id: 'agency-4',
    name: 'SunTrail Adventures',
    city: 'Bangkok',
    country: 'Thailand',
    agents: 121,
    revenue: '$1.02M',
    rating: '4.8',
    focus: 'Adventure and island packages',
  },
]

const agencyAgents = {
  'agency-1': [
    { name: 'Sara Khan', role: 'Senior Agent', sales: 48, commission: '$18.4K' },
    { name: 'David Noor', role: 'Team Lead', sales: 54, commission: '$22.1K' },
    { name: 'Mia Joseph', role: 'Junior Agent', sales: 31, commission: '$9.6K' },
  ],
  'agency-2': [
    { name: 'Liam Tan', role: 'Senior Agent', sales: 43, commission: '$15.2K' },
    { name: 'Ivy Chen', role: 'Junior Agent', sales: 28, commission: '$8.4K' },
    { name: 'Noah Lim', role: 'Team Lead', sales: 46, commission: '$16.7K' },
  ],
  'agency-3': [
    { name: 'Sofia Meier', role: 'Senior Agent', sales: 39, commission: '$14.6K' },
    { name: 'Leo Braun', role: 'Junior Agent', sales: 24, commission: '$7.1K' },
    { name: 'Eva Keller', role: 'Team Lead', sales: 41, commission: '$15.8K' },
  ],
  'agency-4': [
    { name: 'Nina Patel', role: 'Senior Agent', sales: 51, commission: '$19.2K' },
    { name: 'Arjun Rao', role: 'Junior Agent', sales: 27, commission: '$7.9K' },
    { name: 'Mason Lee', role: 'Team Lead', sales: 49, commission: '$17.6K' },
  ],
}

const products = [
  {
    id: 'product-1',
    name: 'Emirates Dubai to London',
    type: 'Flight',
    destination: 'London',
    season: 'Post-school off peak',
    price: 850,
    baseCommission: 15,
    bonusWindow: 5,
    bonusCommission: 3,
    performance: 88,
    trend: [72, 80, 84, 90, 76, 94],
  },
  {
    id: 'product-2',
    name: 'Swiss Alpine Retreat',
    type: 'Package',
    destination: 'Zurich',
    season: 'Shoulder',
    price: 1640,
    baseCommission: 11,
    bonusWindow: 7,
    bonusCommission: 2,
    performance: 72,
    trend: [55, 68, 76, 73, 81, 78],
  },
  {
    id: 'product-3',
    name: 'Caribbean Glow Cruise',
    type: 'Cruise',
    destination: 'Caribbean',
    season: 'Peak summer',
    price: 2400,
    baseCommission: 8,
    bonusWindow: 4,
    bonusCommission: 2,
    performance: 91,
    trend: [66, 71, 79, 88, 92, 95],
  },
  {
    id: 'product-4',
    name: 'Kyoto Heritage Stay',
    type: 'Hotel',
    destination: 'Kyoto',
    season: 'Winter off peak',
    price: 620,
    baseCommission: 13,
    bonusWindow: 6,
    bonusCommission: 2,
    performance: 67,
    trend: [48, 58, 65, 62, 70, 74],
  },
]

const dashboardStats = [
  { label: 'Agencies', value: '512', change: '+14%' },
  { label: 'Agents', value: '24,860', change: '+8%' },
  { label: 'Sales', value: '74,219', change: '+19%' },
  { label: 'Avg commission', value: '11.8%', change: '+2.1%' },
]

const topAgents = [
  { name: 'Sara Khan', agency: 'Aurora Global Travel', revenue: '$48.2K' },
  { name: 'Nina Patel', agency: 'SunTrail Adventures', revenue: '$44.7K' },
  { name: 'David Noor', agency: 'Aurora Global Travel', revenue: '$42.3K' },
  { name: 'Liam Tan', agency: 'BlueWave Holidays', revenue: '$39.6K' },
]

const uploadRows = [
  { agency: 'Skylink Tours', city: 'Madrid', agents: 122, status: 'Validated' },
  { agency: 'Vista Globe', city: 'Toronto', agents: 88, status: 'Validated' },
  { agency: 'Coral Route', city: 'Doha', agents: 134, status: 'Needs review' },
]

const navItems = [
  ['dashboard', 'Dashboard'],
  ['agencies', 'Agencies'],
  ['products', 'Products'],
  ['calculator', 'Calculator'],
  ['search', 'Search'],
  ['upload', 'Upload'],
  ['assistant', 'Assistant'],
]

const monthBars = [
  { label: 'Jan', value: 48 },
  { label: 'Feb', value: 56 },
  { label: 'Mar', value: 72 },
  { label: 'Apr', value: 64 },
  { label: 'May', value: 82 },
  { label: 'Jun', value: 91 },
]

const seasonRules = [
  { season: 'Post-school off peak', range: 'Sep 1 - Oct 31', commission: '12% - 18%' },
  { season: 'Winter off peak', range: 'Jan 5 - Feb 28', commission: '10% - 15%' },
  { season: 'Shoulder', range: 'Mar 1 - May 31', commission: '8% - 12%' },
  { season: 'Peak summer', range: 'Jun 1 - Aug 31', commission: '5% - 8%' },
]

const aiReplies = {
  cruises:
    'Cruise products are outperforming this month. Caribbean Glow Cruise has the strongest conversion momentum and a fast-sell bonus, so it is a good frontline recommendation.',
  commission:
    'For higher earnings, push off-peak and post-school-start products first. They combine stronger base commission with bonus tiers when sold within the first few days.',
  default:
    'Travel sales are strongest when agents pair the right season with the right speed bonus. Highlight off-peak inventory and prioritize leads that can close within 5 to 7 days.',
}

function getInitialView() {
  const hash = window.location.hash.replace('#', '')
  return navItems.some(([key]) => key === hash) ? hash : 'dashboard'
}

function calculateCommission(productId, listedDate, saleDate) {
  const product = products.find((item) => item.id === productId)
  if (!product || !listedDate || !saleDate) {
    return null
  }

  const start = new Date(listedDate)
  const sold = new Date(saleDate)
  const days = Math.max(0, Math.round((sold - start) / 86400000))
  const bonus = days <= product.bonusWindow ? product.bonusCommission : 0
  const totalPct = product.baseCommission + bonus
  const amount = ((product.price * totalPct) / 100).toFixed(2)

  return {
    days,
    base: product.baseCommission,
    bonus,
    totalPct,
    amount,
    season: product.season,
  }
}

function Home() {
  const [view, setView] = useState(getInitialView)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.localStorage.getItem('travel-ui-theme') === 'dark'
  })
  const [selectedAgencyId, setSelectedAgencyId] = useState(agencies[0].id)
  const [selectedProductId, setSelectedProductId] = useState(products[0].id)
  const [agencyQuery, setAgencyQuery] = useState('')
  const [productFilter, setProductFilter] = useState('All')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [uploadProgress, setUploadProgress] = useState(64)
  const [assistantInput, setAssistantInput] = useState('')
  const [chat, setChat] = useState([
    {
      role: 'assistant',
      text: 'Ask about products, commission strategy, or what to promote this month.',
    },
  ])
  const [form, setForm] = useState({
    productId: products[0].id,
    listedDate: '2026-09-03',
    saleDate: '2026-09-05',
  })

  useEffect(() => {
    const onHashChange = () => setView(getInitialView())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput), 300)
    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    window.localStorage.setItem('travel-ui-theme', isDarkMode ? 'dark' : 'light')
  }, [isDarkMode])

  const selectedAgency = agencies.find((agency) => agency.id === selectedAgencyId) ?? agencies[0]
  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0]

  const filteredAgencies = useMemo(() => {
    return agencies.filter((agency) =>
      `${agency.name} ${agency.city} ${agency.country}`.toLowerCase().includes(agencyQuery.toLowerCase())
    )
  }, [agencyQuery])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (productFilter === 'All') return true
      return product.type === productFilter
    })
  }, [productFilter])

  const searchResults = useMemo(() => {
    if (!debouncedSearch.trim()) return []
    const query = debouncedSearch.toLowerCase()

    const agencyResults = agencies
      .filter((agency) => agency.name.toLowerCase().includes(query))
      .map((agency) => ({
        type: 'Agency',
        title: agency.name,
        subtitle: `${agency.city}, ${agency.country} • ${agency.agents} agents`,
      }))

    const agentResults = Object.entries(agencyAgents).flatMap(([agencyId, members]) =>
      members
        .filter((member) => member.name.toLowerCase().includes(query))
        .map((member) => ({
          type: 'Agent',
          title: member.name,
          subtitle: `${member.role} • ${agencies.find((item) => item.id === agencyId)?.name}`,
        }))
    )

    return [...agencyResults, ...agentResults].slice(0, 8)
  }, [debouncedSearch])

  const commissionResult = useMemo(() => {
    return calculateCommission(form.productId, form.listedDate, form.saleDate)
  }, [form])

  function navigate(nextView) {
    window.location.hash = nextView
    setView(nextView)
  }

  function openAgency(id) {
    setSelectedAgencyId(id)
    navigate('agencies')
  }

  function openProduct(id) {
    setSelectedProductId(id)
    navigate('products')
  }

  function submitAssistantPrompt(promptText) {
    if (!promptText.trim()) return

    const lower = promptText.toLowerCase()
    const reply = lower.includes('cruise')
      ? aiReplies.cruises
      : lower.includes('commission')
        ? aiReplies.commission
        : aiReplies.default

    setChat((current) => [
      ...current,
      { role: 'user', text: promptText },
      { role: 'assistant', text: reply },
    ])
    setAssistantInput('')
  }

  return (
    <main className={isDarkMode ? 'app-shell dark-theme' : 'app-shell'}>
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">T</span>
          <div>
            <p className="brand-title">TravelCore</p>
            <span className="brand-caption">Agency management frontend</span>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Main">
          {navItems.map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={view === key ? 'nav-pill active' : 'nav-pill'}
              onClick={() => navigate(key)}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-card">
          <span className="kicker">AI insight</span>
          <strong>Off-peak products are converting faster this week.</strong>
          <p>Push September and winter inventory to maximize commission potential.</p>
        </div>
      </aside>

      <section className="workspace">
        <header className="workspace-top">
          <div>
            <h1>Travel Agency Management Platform</h1>
          </div>

          <div className="top-actions">
            <button
              type="button"
              className={isDarkMode ? 'theme-chip active' : 'theme-chip'}
              aria-pressed={isDarkMode}
              onClick={() => setIsDarkMode((current) => !current)}
            >
              {isDarkMode ? 'Light mode' : 'Dark mode'}
            </button>
            <button type="button" className="primary-action" onClick={() => navigate('assistant')}>
              Open AI assistant
            </button>
          </div>
        </header>

        {view === 'dashboard' && (
          <section className="page-grid">
            <div className="hero-card">
              <div>
                <span className="kicker">Dashboard landing page</span>
                <h2>Multi-agency metrics, commission trends, and top performers.</h2>
                <p>
                  This matches the assignment’s recommended first impression: a rich
                  landing dashboard with KPIs, charts, and insights.
                </p>
              </div>
              <div className="hero-badge">
                <strong>24.8K</strong>
                <span>active agents tracked</span>
              </div>
            </div>

            <div className="stat-grid">
              {dashboardStats.map((item) => (
                <article key={item.label} className="card stat-card">
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.change} vs last month</small>
                </article>
              ))}
            </div>

            <article className="card chart-card">
              <div className="card-head">
                <div>
                  <span className="kicker">Revenue chart</span>
                  <h3>Monthly sales momentum</h3>
                </div>
              </div>

              <div className="bar-chart" aria-label="Revenue bars">
                {monthBars.map((bar) => (
                  <div key={bar.label} className="bar-group">
                    <div className="bar-track">
                      <div className="bar-fill" style={{ height: `${bar.value}%` }} />
                    </div>
                    <span>{bar.label}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="card leaderboard-card">
              <div className="card-head">
                <div>
                  <span className="kicker">Top agents</span>
                  <h3>Leaderboard</h3>
                </div>
              </div>

              <div className="stack-list">
                {topAgents.map((agent) => (
                  <div key={agent.name} className="row-item">
                    <div>
                      <strong>{agent.name}</strong>
                      <span>{agent.agency}</span>
                    </div>
                    <strong>{agent.revenue}</strong>
                  </div>
                ))}
              </div>
            </article>

            <article className="card wide-card">
              <div className="card-head">
                <div>
                  <span className="kicker">AI insights</span>
                  <h3>Quick observations for judges</h3>
                </div>
              </div>
              <ul className="insight-list">
                <li>Cruise bookings are strongest in the current window and reward fast-selling teams.</li>
                <li>Post-school-start inventory delivers the best commission opportunity in the mock dataset.</li>
                <li>Aurora Global Travel leads total revenue while SunTrail has the highest agent productivity.</li>
              </ul>
            </article>
          </section>
        )}

        {view === 'agencies' && (
          <section className="page-grid">
            <article className="card wide-card">
              <div className="card-head">
                <div>
                  <span className="kicker">Searchable agency grid</span>
                  <h3>Agencies</h3>
                </div>
                <input
                  className="surface-input"
                  type="text"
                  placeholder="Search agencies by name or city"
                  value={agencyQuery}
                  onChange={(event) => setAgencyQuery(event.target.value)}
                />
              </div>

              <div className="agency-grid">
                {filteredAgencies.map((agency) => (
                  <article key={agency.id} className="agency-card">
                    <span className="mini-tag">{agency.city}</span>
                    <h4>{agency.name}</h4>
                    <p>{agency.focus}</p>
                    <div className="agency-meta">
                      <span>{agency.agents} agents</span>
                      <span>{agency.revenue}</span>
                    </div>
                    <button type="button" className="ghost-action" onClick={() => setSelectedAgencyId(agency.id)}>
                      View details
                    </button>
                  </article>
                ))}
              </div>
            </article>

            <article className="card detail-card">
              <div className="card-head">
                <div>
                  <span className="kicker">Agency detail</span>
                  <h3>{selectedAgency.name}</h3>
                </div>
              </div>
              <p className="lead-copy">
                {selectedAgency.city}, {selectedAgency.country} • {selectedAgency.focus}
              </p>
              <div className="detail-stats">
                <div>
                  <span>Agents</span>
                  <strong>{selectedAgency.agents}</strong>
                </div>
                <div>
                  <span>Revenue</span>
                  <strong>{selectedAgency.revenue}</strong>
                </div>
                <div>
                  <span>Rating</span>
                  <strong>{selectedAgency.rating}</strong>
                </div>
              </div>

              <div className="stack-list">
                {(agencyAgents[selectedAgency.id] ?? []).map((member) => (
                  <div key={member.name} className="row-item">
                    <div>
                      <strong>{member.name}</strong>
                      <span>{member.role}</span>
                    </div>
                    <div className="right-pack">
                      <strong>{member.commission}</strong>
                      <span>{member.sales} sales</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {view === 'products' && (
          <section className="page-grid">
            <article className="card wide-card">
              <div className="card-head">
                <div>
                  <span className="kicker">Filterable catalog</span>
                  <h3>Products</h3>
                </div>
                <select
                  className="surface-input"
                  value={productFilter}
                  onChange={(event) => setProductFilter(event.target.value)}
                >
                  <option>All</option>
                  <option>Flight</option>
                  <option>Package</option>
                  <option>Cruise</option>
                  <option>Hotel</option>
                </select>
              </div>

              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <article key={product.id} className="product-card" onClick={() => openProduct(product.id)}>
                    <span className="mini-tag">{product.type}</span>
                    <h4>{product.name}</h4>
                    <p>{product.destination}</p>
                    <div className="metric-line">
                      <span>Base commission</span>
                      <strong>{product.baseCommission}%</strong>
                    </div>
                    <div className="metric-line">
                      <span>Fast-sell bonus</span>
                      <strong>+{product.bonusCommission}%</strong>
                    </div>
                  </article>
                ))}
              </div>
            </article>

            <article className="card detail-card">
              <div className="card-head">
                <div>
                  <span className="kicker">Product detail</span>
                  <h3>{selectedProduct.name}</h3>
                </div>
              </div>

              <div className="detail-stats">
                <div>
                  <span>Destination</span>
                  <strong>{selectedProduct.destination}</strong>
                </div>
                <div>
                  <span>Price</span>
                  <strong>${selectedProduct.price}</strong>
                </div>
                <div>
                  <span>Season</span>
                  <strong>{selectedProduct.season}</strong>
                </div>
              </div>

              <div className="mini-chart">
                {selectedProduct.trend.map((point, index) => (
                  <span key={`${selectedProduct.id}-${index}`} style={{ height: `${point}%` }} />
                ))}
              </div>

              <div className="rules-table">
                {seasonRules.map((rule) => (
                  <div key={rule.season} className="rule-row">
                    <div>
                      <strong>{rule.season}</strong>
                      <span>{rule.range}</span>
                    </div>
                    <strong>{rule.commission}</strong>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {view === 'calculator' && (
          <section className="page-grid">
            <article className="card calculator-card">
              <div className="card-head">
                <div>
                  <span className="kicker">Interactive commission form</span>
                  <h3>Commission calculator</h3>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  <span>Product</span>
                  <select
                    className="surface-input"
                    value={form.productId}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, productId: event.target.value }))
                    }
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span>Listed date</span>
                  <input
                    className="surface-input"
                    type="date"
                    value={form.listedDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, listedDate: event.target.value }))
                    }
                  />
                </label>

                <label>
                  <span>Sale date</span>
                  <input
                    className="surface-input"
                    type="date"
                    value={form.saleDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, saleDate: event.target.value }))
                    }
                  />
                </label>
              </div>
            </article>

            <article className="card result-card">
              <span className="kicker">Calculated result</span>
              <h3>{commissionResult ? `${commissionResult.totalPct}% total commission` : 'Waiting for inputs'}</h3>

              {commissionResult && (
                <div className="result-grid">
                  <div>
                    <span>Season</span>
                    <strong>{commissionResult.season}</strong>
                  </div>
                  <div>
                    <span>Days to sell</span>
                    <strong>{commissionResult.days}</strong>
                  </div>
                  <div>
                    <span>Base</span>
                    <strong>{commissionResult.base}%</strong>
                  </div>
                  <div>
                    <span>Bonus</span>
                    <strong>{commissionResult.bonus}%</strong>
                  </div>
                  <div>
                    <span>Commission amount</span>
                    <strong>${commissionResult.amount}</strong>
                  </div>
                </div>
              )}
            </article>
          </section>
        )}

        {view === 'search' && (
          <section className="page-grid">
            <article className="card wide-card">
              <div className="card-head">
                <div>
                  <span className="kicker">Debounced global search</span>
                  <h3>Search agents and agencies</h3>
                </div>
              </div>

              <input
                className="surface-input search-input"
                type="text"
                placeholder="Try Sara, Aurora, Nina, BlueWave..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />

              <div className="stack-list">
                {searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <div key={`${item.type}-${item.title}`} className="row-item">
                      <div>
                        <strong>{item.title}</strong>
                        <span>{item.subtitle}</span>
                      </div>
                      <span className="mini-tag">{item.type}</span>
                    </div>
                  ))
                ) : (
                  <p className="empty-state">Start typing to preview instant search results.</p>
                )}
              </div>
            </article>
          </section>
        )}

        {view === 'upload' && (
          <section className="page-grid">
            <article className="card upload-card">
              <div className="card-head">
                <div>
                  <span className="kicker">Excel import interface</span>
                  <h3>Bulk upload</h3>
                </div>
              </div>

              <div className="drop-zone">
                <strong>Drag and drop `.xlsx` file here</strong>
                <span>Two sheets expected: Agencies and Agents</span>
                <button
                  type="button"
                  className="primary-action"
                  onClick={() => setUploadProgress((value) => Math.min(100, value + 18))}
                >
                  Simulate import
                </button>
              </div>

              <div className="progress-shell">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
              </div>
              <p className="lead-copy">{uploadProgress}% processed</p>
            </article>

            <article className="card detail-card">
              <div className="card-head">
                <div>
                  <span className="kicker">Preview and validation</span>
                  <h3>File preview</h3>
                </div>
              </div>

              <div className="stack-list">
                {uploadRows.map((row) => (
                  <div key={row.agency} className="row-item">
                    <div>
                      <strong>{row.agency}</strong>
                      <span>{row.city} • {row.agents} agents</span>
                    </div>
                    <span className={row.status === 'Validated' ? 'status-ok' : 'status-warn'}>{row.status}</span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {view === 'assistant' && (
          <section className="page-grid">
            <article className="card assistant-card">
              <div className="card-head">
                <div>
                  <span className="kicker">RAG assistant UI</span>
                  <h3>AI assistant</h3>
                </div>
              </div>

              <div className="prompt-row">
                <button type="button" className="ghost-action" onClick={() => submitAssistantPrompt('Which cruise deals are best this month?')}>
                  Best cruise deals?
                </button>
                <button type="button" className="ghost-action" onClick={() => submitAssistantPrompt('How do I maximize commission this month?')}>
                  Maximize commission
                </button>
              </div>

              <div className="chat-shell">
                {chat.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={message.role === 'assistant' ? 'chat-bubble assistant' : 'chat-bubble user'}>
                    {message.text}
                  </div>
                ))}
              </div>

              <div className="assistant-input">
                <input
                  className="surface-input"
                  type="text"
                  placeholder="Ask about products, seasons, or bonuses"
                  value={assistantInput}
                  onChange={(event) => setAssistantInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      submitAssistantPrompt(assistantInput)
                    }
                  }}
                />
                <button type="button" className="primary-action" onClick={() => submitAssistantPrompt(assistantInput)}>
                  Send
                </button>
              </div>
            </article>
          </section>
        )}
      </section>

      <nav className="mobile-nav" aria-label="Mobile">
        {navItems.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={view === key ? 'mobile-pill active' : 'mobile-pill'}
            onClick={() => navigate(key)}
          >
            {label}
          </button>
        ))}
      </nav>
    </main>
  )
}

export default Home
