package com.smartmoneyfrontend

import android.content.Context
import android.util.Log
import org.json.JSONArray
import org.json.JSONObject

/**
 * Hang doi ben vung (SharedPreferences) cho thong bao ngan hang den khi
 * React Native chua chay (app dong / bi kill). Truoc day queue chi nam
 * trong RAM (companion object) nen mat sach khi process chet.
 *
 * Flow: NotificationListener bat thong bao -> emit truc tiep neu JS san sang,
 * nguoc lai add() vao day -> khi app mo, notifyJSReady() goi drain() va emit
 * lai tung event voi flag queued=true de JS noi han tuoi xu ly.
 */
object NotificationQueue {

    private const val TAG = "NotificationQueue"
    private const val PREFS = "smart_money_notification_queue"
    private const val KEY = "pending_notifications"
    private const val MAX_SIZE = 50
    private const val MAX_AGE_MS = 24L * 60 * 60 * 1000 // 24h

    @Synchronized
    fun add(context: Context, event: JSONObject) {
        try {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val now = System.currentTimeMillis()

            val current = readArray(context)
            val pruned = JSONArray()
            for (i in 0 until current.length()) {
                val item = current.optJSONObject(i) ?: continue
                if (now - item.optLong("timestamp", now) <= MAX_AGE_MS) {
                    pruned.put(item)
                }
            }
            pruned.put(event)

            // Gioi han kich thuoc: bo event cu nhat (FIFO)
            val start = maxOf(0, pruned.length() - MAX_SIZE)
            val capped = JSONArray()
            for (i in start until pruned.length()) {
                capped.put(pruned.get(i))
            }

            prefs.edit().putString(KEY, capped.toString()).apply()
            Log.d(TAG, "💾 Queued notification, size=${capped.length()}")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to queue notification", e)
        }
    }

    @Synchronized
    fun drain(context: Context): List<JSONObject> {
        val result = mutableListOf<JSONObject>()
        try {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            val now = System.currentTimeMillis()

            val current = readArray(context)
            for (i in 0 until current.length()) {
                val item = current.optJSONObject(i) ?: continue
                if (now - item.optLong("timestamp", now) <= MAX_AGE_MS) {
                    result.add(item)
                }
            }

            prefs.edit().remove(KEY).apply()
            Log.d(TAG, "📤 Drained ${result.size} queued notifications")
        } catch (e: Exception) {
            Log.e(TAG, "❌ Failed to drain queue", e)
        }
        return result
    }

    private fun readArray(context: Context): JSONArray {
        return try {
            val prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
            JSONArray(prefs.getString(KEY, "[]") ?: "[]")
        } catch (e: Exception) {
            JSONArray()
        }
    }
}
