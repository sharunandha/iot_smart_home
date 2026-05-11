const toStatus = (value, warning, danger) => {
  if (value >= danger) return "high"
  if (value >= warning) return "warning"
  return "normal"
}

export const getSensorStatuses = (latest) => ({
  temperature: toStatus(latest.temperature, 30, 35),
  humidity: latest.humidity > 75 ? "high" : latest.humidity > 65 ? "warning" : "normal",
  darkDetection: latest.darkDetection ? "warning" : "normal",
})

export const buildInsights = (latest) => {
  const insights = []

  if (latest.temperature < 28) insights.push("Room temperature is comfortable.")
  if (latest.temperature >= 30) insights.push("Temperature rising. Smart fan support recommended.")
  if (latest.darkDetection === 1) insights.push("Dark environment detected from LDR sensor.")
  if (latest.darkDetection === 0) insights.push("Bright environment detected from LDR sensor.")

  return insights.length ? insights : ["Environment remains stable and automated controls are balanced."]
}

export const buildAutomation = (latest) => [
  {
    id: "dark",
    label: "Dark Detection",
    isOn: latest.darkDetection === 1,
    reason: latest.darkDetection === 1 ? "LDR reports dark condition" : "LDR reports bright condition",
  },
  {
    id: "fan",
    label: "Temperature Advisory",
    isOn: latest.temperature > 30,
    reason: latest.temperature > 30 ? "Temperature exceeded threshold" : "Temperature within setpoint",
  },
  {
    id: "humidity",
    label: "Humidity Advisory",
    isOn: latest.humidity > 75,
    reason: latest.humidity > 75 ? "Humidity is high" : "Humidity is in normal range",
  },
]

export const formatTime = (isoDate) =>
  new Date(isoDate).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })
