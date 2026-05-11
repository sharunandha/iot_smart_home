import { useEffect, useMemo, useState } from "react"
import { fetchThingSpeakFeed } from "../services/thingspeakService"
import { buildAutomation, buildInsights, formatTime, getSensorStatuses } from "../utils/dashboardUtils"

const DEFAULT_THRESHOLDS = {
  temperature: 30,
}

export const useIotDashboard = () => {
  const [feed, setFeed] = useState([])
  const [connectionMode, setConnectionMode] = useState("live")
  const [isConnected, setIsConnected] = useState(true)
  const [connectionError, setConnectionError] = useState("")
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [refreshEnabled, setRefreshEnabled] = useState(true)
  const [refreshRate, setRefreshRate] = useState(5)
  const [thresholds, setThresholds] = useState(DEFAULT_THRESHOLDS)
  const [theme, setTheme] = useState("dark")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await fetchThingSpeakFeed()
        setFeed(result.feed)
        setConnectionMode(result.mode)
        setIsConnected(true)
        setConnectionError("")
        setLastUpdated(new Date())
      } catch (error) {
        setIsConnected(false)
        setConnectionError(error instanceof Error ? error.message : "Unable to fetch ThingSpeak data.")
      }
    }

    fetchData()

    if (!refreshEnabled) return undefined

    const timer = setInterval(fetchData, refreshRate * 1000)
    return () => clearInterval(timer)
  }, [refreshEnabled, refreshRate])

  const latest = useMemo(
    () => feed[feed.length - 1] ?? { temperature: 0, humidity: 0, darkDetection: 0, timestamp: new Date().toISOString() },
    [feed],
  )

  const statuses = useMemo(() => getSensorStatuses(latest), [latest])
  const automation = useMemo(() => buildAutomation(latest), [latest])
  const insights = useMemo(() => buildInsights(latest), [latest])

  const eventLogs = useMemo(
    () =>
      feed
        .slice(-12)
        .reverse()
        .map((item) => ({
          id: item.id,
          time: formatTime(item.timestamp),
          message: item.temperature > thresholds.temperature
              ? "Temperature warning, smart fan activated."
              : item.darkDetection
                ? "Darkness detected by LDR sensor."
                : "Periodic sensor update received.",
        })),
    [feed, thresholds],
  )

  const notification = useMemo(() => {
    if (latest.darkDetection) return "Dark environment detected from LDR sensor."
    if (latest.temperature >= thresholds.temperature) return "Temperature crossed threshold. Fan automation engaged."
    return ""
  }, [latest, thresholds.temperature])

  return {
    feed,
    latest,
    statuses,
    automation,
    insights,
    eventLogs,
    connectionMode,
    isConnected,
    connectionError,
    lastUpdated,
    refreshEnabled,
    setRefreshEnabled,
    refreshRate,
    setRefreshRate,
    thresholds,
    setThresholds,
    notification,
    theme,
    setTheme,
  }
}
