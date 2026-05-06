package com.moranjianghu.game;

import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Iterator;
import java.util.concurrent.ConcurrentHashMap;

@CapacitorPlugin(name = "NativeChatStreamer")
public class NativeChatStreamerPlugin extends Plugin {
    private static final String TAG = "MoRanJiangHuStream";
    private final ConcurrentHashMap<String, HttpURLConnection> activeConnections = new ConcurrentHashMap<>();

    @PluginMethod
    public void streamChat(PluginCall call) {
        String requestId = call.getString("requestId", "");
        String endpoint = call.getString("endpoint", "");
        String body = call.getString("body", "");
        JSObject headers = call.getObject("headers", new JSObject());

        if (requestId == null || requestId.trim().isEmpty()) {
            call.reject("Missing requestId");
            return;
        }
        if (endpoint == null || endpoint.trim().isEmpty()) {
            call.reject("Missing endpoint");
            return;
        }

        new Thread(() -> runStreamRequest(call, requestId, endpoint, headers, body != null ? body : "")).start();
    }

    @PluginMethod
    public void cancelStream(PluginCall call) {
        String requestId = call.getString("requestId", "");
        HttpURLConnection connection = activeConnections.remove(requestId);
        if (connection != null) {
            connection.disconnect();
            Log.i(TAG, "native stream cancelled requestId=" + requestId);
        }
        call.resolve();
    }

    private void runStreamRequest(
        PluginCall call,
        String requestId,
        String endpoint,
        JSObject headers,
        String body
    ) {
        HttpURLConnection connection = null;

        try {
            URL url = new URL(endpoint);
            connection = (HttpURLConnection) url.openConnection();
            activeConnections.put(requestId, connection);
            connection.setConnectTimeout(15000);
            connection.setReadTimeout(120000);
            connection.setRequestMethod("POST");
            connection.setUseCaches(false);
            connection.setDoInput(true);
            connection.setDoOutput(true);
            connection.setRequestProperty("Accept-Encoding", "identity");

            Iterator<String> keys = headers.keys();
            while (keys.hasNext()) {
                String key = keys.next();
                String value = headers.optString(key, "");
                if (key != null && !key.trim().isEmpty() && value != null) {
                    connection.setRequestProperty(key, value);
                }
            }

            byte[] payload = body.getBytes(StandardCharsets.UTF_8);
            connection.setFixedLengthStreamingMode(payload.length);
            try (OutputStream outputStream = connection.getOutputStream()) {
                outputStream.write(payload);
                outputStream.flush();
            }

            int status = connection.getResponseCode();
            String contentType = connection.getContentType();
            Log.i(TAG, "native stream response requestId=" + requestId
                + " status=" + status
                + " contentType=" + contentType);

            if (status < 200 || status >= 300) {
                String detail = readStreamText(connection.getErrorStream(), 4000);
                notifyError(requestId, "API Error: " + status + (detail.isEmpty() ? "" : " - " + detail), status);
                call.reject("API Error: " + status + (detail.isEmpty() ? "" : " - " + detail));
                return;
            }

            if (contentType == null || !contentType.toLowerCase().contains("text/event-stream")) {
                String detail = readStreamText(connection.getInputStream(), 4000);
                String message = "API Error: stream unsupported (content-type="
                    + (contentType == null ? "unknown" : contentType) + ")";
                notifyError(requestId, message, status);
                call.reject(detail.isEmpty() ? message : message + " - " + detail);
                return;
            }

            notifyMeta(requestId, status, contentType);
            try (InputStream inputStream = connection.getInputStream()) {
                InputStreamReader reader = new InputStreamReader(inputStream, StandardCharsets.UTF_8);
                char[] buffer = new char[1024];
                int charsRead;
                while ((charsRead = reader.read(buffer)) != -1) {
                    String chunk = new String(buffer, 0, charsRead);
                    int byteLength = chunk.getBytes(StandardCharsets.UTF_8).length;
                    Log.i(TAG, "native stream chunk requestId=" + requestId + " bytes=" + byteLength);
                    notifyChunk(requestId, chunk, byteLength);
                }
            }

            notifyDone(requestId);
            call.resolve();
        } catch (Exception error) {
            String message = error.getMessage() != null ? error.getMessage() : error.getClass().getSimpleName();
            Log.i(TAG, "native stream error requestId=" + requestId + " message=" + message);
            notifyError(requestId, message, 0);
            call.reject(message, error);
        } finally {
            activeConnections.remove(requestId);
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private String readStreamText(InputStream inputStream, int maxBytes) {
        if (inputStream == null) return "";

        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            byte[] buffer = new byte[1024];
            int total = 0;
            int bytesRead;
            while ((bytesRead = inputStream.read(buffer, 0, Math.min(buffer.length, maxBytes - total))) != -1) {
                outputStream.write(buffer, 0, bytesRead);
                total += bytesRead;
                if (total >= maxBytes) break;
            }
            return outputStream.toString(StandardCharsets.UTF_8.name()).trim();
        } catch (Exception ignored) {
            return "";
        }
    }

    private void notifyMeta(String requestId, int status, String contentType) throws JSONException {
        JSObject payload = basePayload(requestId, "meta");
        payload.put("status", status);
        payload.put("contentType", contentType);
        notifyListeners("chatStream", payload);
    }

    private void notifyChunk(String requestId, String text, int byteLength) throws JSONException {
        JSObject payload = basePayload(requestId, "chunk");
        payload.put("text", text);
        payload.put("byteLength", byteLength);
        notifyListeners("chatStream", payload);
    }

    private void notifyDone(String requestId) throws JSONException {
        notifyListeners("chatStream", basePayload(requestId, "done"));
    }

    private void notifyError(String requestId, String message, int status) {
        try {
            JSObject payload = basePayload(requestId, "error");
            payload.put("message", message);
            payload.put("status", status);
            notifyListeners("chatStream", payload);
        } catch (Exception ignored) {
            // ignore listener failures while reporting errors
        }
    }

    private JSObject basePayload(String requestId, String type) throws JSONException {
        JSObject payload = new JSObject();
        payload.put("requestId", requestId);
        payload.put("type", type);
        return payload;
    }
}
