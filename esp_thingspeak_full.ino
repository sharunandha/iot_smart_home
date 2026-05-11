// esp_thingspeak_full.ino
// Full example: ESP8266/ESP32
// - Reads DHT22 (temperature, humidity)
// - Reads LDR (light) via ADC
// - Reads PIR (motion) digital input
// - Posts sensor data to ThingSpeak fields:
//     field1 = temperature (°C)
//     field2 = humidity (%)
//     field3 = light (raw ADC or lux)
//     field4 = motion (0/1)
// - Polls ThingSpeak for latest feed to read commands:
//     field5 = led (0/1)
//     field6 = fan (0/1)
// Requirements: Install libraries `DHT sensor library` and `ArduinoJson` via Library Manager.

#ifdef ESP8266
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#else
#include <WiFi.h>
#include <HTTPClient.h>
#endif

#include <DHT.h>
#include <ArduinoJson.h>

// --- User configuration ---
const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASS";

// ThingSpeak credentials
const char* thingspeakWriteKey = "V6IF3DH2TX0HW1R3"; // Write API Key
const char* thingspeakChannelId = "3377365"; // Channel ID
const char* thingspeakReadKey = "GES3BFQOYIFKHHDJ"; // Read API Key (if channel private)

// Pins (adjust per your board)
#ifdef ESP8266
#define DHTPIN D2 // GPIO4
#define LDR_PIN A0
#define PIR_PIN D5 // GPIO14
#define LED_PIN D6 // GPIO12
#define FAN_PIN D7 // GPIO13
#else
#define DHTPIN 15 // change to your pin
#define LDR_PIN 34
#define PIR_PIN 27
#define LED_PIN 26
#define FAN_PIN 25
#endif

#define DHTTYPE DHT22
DHT dht(DHTPIN, DHTTYPE);

unsigned long lastPost = 0;
const unsigned long postInterval = 15000UL; // ThingSpeak minimum: 15s
unsigned long lastCommandPoll = 0;
const unsigned long commandPollInterval = 8000UL; // poll commands every 8s

void setup() {
  Serial.begin(115200);
  delay(10);

  pinMode(PIR_PIN, INPUT);
  pinMode(LED_PIN, OUTPUT);
  pinMode(FAN_PIN, OUTPUT);

  digitalWrite(LED_PIN, LOW);
  digitalWrite(FAN_PIN, LOW);

  dht.begin();

  Serial.print("Connecting to WiFi ");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();
  Serial.print("Connected, IP: ");
  Serial.println(WiFi.localIP());
}

float readTemperature() {
  float t = dht.readTemperature();
  if (isnan(t)) return -127.0; // error sentinel
  return t;
}

float readHumidity() {
  float h = dht.readHumidity();
  if (isnan(h)) return -127.0;
  return h;
}

int readLight() {
#ifdef ESP8266
  return analogRead(LDR_PIN); // 0-1023
#else
  return analogRead(LDR_PIN); // ESP32 analog read (0-4095 by default)
#endif
}

int readMotion() {
  return digitalRead(PIR_PIN) == HIGH ? 1 : 0;
}

void postToThingSpeak(float temperature, float humidity, int light, int motion) {
  if (WiFi.status() != WL_CONNECTED) return;

  String url = String("https://api.thingspeak.com/update?api_key=") + thingspeakWriteKey;
  url += "&field1=" + String(temperature, 2);
  url += "&field2=" + String(humidity, 2);
  url += "&field3=" + String(light);
  url += "&field4=" + String(motion);

  Serial.print("Posting: ");
  Serial.println(url);

  HTTPClient http;
  http.begin(url);
  int code = http.GET();
  if (code > 0) {
    Serial.print("ThingSpeak POST response: ");
    Serial.println(code);
  } else {
    Serial.print("POST failed: ");
    Serial.println(http.errorToString(code));
  }
  http.end();
}

void pollCommands() {
  // Fetch the latest feed entry to read field5/field6
  if (WiFi.status() != WL_CONNECTED) return;

  String endpoint = String("https://api.thingspeak.com/channels/") + thingspeakChannelId + "/feeds.json?results=1&api_key=" + thingspeakReadKey;
  Serial.print("Polling commands: ");
  Serial.println(endpoint);

  HTTPClient http;
  http.begin(endpoint);
  int code = http.GET();
  if (code != 200) {
    Serial.print("Command poll failed, code: ");
    Serial.println(code);
    http.end();
    return;
  }

  String payload = http.getString();
  http.end();

  // Parse JSON for field5 and field6
  const size_t capacity = 4*1024;
  DynamicJsonDocument doc(capacity);
  DeserializationError err = deserializeJson(doc, payload);
  if (err) {
    Serial.print("JSON parse failed: ");
    Serial.println(err.c_str());
    return;
  }

  JsonArray feeds = doc["feeds"];
  if (feeds.size() == 0) return;

  JsonObject latest = feeds[0];
  int ledCmd = 0;
  int fanCmd = 0;
  if (!latest["field5"].isNull()) ledCmd = latest["field5"].as<int>();
  if (!latest["field6"].isNull()) fanCmd = latest["field6"].as<int>();

  Serial.print("Commands -> LED: "); Serial.print(ledCmd); Serial.print("  FAN: "); Serial.println(fanCmd);

  digitalWrite(LED_PIN, ledCmd ? HIGH : LOW);
  digitalWrite(FAN_PIN, fanCmd ? HIGH : LOW);
}

void loop() {
  unsigned long now = millis();

  if (now - lastCommandPoll >= commandPollInterval) {
    lastCommandPoll = now;
    pollCommands();
  }

  if (now - lastPost >= postInterval) {
    lastPost = now;

    float t = readTemperature();
    float h = readHumidity();
    int l = readLight();
    int m = readMotion();

    // If sensor read error, skip posting temperature/humidity
    if (t <= -100 || h <= -100) {
      Serial.println("Sensor read failed (DHT); posting available values only.");
    }

    postToThingSpeak(t, h, l, m);
  }
}
