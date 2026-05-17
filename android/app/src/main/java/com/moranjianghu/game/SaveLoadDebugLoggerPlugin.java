package com.moranjianghu.game;

import android.util.Log;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "SaveLoadDebugLogger")
public class SaveLoadDebugLoggerPlugin extends Plugin {
    private static final String TAG = "SAVE_LOAD_TRACE";
    private static final int CHUNK_SIZE = 3500;

    @PluginMethod
    public void log(PluginCall call) {
        String stage = call.getString("stage", "");
        String message = call.getString("message", "");

        if (message == null || message.isEmpty()) {
            Log.w(TAG, stage != null ? stage : "");
            call.resolve();
            return;
        }

        int chunk = 0;
        for (int start = 0; start < message.length(); start += CHUNK_SIZE) {
            int end = Math.min(message.length(), start + CHUNK_SIZE);
            Log.w(TAG, (stage != null ? stage : "") + " [" + chunk + "] " + message.substring(start, end));
            chunk += 1;
        }

        call.resolve();
    }
}
