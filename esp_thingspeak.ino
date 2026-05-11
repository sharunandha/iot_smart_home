#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

#include <DHT.h>

// =====================================
// WiFi Credentials
// =====================================
const char* ssid = "moto";
const char* password = "nithinnithin";

// =====================================
// ThingSpeak Write API Key
// =====================================
const char* thingspeakWriteKey = "V6IF3DH2TX0HW1R3";

// =====================================
// Pin Definitions
// =====================================
#define DHTPIN D2
#define DHTTYPE DHT11

// LDR DO pin
#define LDR_PIN D1

// LED pin
#define LED_PIN D6

// Relay pin
#define FAN_PIN D7

DHT dht(DHTPIN, DHTTYPE);

// =====================================
// Timer
// =====================================
unsigned long lastPost = 0;

const unsigned long postInterval = 15000;

// =====================================
// Setup
// =====================================
void setup() {

  Serial.begin(115200);

  pinMode(LDR_PIN, INPUT);

  pinMode(LED_PIN, OUTPUT);

  pinMode(FAN_PIN, OUTPUT);

  // Initially OFF
  digitalWrite(LED_PIN, LOW);

  // Relay OFF
  // ACTIVE LOW RELAY
  digitalWrite(FAN_PIN, HIGH);

  dht.begin();

  // =====================================
  // WiFi Connect
  // =====================================
  Serial.println();

  Serial.print("Connecting WiFi");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);

    Serial.print(".");
  }

  Serial.println();

  Serial.println("WiFi Connected");

  Serial.print("IP Address: ");

  Serial.println(WiFi.localIP());
}

// =====================================
// Read Temperature
// =====================================
float readTemperature() {

  float t = dht.readTemperature();

  if (isnan(t)) {

    return 0;
  }

  return t;
}

// =====================================
// Read Humidity
// =====================================
float readHumidity() {

  float h = dht.readHumidity();

  if (isnan(h)) {

    return 0;
  }

  return h;
}

// =====================================
// Read LDR
// =====================================
int readLight() {

  int lightValue = digitalRead(LDR_PIN);

  return lightValue;
}

// =====================================
// Upload Data
// =====================================
void postToThingSpeak(float temperature,
                      float humidity,
                      int lightStatus) {

  String url =
    "http://api.thingspeak.com/update?api_key=";

  url += thingspeakWriteKey;

  url += "&field1=" + String(temperature, 2);

  url += "&field2=" + String(humidity, 2);

  url += "&field3=" + String(lightStatus);

  Serial.println();

  Serial.println("Uploading Data...");

  Serial.println(url);

  WiFiClient client;

  HTTPClient http;

  http.begin(client, url);

  int httpCode = http.GET();

  if (httpCode > 0) {

    Serial.print("HTTP Response Code: ");

    Serial.println(httpCode);

    String payload = http.getString();

    Serial.print("ThingSpeak Entry Number: ");

    Serial.println(payload);

  } else {

    Serial.print("Upload Failed: ");

    Serial.println(http.errorToString(httpCode));
  }

  http.end();
}

// =====================================
// Main Loop
// =====================================
void loop() {

  // =====================================
  // Read LDR
  // =====================================
  int light = readLight();

  // =====================================
  // DARK DETECTED
  // =====================================
  // Most LDR modules:
  // 0 = LIGHT
  // 1 = DARK

  if (light == 1) {

    // LED ON
    digitalWrite(LED_PIN, HIGH);

    // MOTOR ON
    // ACTIVE LOW RELAY
    digitalWrite(FAN_PIN, LOW);

    Serial.println("DARK DETECTED");

  } else {

    // LED OFF
    digitalWrite(LED_PIN, LOW);

    // MOTOR OFF
    digitalWrite(FAN_PIN, HIGH);

    Serial.println("LIGHT DETECTED");
  }

  // =====================================
  // Upload Data Every 15 sec
  // =====================================
  if (millis() - lastPost >= postInterval) {

    lastPost = millis();

    float temperature = readTemperature();

    float humidity = readHumidity();

    Serial.println();

    Serial.println("===== SENSOR VALUES =====");

    Serial.print("Temperature: ");

    Serial.println(temperature);

    Serial.print("Humidity: ");

    Serial.println(humidity);

    Serial.print("LDR Status: ");

    Serial.println(light);

    postToThingSpeak(
      temperature,
      humidity,
      light
    );
  }

  delay(200);
}
