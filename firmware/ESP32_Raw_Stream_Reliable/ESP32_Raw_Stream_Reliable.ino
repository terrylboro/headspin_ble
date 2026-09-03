#include <WiFi.h>
#include "esp_camera.h"
#include "esp_http_server.h"

#define CAMERA_MODEL_XIAO_ESP32S3
#include "camera_pins.h"

static constexpr char AP_SSID[] = "EpleyCam";
static constexpr char AP_PASSWORD[] = "abcd1234";
static constexpr uint8_t AP_CHANNEL = 6;  // Try 1 or 11 if channel 6 is congested.
static constexpr uint16_t STREAM_PORT = 81;
static constexpr uint16_t HEALTH_PORT = 80;
static constexpr uint32_t LOG_INTERVAL_MS = 5000;

static httpd_handle_t stream_httpd = nullptr;
static httpd_handle_t health_httpd = nullptr;
static volatile uint32_t last_frame_sent_ms = 0;
static volatile uint32_t frames_sent = 0;

static esp_err_t send_chunk(httpd_req_t *req, const char *data, size_t length) {
  const esp_err_t result = httpd_resp_send_chunk(req, data, length);
  if (result != ESP_OK) {
    Serial.printf("Stream write failed: 0x%x\n", result);
  }
  return result;
}

static esp_err_t stream_handler(httpd_req_t *req) {
  static const char BOUNDARY[] = "\r\n--frame\r\n";
  char header[96];
  uint32_t last_log_ms = millis();
  uint32_t frames_at_last_log = frames_sent;

  esp_err_t result = httpd_resp_set_type(
    req, "multipart/x-mixed-replace; boundary=frame"
  );
  if (result != ESP_OK) return result;

  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "Cache-Control", "no-store, no-cache, must-revalidate");

  while (true) {
    const uint32_t capture_started_ms = millis();
    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera frame acquisition failed");
      delay(10);
      continue;
    }

    uint8_t *jpeg_buffer = fb->buf;
    size_t jpeg_length = fb->len;
    bool converted = false;

    if (fb->format != PIXFORMAT_JPEG) {
      converted = frame2jpg(fb, 25, &jpeg_buffer, &jpeg_length);
      if (!converted) {
        Serial.println("JPEG conversion failed");
        esp_camera_fb_return(fb);
        delay(10);
        continue;
      }
    }

    const int header_length = snprintf(
      header,
      sizeof(header),
      "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n",
      static_cast<unsigned>(jpeg_length)
    );

    result = send_chunk(req, BOUNDARY, sizeof(BOUNDARY) - 1);
    if (result == ESP_OK) {
      result = send_chunk(req, header, header_length);
    }
    if (result == ESP_OK) {
      result = send_chunk(req, reinterpret_cast<const char *>(jpeg_buffer), jpeg_length);
    }

    if (converted) free(jpeg_buffer);
    esp_camera_fb_return(fb);

    if (result != ESP_OK) {
      Serial.println("Stream client disconnected");
      break;
    }

    last_frame_sent_ms = millis();
    ++frames_sent;

    const uint32_t now = millis();
    if (now - last_log_ms >= LOG_INTERVAL_MS) {
      const uint32_t recent_frames = frames_sent - frames_at_last_log;
      Serial.printf(
        "Stream: %.1f fps, JPEG: %u bytes, capture+send: %u ms, heap: %u\n",
        recent_frames * 1000.0f / (now - last_log_ms),
        static_cast<unsigned>(jpeg_length),
        static_cast<unsigned>(now - capture_started_ms),
        static_cast<unsigned>(ESP.getFreeHeap())
      );
      last_log_ms = now;
      frames_at_last_log = frames_sent;
    }

    delay(5);
  }

  // Explicitly terminate the chunked response after a failed/stale connection.
  httpd_resp_send_chunk(req, nullptr, 0);
  return result;
}

static esp_err_t health_handler(httpd_req_t *req) {
  char response[128];
  const uint32_t now = millis();
  const uint32_t frame_age_ms = last_frame_sent_ms == 0
    ? UINT32_MAX
    : now - last_frame_sent_ms;

  const int length = snprintf(
    response,
    sizeof(response),
    "{\"frames\":%u,\"frameAgeMs\":%u,\"heap\":%u}",
    static_cast<unsigned>(frames_sent),
    static_cast<unsigned>(frame_age_ms),
    static_cast<unsigned>(ESP.getFreeHeap())
  );

  httpd_resp_set_type(req, "application/json");
  httpd_resp_set_hdr(req, "Access-Control-Allow-Origin", "*");
  httpd_resp_set_hdr(req, "Cache-Control", "no-store");
  return httpd_resp_send(req, response, length);
}

