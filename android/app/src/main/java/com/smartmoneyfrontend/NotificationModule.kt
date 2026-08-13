package com.smartmoneyfrontend

import android.content.Intent
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class NotificationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        var instance: NotificationModule? = null
    }

    init {
        instance = this
    }

    override fun getName(): String {
        return "NotificationModule"
    }

    /**
     * Emit truc tiep sang JS. Tra ve true neu gui thanh cong; false neu
     * React chua san sang -> caller (NotificationListener) se luu vao
     * NotificationQueue (SharedPreferences) de xu ly khi app mo lai.
     */
    fun sendNotificationEvent(data: WritableMap): Boolean {
        if (!reactContext.hasActiveCatalystInstance()) {
            Log.w("NotificationModule", "⚠️ React not ready → persist event")
            return false
        }
        return try {
            reactContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit("onNotificationReceived", data)

            Log.d("NotificationModule", "✅ Event sent to JS")
            true
        } catch (e: Exception) {
            Log.e("NotificationModule", "❌ Emit error", e)
            false
        }
    }

    @ReactMethod
    fun notifyJSReady() {
        if (!reactContext.hasActiveCatalystInstance()) return

        val queued = NotificationQueue.drain(reactContext)
        Log.d("NotificationModule", "🚀 Flushing ${queued.size} persisted events")

        for (json in queued) {
            try {
                val map = Arguments.createMap().apply {
                    putString("title", json.optString("title"))
                    putString("text", json.optString("text"))
                    putString("package", json.optString("package"))
                    putDouble("timestamp", json.optLong("timestamp").toDouble())
                    putBoolean("queued", true) // JS dua vao flag nay de noi han tuoi
                }
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onNotificationReceived", map)
            } catch (e: Exception) {
                Log.e("NotificationModule", "❌ Flush error", e)
            }
        }
    }

    @ReactMethod
    fun openNotificationListenerSettings() {
        val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
        reactContext.startActivity(intent)
    }

    @ReactMethod
    fun hasPermission(promise: Promise) {
        try {
            val enabledListeners =
                Settings.Secure.getString(
                    reactContext.contentResolver,
                    "enabled_notification_listeners"
                )

            val packageName = reactContext.packageName

            promise.resolve(
                enabledListeners != null &&
                        enabledListeners.contains(packageName)
            )
        } catch (e: Exception) {
            promise.reject("PERMISSION_ERROR", e)
        }
    }
}