import * as Notifications from "expo-notifications";
import { NativeModules, NativeEventEmitter, Alert } from "react-native";
import EventEmitter from "eventemitter3";
import AIAPI from "../api/ai.api";
import TransactionApi from "../api/transaction.api";
import { waitForAIResult } from "../services/aiWebSocketHelper";
import { tokenStorage } from "../storage/tokenStorage";
import authApi from "../api/auth.api";
import { TransactionType } from "../types/transaction.types";
import { formatDateTime } from "../utils/dateFormatter";

const { NotificationModule } = NativeModules;
const emitter = new NativeEventEmitter(NotificationModule);

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "processed_notifications_v1";

type Fingerprint = string;

export class NotificationListenerService {
  private static isInitialized = false;
  private static eventBus = new EventEmitter();
  private static nativeSubscription: any = null;

  private static processedSet = new Set<Fingerprint>();

  private static MAX_AGE_MS = 30 * 1000;
  private static BUCKET_MS = 10 * 1000;
  private static CLEANUP_TTL = 60 * 1000;

  static getEventBus() {
    return this.eventBus;
  }

  // ================= INIT =================
  static async initialize() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    await this.loadCache();

    console.log("✅ NotificationListener initialized:", this.processedSet.size);

    NotificationModule?.notifyJSReady();