static bool start_servers() {
  httpd_config_t stream_config = HTTPD_DEFAULT_CONFIG();
  stream_config.server_port = STREAM_PORT;
  stream_config.ctrl_port = 32769;
  stream_config.lru_purge_enable = true;
  stream_config.stack_size = 8192;
  stream_config.send_wait_timeout = 2;
  stream_config.recv_wait_timeout = 2;

  httpd_uri_t stream_uri = {
    .uri = "/stream",
    .method = HTTP_GET,
    .handler = stream_handler,
    .user_ctx = nullptr
  };

  esp_err_t result = httpd_start(&stream_httpd, &stream_config);
  if (result != ESP_OK) {
    Serial.printf("Stream server failed to start: 0x%x\n", result);
    return false;
  }
  result = httpd_register_uri_handler(stream_httpd, &stream_uri);
  if (result != ESP_OK) {
    Serial.printf("Failed to register /stream: 0x%x\n", result);
    return false;
  }

  // A separate server task keeps health checks responsive if a stream write stalls.
  httpd_config_t health_config = HTTPD_DEFAULT_CONFIG();
  health_config.server_port = HEALTH_PORT;
  health_config.ctrl_port = 32770;
  health_config.lru_purge_enable = true;
  health_config.send_wait_timeout = 2;
  health_config.recv_wait_timeout = 2;

  httpd_uri_t health_uri = {
    .uri = "/health",
    .method = HTTP_GET,
    .handler = health_handler,
    .user_ctx = nullptr
  };

  result = httpd_start(&health_httpd, &health_config);
  if (result != ESP_OK) {
    Serial.printf("Health server failed to start: 0x%x\n", result);
    return false;
  }
  result = httpd_register_uri_handler(health_httpd, &health_uri);
  if (result != ESP_OK) {
    Serial.printf("Failed to register /health: 0x%x\n", result);
    return false;
  }

  return true;
}

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(false);

  camera_config_t camera = {};
  camera.ledc_channel = LEDC_CHANNEL_0;
  camera.ledc_timer = LEDC_TIMER_0;
  camera.pin_d0 = Y2_GPIO_NUM;
  camera.pin_d1 = Y3_GPIO_NUM;
  camera.pin_d2 = Y4_GPIO_NUM;
  camera.pin_d3 = Y5_GPIO_NUM;
  camera.pin_d4 = Y6_GPIO_NUM;
  camera.pin_d5 = Y7_GPIO_NUM;
  camera.pin_d6 = Y8_GPIO_NUM;
  camera.pin_d7 = Y9_GPIO_NUM;
  camera.pin_xclk = XCLK_GPIO_NUM;
  camera.pin_pclk = PCLK_GPIO_NUM;
  camera.pin_vsync = VSYNC_GPIO_NUM;
  camera.pin_href = HREF_GPIO_NUM;
  camera.pin_sccb_sda = SIOD_GPIO_NUM;
  camera.pin_sccb_scl = SIOC_GPIO_NUM;
  camera.pin_pwdn = PWDN_GPIO_NUM;
  camera.pin_reset = RESET_GPIO_NUM;
  camera.xclk_freq_hz = 20000000;
  camera.pixel_format = PIXFORMAT_JPEG;
  camera.frame_size = FRAMESIZE_QQVGA;
  camera.jpeg_quality = 25;

  if (psramFound()) {
    camera.fb_count = 2;
    camera.fb_location = CAMERA_FB_IN_PSRAM;
    camera.grab_mode = CAMERA_GRAB_LATEST;
  } else {
    camera.fb_count = 1;
    camera.fb_location = CAMERA_FB_IN_DRAM;
    camera.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
  }

  const esp_err_t camera_result = esp_camera_init(&camera);
  Serial.printf(
    "Camera init: 0x%x, PSRAM: %s\n",
    camera_result,
    psramFound() ? "YES" : "NO"
  );
  if (camera_result != ESP_OK) {
    while (true) delay(1000);
  }

  WiFi.mode(WIFI_AP);
  WiFi.setSleep(false);
  if (!WiFi.softAP(AP_SSID, AP_PASSWORD, AP_CHANNEL)) {
    Serial.println("Failed to start EpleyCam access point");
    while (true) delay(1000);
  }

  if (!start_servers()) {
    while (true) delay(1000);
  }

  const String address = WiFi.softAPIP().toString();
  Serial.printf("Stream: http://%s:%u/stream\n", address.c_str(), STREAM_PORT);
  Serial.printf("Health: http://%s:%u/health\n", address.c_str(), HEALTH_PORT);
}

void loop() {
  delay(1000);
}
