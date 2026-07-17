package com.ngohaibang.smartmoneyfrontend

import android.content.Intent
import android.provider.Settings
import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class NotificationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        var instance: NotificationModule? = null
        private val pendingEvents = mutableListOf<WritableMap>() // 🔥 queue
    }

    init {
        instance = this
    }

    override fun getName(): String {
        return "NotificationModule"
    }

    fun sendNotificationEvent(data: WritableMap) {
        if (reactContext.hasActiveCatalystInstance()) {
            try {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onNotificationReceived", data)

                Log.d("NotificationModule", "✅ Event sent to JS")

            } catch (e: Exception) {
                Log.e("NotificationModule", "❌ Emit error", e)
            }
        } else {
            Log.w("NotificationModule", "⚠️ React not ready → queue event")
            pendingEvents.add(data) // 🔥 giữ lại
        }
    }

    @ReactMethod
    fun notifyJSReady() {
        if (!reactContext.hasActiveCatalystInstance()) return

        Log.d("NotificationModule", "🚀 Flushing ${pendingEvents.size} events")

        val iterator = pendingEvents.iterator()
        while (iterator.hasNext()) {
            val event = iterator.next()
            try {
                reactContext
                    .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    .emit("onNotificationReceived", event)
            } catch (e: Exception) {
                Log.e("NotificationModule", "❌ Flush error", e)
            }
            iterator.remove()
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