    this.attachNativeListener(); // 🔥 QUAN TRỌNG
  }

  static destroy() {
    this.nativeSubscription?.remove();
    this.nativeSubscription = null;
    this.isInitialized = false;
  }

  // ================= NATIVE LISTENER =================

  private static attachNativeListener() {
    if (!NotificationModule) {
      console.warn("⚠️ NotificationModule not available");
      return;
    }

    // 🔥 tránh attach nhiều lần
    if (this.nativeSubscription) {
      console.log("⚠️ Listener already attached");
      return;
    }

    this.nativeSubscription = emitter.addListener(
      "onNotificationReceived",
      async (payload) => {
        console.log("📩 Native notification:", payload);
        await this.handleLockScreenNotification(payload);
      }
    );
  }

  // ================= CORE =================

  private static getTimestamp(payload: any, notification?: any): number {
    return payload?.timestamp || notification?.date || Date.now();
  }

  private static isFresh(timestamp: number): boolean {
    return Date.now() - timestamp < this.MAX_AGE_MS;
  }

  private static normalizeText(text: string): string {
    return text.trim().toLowerCase();
  }

  private static getFingerprint(
    text: string,
    timestamp: number,
    source: string,
    pkg?: string
  ): Fingerprint {
    const bucket = Math.floor(timestamp / this.BUCKET_MS);
    return `${source}_${pkg || "unknown"}_${this.normalizeText(text)}_${bucket}`;
  }

  private static shouldProcess(
    text: string,
    timestamp: number,
    source: string,
    pkg?: string
  ): boolean {
    if (!this.isFresh(timestamp)) {
      console.log("⏭️ Skip old notification");
      return false;
    }

    const key = this.getFingerprint(text, timestamp, source, pkg);

    if (this.processedSet.has(key)) {
      console.log("⏭️ Duplicate skipped:", key);
      return false;
    }

    this.processedSet.add(key);

    setTimeout(() => {
      this.processedSet.delete(key);
    }, this.CLEANUP_TTL);

    this.persistCache();

    return true;
  }

  // ================= STORAGE =================

  private static async loadCache() {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const arr: Fingerprint[] = JSON.parse(raw);
      arr.slice(-200).forEach((k) => this.processedSet.add(k));
    } catch {
      console.warn("⚠️ Failed to load cache");
    }
  }

  private static async persistCache() {
    try {
      const arr = Array.from(this.processedSet).slice(-200);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
    } catch {
      console.warn("⚠️ Failed to persist cache");
    }
  }

  private static isFinanceApp(packageName?: string): boolean {
    if (!packageName) return false;

    const normalized = packageName.toLowerCase().trim();

    return (
      normalized.includes("bank") ||
      normalized.includes("mb") ||
      normalized.includes("momo") ||
      normalized.includes("zalopay") ||
      normalized.includes("pay") ||
      normalized.includes("agribank") ||
      normalized.includes("vietcom") ||
      normalized.includes("vietin") ||
      normalized.includes("bidv") ||
      normalized.includes("techcom")
    );
  }

  private static TRANSACTION_KEYWORDS = [
    "chuyển tiền",
    "nhận tiền",
    "ghi có",
    "ghi nợ",
    "biến động số dư",
    "thanh toán",
    "nap tien",
    "rút tiền",
    "so du",
    "tai khoan",
  ];

  private static MONEY_REGEX = /\b\d{1,3}([.,]\d{3})*(\s?)(vnd|vnđ|đ)\b/i;

  private static ACCOUNT_REGEX = /(tk|tài khoản|account)/i;

  private static normalizeVietnamese(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // remove dấu
  }

  private static isTransactionNotification(text: string): boolean {
    if (!text) return false;

    const normalized = this.normalizeVietnamese(text);

    const hasKeyword = this.TRANSACTION_KEYWORDS.some((kw) =>
      normalized.includes(this.normalizeVietnamese(kw))
    );

    const hasMoney = this.MONEY_REGEX.test(normalized);
    const hasAccount = this.ACCOUNT_REGEX.test(normalized);

    // 🎯 Rule mạnh hơn:
    // - phải có tiền
    // - và (keyword hoặc account)
    const isTransaction = hasMoney && (hasKeyword || hasAccount);

    console.log("🔍 Transaction check:", {
      hasKeyword,
      hasMoney,
      hasAccount,
      isTransaction,
    });

    return isTransaction;
  }

  // ================= HANDLERS =================

  static async handleLockScreenNotification(payload: any) {
    try {
      const text = payload?.text || payload?.body || payload?.message || "";
      const timestamp = this.getTimestamp(payload);
      const pkg = payload?.package || "native";

      if (!text) return;

      // 🔥 FILTER QUAN TRỌNG
      const isTransaction = this.isTransactionNotification(text);
      const isFinance = this.isFinanceApp(pkg);

      if (!isTransaction) {
        console.log("⏭️ Not transaction");
        return;
      }

      if (!isFinance) {
        console.log("⏭️ Not finance app:", pkg);
        return;
      }

      // 🔥 DUPLICATE FILTER
      if (!this.shouldProcess(text, timestamp, "native", pkg)) return;

      console.log("🚀 Processing lockscreen notification");

      await this.processAndCreateTransaction(text);

    } catch (e) {
      console.error("❌ LockScreen error:", e);
    }
  }

  static async handleForegroundNotification(notification: any) {
    try {
      const text = notification.request.content.body || "";
      const timestamp = this.getTimestamp(null, notification);

      if (!text) return;

      const isTransaction = this.isTransactionNotification(text);

      if (!isTransaction) {
        console.log("⏭️ Not transaction");
        return;
      }

      if (!this.shouldProcess(text, timestamp, "foreground")) return;

      console.log("🚀 Processing foreground notification");

      await this.processAndCreateTransaction(text);

    } catch (e) {
      console.error("❌ Foreground error:", e);
    }
  }

  // ================= MAIN FLOW =================

  private static async processAndCreateTransaction(rawText: string) {
    try {
      this.eventBus.emit("ai:processing-start", rawText);

      const submitRes = await AIAPI.submitText(rawText);

      if (!submitRes?.success || !submitRes?.data?.jobId) {
        throw new Error("Submit failed");
      }

      const jobId = submitRes.data.jobId;

      const aiResult = await waitForAIResult(jobId);

      const payload = {
        amount: Number(aiResult.expense || aiResult.amount || 0),
        category: aiResult.category || "OTHER",
        type: aiResult.type === "INCOME" ? "INCOME" as TransactionType : "EXPENSE" as TransactionType, 
        description: aiResult.description || rawText,
        date: aiResult.date || formatDateTime(new Date()),
      };

      const createRes = await TransactionApi.create(payload);

      if (!createRes?.success) {
        throw new Error("Create failed");
      }

      this.eventBus.emit("ai:transaction-created", createRes.data);

      console.log("✅ Transaction created");
    } catch (error: any) {
      this.eventBus.emit("ai:processing-error", error?.message);
      console.error("❌ Processing error:", error);
    }
  }

  static stop() {
    try {
      console.log("🛑 Stopping NotificationListenerService...");

      // 🔥 remove native listener
      if (this.nativeSubscription) {
        this.nativeSubscription.remove();
        this.nativeSubscription = null;
        console.log("✅ Native listener removed");
      }

      // 🔥 reset state
      this.isInitialized = false;

    } catch (err) {
      console.error("❌ Error stopping NotificationListenerService:", err);
    }
  }
}