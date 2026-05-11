// esp_thingspeak.ino
// Works with ESP8266 or ESP32 (Arduino Core)
// Replace YOUR_SSID, YOUR_PASS, YOUR_WRITE_API_KEY before uploading

#ifdef ESP8266
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#else
#include <WiFi.h>
#include <HTTPClient.h>
#endif

const char* ssid = "YOUR_SSID";
const char* password = "YOUR_PASS";
const char* thingspeakApiKey = "YOUR_WRITE_API_KEY"; // Write API Key from ThingSpeak channel

unsigned long lastTime = 0;
const unsigned long interval = 15000; // ThingSpeak minimum update interval: 15 seconds

void setup() {
  Serial.begin(115200);
  delay(10);
  Serial.println();
  Serial.println("Connecting to WiFi...");

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print('.');
  }
  Serial.println();
  Serial.print("Connected. IP: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (millis() - lastTime >= interval) {
    lastTime = millis();

    // Read a sensor value. Change this to your sensor reading code.
#ifdef ESP8266
    int raw = analogRead(A0); // 0-1023
#else
    int raw = analogRead(34); // Example ADC pin for ESP32; adjust to your board/pin
#endif

    // Prepare field value (use raw or convert to voltage/physical units)
    String field1 = String(raw);

    // Build ThingSpeak update URL
    String url = String("http://api.thingspeak.com/update?api_key=") + thingspeakApiKey + "&field1=" + field1;

    HTTPClient http;
    http.begin(url);
    int httpCode = http.GET();
    if (httpCode > 0) {
      Serial.print("ThingSpeak update response: ");
      Serial.println(httpCode);
    } else {
      Serial.print("ThingSpeak update failed, error: ");
      Serial.println(http.errorToString(httpCode));
    }
    http.end();
  }
}
