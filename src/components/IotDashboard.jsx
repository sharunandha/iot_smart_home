import { useEffect, useMemo, useState } from "react"
import { motion } from "framer-motion"
import {
  AlertTriangle,
  Bot,
  Lightbulb,
  Menu,
  Sparkles,
  Thermometer,
  Wifi,
  Waves,
} from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { useIotDashboard } from "../hooks/useIotDashboard"

const sidebarItems = ["Dashboard", "Analytics", "Automation", "Logs", "System Health", "Settings"]

const sensorMeta = [
  { key: "temperature", label: "Temperature", unit: "°C", icon: Thermometer },
  { key: "humidity", label: "Humidity", unit: "%", icon: Waves },
  { key: "darkDetection", label: "Dark Detection", unit: "", icon: Lightbulb },
]

const cardStatusColor = {
  normal: "text-sky-600",
  warning: "text-amber-600",
  high: "text-rose-600",
  active: "text-emerald-600",
  idle: "text-slate-500",
}

const SensorCard = ({ label, value, unit, status, Icon, chartData, chartKey }) => (
  <motion.article
    layout
    whileHover={{ y: -6, scale: 1.015 }}
    transition={{ type: "spring", stiffness: 220, damping: 20 }}
    className="glass-panel-light glow-ring rounded-3xl p-3 sm:p-4"
  >
    <div className="mb-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-slate-600 sm:text-sm">
        <Icon size={18} className="text-sky-600" />
        <span>{label}</span>
      </div>
      <span className={`text-xs uppercase tracking-widest ${cardStatusColor[status] ?? "text-sky-600"}`}>{status}</span>
    </div>
    <div className="mb-4 text-2xl font-semibold text-slate-900 sm:text-3xl">
      {chartKey === "darkDetection" ? (value ? "Dark" : "Light") : `${value.toFixed(1)}${unit}`}
    </div>
    <div className="h-16">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`grad-${chartKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2ea8ff" stopOpacity={0.7} />
              <stop offset="95%" stopColor="#1fd6ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey={chartKey} stroke="#2c8ef5" fill={`url(#grad-${chartKey})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </motion.article>
)

const IotDashboard = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [clock, setClock] = useState(new Date())
  const [activeSection, setActiveSection] = useState("Dashboard")
  const {
    feed,
    latest,
    statuses,
    automation,
    insights,
    eventLogs,
    isConnected,
    connectionMode,
    connectionError,
    lastUpdated,
    refreshEnabled,
    setRefreshEnabled,
    refreshRate,
    setRefreshRate,
    thresholds,
    setThresholds,
    notification,
  } = useIotDashboard()

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const chartData = useMemo(
    () =>
      feed.map((entry) => ({
        time: new Date(entry.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        ...entry,
      })),
    [feed],
  )

  const exportData = () => {
    const csv = ["time,temperature,humidity,darkDetection"]
      .concat(
        feed.map(
          (row) =>
            `${row.timestamp},${row.temperature.toFixed(2)},${row.humidity.toFixed(2)},${row.darkDetection}`,
        ),
      )
      .join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = "iot-sensor-history.csv"
    anchor.click()
    URL.revokeObjectURL(url)
  }

  const handleSidebarClick = (item) => {
    setActiveSection(item)
    const targetId = `section-${item.toLowerCase().replace(/\s+/g, "-")}`
    const section = document.getElementById(targetId)
    section?.scrollIntoView({ behavior: "smooth", block: "start" })
    setMenuOpen(false)
  }

  return (
    <div className="aurora-bg min-h-screen text-slate-800">
      <motion.div className="pointer-events-none fixed inset-0 -z-10" animate={{ opacity: [0.7, 1, 0.75] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}>
        <div className="light-orb orb-1" />
        <div className="light-orb orb-2" />
        <div className="light-orb orb-3" />
      </motion.div>
      {menuOpen && <button type="button" aria-label="Close menu overlay" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[2px] md:hidden" />}
      <div className="mx-auto flex w-full max-w-[1600px] gap-3 p-2 sm:p-3 md:gap-4 md:p-5">
        <aside className={`${menuOpen ? "translate-x-0" : "-translate-x-[110%]"} glass-panel-light fixed inset-y-2 left-2 z-40 w-[min(84vw,18rem)] rounded-3xl p-4 transition-transform duration-300 md:static md:w-64 md:translate-x-0`}>
          <h2 className="mb-6 text-lg font-semibold text-sky-700">IoT Control</h2>
          <nav className="space-y-2">
            {sidebarItems.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => handleSidebarClick(item)}
                className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition hover:-translate-y-0.5 ${
                  activeSection === item
                    ? "border-fuchsia-300/90 bg-fuchsia-100/80 text-fuchsia-700"
                    : "border-sky-200/80 bg-white/70 text-slate-700 hover:bg-sky-100/90"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <motion.main className="min-w-0 flex-1 space-y-3 sm:space-y-4">
          <header className="glass-panel-light rounded-3xl p-3 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <button type="button" onClick={() => setMenuOpen((prev) => !prev)} className="rounded-lg border border-sky-200/80 bg-white/75 p-2 md:hidden">
                  <Menu size={18} />
                </button>
                <div className="min-w-0">
                  <h1 className="bg-gradient-to-r from-fuchsia-600 via-sky-500 to-emerald-500 bg-clip-text text-lg font-semibold leading-tight text-transparent sm:text-xl md:text-3xl">
                    Smart Home IoT Monitoring Dashboard
                  </h1>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-2 text-xs sm:flex sm:flex-wrap sm:items-center sm:gap-3 sm:text-sm">
                <div className="rounded-lg border border-sky-200/80 bg-white/75 px-3 py-2">{clock.toLocaleTimeString()}</div>
                <div className="flex items-center gap-2 rounded-lg border border-sky-200/80 bg-white/75 px-3 py-2">
                  <span className={`status-dot ${isConnected ? "animate-pulse" : "bg-rose-400 shadow-rose-400/80"}`} />
                  <span>{isConnected ? "Cloud Online" : "Cloud Offline"}</span>
                </div>
                <div className="hidden items-center gap-2 rounded-lg border border-sky-200/80 bg-white/75 px-3 py-2 lg:flex">
                  <Wifi size={14} className="text-sky-600" />
                  <span>ThingSpeak {connectionMode.toUpperCase()}</span>
                </div>
                <div className="hidden rounded-lg border border-sky-200/80 bg-white/75 p-2 sm:block">
                  <Sparkles size={16} className="text-sky-600" />
                </div>
              </div>
            </div>
          </header>

          {notification && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel-light flex items-center gap-2 rounded-xl border border-amber-200/80 p-3 text-sm text-slate-700">
              <AlertTriangle size={16} className="text-amber-500" />
              <span>{notification}</span>
            </motion.div>
          )}

          {connectionError && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel-light flex items-center gap-2 rounded-xl border border-rose-300/70 p-3 text-sm text-rose-700">
              <AlertTriangle size={16} className="text-rose-500" />
              <span>{connectionError}</span>
            </motion.div>
          )}

          <section id="section-dashboard" className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
            {sensorMeta.map(({ key, label, unit, icon }) => (
              <SensorCard key={key} label={label} value={latest[key]} unit={unit} status={statuses[key]} Icon={icon} chartData={chartData} chartKey={key} />
            ))}
          </section>

          <section id="section-analytics" className="grid gap-3 sm:gap-4 lg:grid-cols-3">
            <article className="glass-panel-light glow-ring rounded-3xl p-3 sm:p-4 lg:col-span-2">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fuchsia-700">Live Charts</h3>
              <div className="h-56 sm:h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#b8d9ff" />
                    <XAxis dataKey="time" stroke="#4b7cab" />
                    <YAxis stroke="#4b7cab" />
                    <Tooltip />
                    <Legend />
                    <Line dataKey="temperature" name="Temperature" stroke="#1f8dff" strokeWidth={2.5} dot={false} />
                    <Line dataKey="humidity" name="Humidity" stroke="#11b8b1" strokeWidth={2} dot={false} />
                    <Line dataKey="darkDetection" name="Dark Detection" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article id="section-automation" className="glass-panel-light rounded-3xl p-3 sm:p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-purple-700">Automation Status</h3>
              <div className="space-y-3">
                {automation.map((item) => (
                  <motion.div
                    key={item.id}
                    whileHover={{ scale: 1.01, x: 4 }}
                    className="rounded-2xl border border-sky-200/80 bg-white/75 p-3 shadow-sm"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="font-medium text-slate-800">{item.label}</span>
                      <span className={`text-xs ${item.isOn ? "text-emerald-600" : "text-slate-500"}`}>{item.isOn ? "ON" : "OFF"}</span>
                    </div>
                    <p className="text-xs text-slate-600">{item.reason}</p>
                  </motion.div>
                ))}
              </div>
            </article>
          </section>

          <section id="section-system-health" className="grid gap-3 sm:gap-4 lg:grid-cols-3">
            <article className="glass-panel-light rounded-3xl p-3 sm:p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-indigo-700"><Bot size={16} /> AI Insights</h3>
              <div className="space-y-2 text-sm text-slate-700">
                {insights.map((insight) => (
                  <p key={insight} className="rounded-xl border border-sky-200/80 bg-white/75 p-2">
                    {insight}
                  </p>
                ))}
              </div>
            </article>

            <article className="glass-panel-light rounded-3xl p-3 sm:p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-cyan-700">System Health</h3>
              <div className="space-y-2 text-sm text-slate-700">
                <p className="flex justify-between"><span>ESP8266 Status</span><span className="text-emerald-600">Online</span></p>
                <p className="flex justify-between"><span>Last Update</span><span>{lastUpdated.toLocaleTimeString()}</span></p>
                <p className="flex justify-between"><span>Cloud Sync</span><span>{connectionMode.toUpperCase()}</span></p>
                <p className="flex justify-between"><span>Sensor Activity</span><span>{feed.length} samples</span></p>
                <p className="flex justify-between"><span>Network</span><span>{isConnected ? "Stable" : "Disconnected"}</span></p>
              </div>
            </article>

            <article id="section-settings" className="glass-panel-light rounded-3xl p-3 sm:p-4">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-rose-700"><Sparkles size={14} /> Settings</h3>
              <div className="space-y-3 text-sm">
                <label className="block">Temperature threshold
                  <input type="number" value={thresholds.temperature} onChange={(e) => setThresholds((p) => ({ ...p, temperature: Number(e.target.value) }))} className="mt-1 w-full rounded-md border border-sky-200/80 bg-white/75 px-2 py-1" />
                </label>
                <label className="block">Auto refresh rate (s)
                  <input type="number" min="2" max="30" value={refreshRate} onChange={(e) => setRefreshRate(Number(e.target.value))} className="mt-1 w-full rounded-md border border-sky-200/80 bg-white/75 px-2 py-1" />
                </label>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => setRefreshEnabled((p) => !p)} className="rounded-lg border border-sky-200/80 bg-white/75 px-2 py-2">
                    {refreshEnabled ? "Pause Refresh" : "Resume Refresh"}
                  </button>
                  <button type="button" onClick={exportData} className="rounded-lg border border-sky-300/80 bg-sky-200/60 px-2 py-2">
                    Export CSV
                  </button>
                </div>
              </div>
            </article>
          </section>

          <section id="section-logs" className="grid gap-3 sm:gap-4 lg:grid-cols-2">
            <article className="glass-panel-light rounded-3xl p-3 sm:p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-orange-700">Alert & Event Logs</h3>
              <div className="max-h-64 space-y-2 overflow-auto pr-1 sm:max-h-56">
                {eventLogs.map((log) => (
                  <motion.div key={log.id} initial={{ opacity: 0.5, x: 8 }} animate={{ opacity: 1, x: 0 }} className="rounded-lg border border-sky-200/80 bg-white/75 px-3 py-2 text-sm text-slate-700">
                    <span className="mr-2 text-xs text-sky-600">{log.time}</span>
                    {log.message}
                  </motion.div>
                ))}
              </div>
            </article>

            <article className="glass-panel-light rounded-3xl p-3 sm:p-4">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-emerald-700">Data Flow Visualization</h3>
              <div className="grid place-items-center gap-2 text-center text-sm text-slate-700">
                {["Sensors", "ESP8266", "ThingSpeak Cloud", "Dashboard Analytics", "Automation Output"].map((step) => (
                  <motion.div
                    key={step}
                    whileHover={{ x: 4, scale: 1.01 }}
                    className="w-full rounded-lg border border-sky-200/80 bg-white/75 px-2 py-2"
                  >
                    {step}
                  </motion.div>
                ))}
              </div>
            </article>
          </section>
        </motion.main>
      </div>
    </div>
  )
}

export default IotDashboard
