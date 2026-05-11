const toStatus = (value, warning, danger) => {
  if (value >= danger) return "high"
  if (value >= warning) return "warning"
  return "normal"
}

export const getSensorStatuses = (latest) => ({
  temperature: toStatus(latest.temperature, 30, 35),
  humidity: latest.humidity > 75 ? "high" : latest.humidity > 65 ? "warning" : "normal",
  light: latest.light < 220 ? "warning" : "normal",
  motion: latest.motion ? "active" : "idle",
})

export const buildInsights = (latest) => {
  const insights = []

  if (latest.temperature < 28) insights.push("Room temperature is comfortable.")
  if (latest.temperature >= 30) insights.push("Temperature rising. Smart fan support recommended.")
  if (latest.light < 220) insights.push("Low light detected. Smart lighting activated.")
  if (latest.motion === 0) insights.push("No motion detected in the monitored area.")
  if (latest.fan === 0 && latest.led === 0) insights.push("Energy-saving mode is currently active.")

  return insights.length ? insights : ["Environment remains stable and automated controls are balanced."]
}

export const buildAutomation = (latest) => [
  {
    id: "light",
    label: "Smart Light",
    isOn: latest.led === 1,
    reason: latest.light < 220 ? "Dark environment detected" : "Ambient light is sufficient",
  },
  {
    id: "fan",
    label: "Smart Fan",
    isOn: latest.fan === 1,
    reason: latest.temperature > 30 ? "Temperature exceeded threshold" : "Temperature within setpoint",
  },
  {
    id: "motion",
    label: "Motion Detection",
    isOn: latest.motion === 1,
    reason: latest.motion ? "Movement activity detected" : "No motion currently detected",
  },
]

export const formatTime = (isoDate) =>
  new Date(isoDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
