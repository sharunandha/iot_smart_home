const CHANNEL_ID = "3377365"
const READ_API_KEY = "GES3BFQOYIFKHHDJ"
const RESULT_LIMIT = 20

const normalizeEntry = (entry) => {
  const temperature = Number(entry.field1 ?? 0)
  const humidity = Number(entry.field2 ?? 0)
  const darkDetection = Number(entry.field3 ?? 0)
  const motion = Number(entry.field4 ?? 0)
  const led = Number(entry.field5 ?? 0)
  const fan = Number(entry.field6 ?? 0)

  return {
    id: entry.entry_id,
    timestamp: entry.created_at,
    temperature,
    humidity,
    darkDetection: darkDetection > 0 ? 1 : 0,
    light: darkDetection > 0 ? 1 : 0,
    motion: motion > 0 ? 1 : 0,
    led: led > 0 ? 1 : 0,
    fan: fan > 0 ? 1 : 0,
  }
}

export const fetchThingSpeakFeed = async () => {
  if (CHANNEL_ID.startsWith("YOUR_")) {
    throw new Error("ThingSpeak credentials are not configured. Set CHANNEL_ID and READ_API_KEY in thingspeakService.js.")
  }

  const endpoint = `https://api.thingspeak.com/channels/${CHANNEL_ID}/feeds.json?api_key=${READ_API_KEY}&results=${RESULT_LIMIT}`
  const response = await fetch(endpoint)

  if (!response.ok) {
    throw new Error(`ThingSpeak request failed: ${response.status}`)
  }

  const payload = await response.json()
  const feed = (payload.feeds ?? []).map(normalizeEntry)

  if (feed.length === 0) {
    throw new Error("ThingSpeak returned no feed data.")
  }

  return { feed, mode: "live" }
}
