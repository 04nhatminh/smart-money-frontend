import { NativeModules, NativeEventEmitter, Alert } from "react-native";
import EventEmitter from "eventemitter3";
import AIAPI from "../api/ai.api";
import PendingStorage, { pendingEventBus, ProcessingEvent, ProcessingStatus } from "../storage/pendingTransactionStorage";
import { watchPendingJob } from "../services/websocket";
import DeduplicationService from "../utils/DeduplicationService";
import Constants from "expo-constants";

const { NotificationModule } = NativeModules;
const emitter = new NativeEventEmitter(NotificationModule);

import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "processed_notifications_v1";

type Fingerprint = string;

// Helper phát sự kiện
async function emitStatus(pendingId: string, status: ProcessingStatus, error?: string) {
  await PendingStorage.update(pendingId, {
    processingStatus: status,
    processingError: error,
  });
  const event: ProcessingEvent = { pendingId, status, error };
  pendingEventBus.emit('processing_update', event);
}


export class NotificationListenerService {
  private static isInitialized = false;
  private static eventBus = new EventEmitter();
  private static nativeSubscription: any = null;

  private static processedSet = new Set<Fingerprint>();
  private static inFlightSet = new Set<Fingerprint>(); // Prevent concurrent processing

  private static MAX_AGE_MS = 30 * 1000;
  // Thong bao duoc native queue lai khi app dong -> cho phep xu ly muon toi 24h
  private static QUEUED_MAX_AGE_MS = 24 * 60 * 60 * 1000;
  private static BUCKET_MS = 10 * 1000;
  private static CLEANUP_TTL = 60 * 1000;

  static getEventBus() {
    return this.eventBus;
  }


  // ================= INIT =================
  static async initialize() {
    console.log("INIT", {
      isInitialized: this.isInitialized,
      hasSubscription: !!this.nativeSubscription,
    });
    if (this.isInitialized) return;
    this.isInitialized = true;

    await this.loadCache();
    await PendingStorage.load(); // 👈 thêm dòng này

    console.log("✅ NotificationListener initialized:", this.processedSet.size);

    // PHAI attach listener TRUOC khi notifyJSReady, neu khong cac event
    // duoc native flush ra se khong co ai nhan -> mat thong bao da queue
    this.attachNativeListener();

    NotificationModule?.notifyJSReady();
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

  private static isFresh(timestamp: number, maxAgeMs = this.MAX_AGE_MS): boolean {
    return Date.now() - timestamp < maxAgeMs;
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
    pkg?: string,
    maxAgeMs?: number
  ): boolean {
    if (!this.isFresh(timestamp, maxAgeMs)) {
      console.log("⏭️ Skip old notification");
      return false;
    }

    const key = this.getFingerprint(text, timestamp, source, pkg);

    if (this.processedSet.has(key)) {
      console.log("⏭️ Duplicate skipped:", key);
      return false;
    }

    // Check if already in-flight to prevent concurrent processing
    if (this.inFlightSet.has(key)) {
      console.log("⏭️ Already processing:", key);
      return false;
    }

    this.processedSet.add(key);
    this.inFlightSet.add(key);

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

  // Package cua chinh app. Thong bao do app tu ban ra (push tu server khi giao
  // dich duoc tao o web, hoac local notification cua handleIncomingNotification)
  // khong bao gio duoc coi la thong bao ngan hang -> neu khong chan se tao them
  // mot pending trung voi giao dich vua tao.
  private static readonly SELF_PACKAGE =
    Constants.expoConfig?.android?.package ?? "com.smartmoneyfrontend";

  private static isOwnNotification(packageName?: string): boolean {
    const normalized = packageName?.toLowerCase().trim();
    if (!normalized) return false;
    return normalized === this.SELF_PACKAGE.toLowerCase();
  }

  // Package cua cac app ngan hang / vi dien tu VN.
  // Luu y: VCB co package "com.VCB" (khong chua chu "bank") nen phai co "vcb".
  private static FINANCE_PKG_KEYWORDS = [
    "bank", "vcb", "vietcombank", "vietcom", "vietin", "bidv", "agribank",
    "techcom", "tcb", "mbmobile", "mbbank", "mb", "vpbank", "acb",
    "sacombank", "stb", "tpb", "tpbank", "hdbank", "shb", "vib", "msb",
    "ocb", "scb", "seabank", "eximbank", "abbank", "pvcom", "lpbank",
    "lienviet", "namabank", "vietabank", "kienlong", "baoviet", "vikki",
    "cake", "timo", "tnex", "momo", "zalopay", "shopeepay", "viettelmoney",
    "viettelpay", "moca", "pay", "gm",
  ];

  private static FINANCE_TITLE_KEYWORDS = [
    "bank", "vcb", "digibank", "vietcombank", "vietinbank", "bidv",
    "agribank", "techcombank", "mb bank", "mbbank", "vpbank", "acb",
    "sacombank", "tpbank", "hdbank", "shb", "vib", "msb", "ocb", "scb",
    "seabank", "eximbank", "cake", "timo", "momo", "zalopay", "shopeepay",
    "viettel money", "pay", "vietcom", "vietin", "techcom",
    "bien dong so du", "biến động số dư",
  ];

  private static isFinanceApp(packageName?: string, title?: string): boolean {
    const pkg = packageName?.toLowerCase().trim() || "";
    const titleNormalized = title?.toLowerCase() || "";

    return (
      this.FINANCE_PKG_KEYWORDS.some((k) => pkg.includes(k)) ||
      this.FINANCE_TITLE_KEYWORDS.some((k) => titleNormalized.includes(k))
    );
  }

  private static SCORE_THRESHOLD = 35; // Ngưỡng điểm, bạn có thể tăng/giảm để lọc

  private static normalizeVietnamese(text: string): string {
    return text
      .replace(/[−–—﹣]/g, "-")      // normalize minus
      .replace(/[₫]/g, "đ")          // normalize currency
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  // Hàm tính điểm chính
  private static calculateTransactionScore(text: string): number {
    if (!text) return 0;
    const normalized = this.normalizeVietnamese(text);
    let score = 0;

    // 1. CHECK DẤU + / - TRƯỚC SỐ TIỀN (Quan trọng nhất)
    // Bắt các mẫu: -500.000đ, + 2.000.000, -1tr, + 5k, -100,000 VND (VCB)
    const signedMoneyRegex =
      /[-+]\s*\d[\d.,]*\s*(?:₫|đ|d|vnđ|vnd|k|nghin|ngan|tr|trieu)/i;
    if (signedMoneyRegex.test(normalized)) {
      score += 50; // Cộng cực mạnh
    } else if (/[-+]\s*\d{1,3}(?:[.,]\d{3})+(?!\d)/.test(normalized)) {
      // Có dấu +/- và số tiền có phân cách nghìn nhưng KHÔNG có đơn vị tiền
      // (một số bank ghi "GD: -300.000" không kèm VND)
      score += 40;
    }

    // 2. CHECK SỐ TIỀN (không cần dấu)
    if (this.MONEY_REGEX.test(normalized)) {
      score += 10;
    }

    // 2b. "Số tiền GD: 500.000" - có nhãn số tiền dù thiếu đơn vị
    if (/so tien(?:\s*gd)?\s*[:\s]\s*[\d.,]+/.test(normalized)) {
      score += 15;
    }

    // 3. CHECK SỐ TÀI KHOẢN
    if (this.ACCOUNT_REGEX.test(normalized)) {
      score += 10;
    }

    // 4. CHECK TỪ KHÓA GIAO DỊCH (Transaction Keywords)
    const txKeywords = [
      "chuyển", "nhận", "ghi có", "ghi nợ", "thanh toán", "nạp", "rút",
      "số tiền", "chuyển khoản", "trừ tiền", "cộng tiền",
    ];
    let txMatch = 0;
    for (const kw of txKeywords) {
      if (normalized.includes(this.normalizeVietnamese(kw))) {
        txMatch += 1;
      }
    }
    // Từ "giao dịch" vẫn là keyword nhưng bị loãng do quảng cáo, nên điểm thấp hơn
    const hasStrongTxKeyword = txMatch >= 1;
    if (normalized.includes("giao dich")) {
      txMatch += 0.5;
    }
    score += txMatch * 15;

    // Co dong tu giao dich + so tien cu the (vd: "vừa chuyển 250.000đ" cua vi
    // MoMo - khong co dau +/- nen rule 1 khong bat duoc) -> cong them diem
    if (hasStrongTxKeyword && this.MONEY_REGEX.test(normalized)) {
      score += 15;
    }

    // 4b. "Biến động số dư" - cụm đặc trưng của thông báo giao dịch (VCB, ACB...)
    if (normalized.includes("bien dong so du")) {
      score += 25;
    }

    // 4c. Viết tắt kiểu SMS banking: "SD TK", "GD:" (VCB, Vietinbank...)
    if (/\bsd\s*tk\b/.test(normalized) || /\bgd\s*[:.]/.test(normalized)) {
      score += 15;
    }

    // 5. CHECK "SỐ DƯ" (Balance) - điểm thấp hơn vì thường là tra cứu
    if (normalized.includes("so du") || normalized.includes("số dư")) {
      score += 5;
    }

    // 6. 📉 PHẠT QUẢNG CÁO (Promotion / Ads)
    const promoKeywords = ["giảm giá", "giảm", "khuyến mãi", "km", "ưu đãi", "sale", "hoàn tiền", "voucher", "quà tặng", "tặng"];
    let promoMatch = 0;
    for (const kw of promoKeywords) {
      if (normalized.includes(this.normalizeVietnamese(kw))) {
        promoMatch += 1;
      }
    }
    score -= promoMatch * 15;

    // 7. 📉 PHẠT NẶNG ĐẶC BIỆT: "giảm giá cho giao dịch từ X" (case của Agribank)
    if (normalized.includes("giam gia") && normalized.includes("giao dich")) {
      score -= 10; // Phạt thêm để đẩy xuống dưới ngưỡng
    }
    console.log(`📊 Score for "${text.substring(0, 40)}...": ${score}`);
    return score;
  }

  // Hàm này thay thế hàm isTransactionNotification cũ
  private static isTransactionNotification(text: string): boolean {
    if (!text) return false;
    const score = this.calculateTransactionScore(text);
    return score >= this.SCORE_THRESHOLD; // Chỉ true khi đạt ngưỡng
  }

  private static MONEY_REGEX =
    /\d[\d.,]*\s*(?:₫|đ|d|vnđ|vnd|k|nghin|ngan|tr|trieu)/i;

  // Text da qua normalizeVietnamese (bo dau) truoc khi test -> keyword phai khong dau
  private static ACCOUNT_REGEX = /\b(tk|stk|tai khoan|account)\b/i;


  // ================= PRE-PROCESS USER INFO =================

  // Che thong tin nhay cam cua nguoi dung truoc khi gui text len AI server:
  // - So tai khoan sau "TK/STK/tai khoan/account" -> giu 4 so cuoi
  // - Chuoi so dai >= 9 chu so lien tuc khong phai so tien (khong co don vi
  //   tien va khong co phan cach nghin) -> giu 4 so cuoi (SDT, so the...)
  private static sanitizeUserInfo(text: string): string {
    let sanitized = text;

    sanitized = sanitized.replace(
      /((?:s[ốo]\s+)?(?:tk|stk|t[àa]i\s*kho[ảa]n|acc(?:ount)?)\s*[:\s]\s*)(\d{5,})/gi,
      (_m, label, digits) => `${label}***${digits.slice(-4)}`
    );

    sanitized = sanitized.replace(
      /\b(\d{9,})\b(?!\s*(?:₫|đ|d|vn[đd]|k|tr)\b)/gi,
      (_m, digits) => `***${digits.slice(-4)}`
    );

    return sanitized;
  }

  // ================= HANDLERS =================

  static async handleLockScreenNotification(payload: any) {
    try {
      const text = payload?.text || payload?.body || payload?.message || "";
      const timestamp = this.getTimestamp(payload);
      const pkg = payload?.package || "native";
      const title = payload?.title || "";
      // Thong bao duoc native queue lai khi app dong -> nới hạn tuổi
      const isQueued = payload?.queued === true;
      const maxAge = isQueued ? this.QUEUED_MAX_AGE_MS : this.MAX_AGE_MS;

      if (!text) return;

      // 🔥 Chặn thông báo của chính app (tránh double với giao dịch vừa tạo)
      if (this.isOwnNotification(pkg)) {
        console.log("⏭️ Skip own app notification:", pkg);
        return;
      }

      // 🔥 FILTER QUAN TRỌNG
      const isTransaction = this.isTransactionNotification(text);
      const isFinance = this.isFinanceApp(pkg, title);

      if (!isTransaction) {
        console.log("⏭️ Not transaction");
        return;
      }

      if (!isFinance) {
        console.log("⏭️ Not finance app:", pkg);
        return;
      }

      // 🔥 DUPLICATE FILTER
      if (!this.shouldProcess(text, timestamp, "native", pkg, maxAge)) return;

      const nativeDedupKey = `${pkg || "native"}_${this.normalizeText(text)}_${Math.floor(timestamp / this.BUCKET_MS)}`;
      if (DeduplicationService.isDuplicateByKey(nativeDedupKey)) {
        console.log("⏭️ Duplicate notification skipped by dedup key:", nativeDedupKey);
        return;
      }
      DeduplicationService.registerKey(nativeDedupKey);

      console.log(`🚀 Processing ${isQueued ? "queued" : "lockscreen"} notification`);

      try {
        // Dung timestamp cua thong bao (quan trong voi thong bao queue tu hom truoc)
        await this.processAndCreateTransaction(text, timestamp);
      } finally {
        const fp = this.getFingerprint(text, timestamp, "native", pkg);
        this.inFlightSet.delete(fp);
      }

    } catch (e) {
      console.error("❌ LockScreen error:", e);
    }
  }

  // ⚠️ Hien khong duoc goi o dau. Expo foreground notification chi la thong bao
  // cua CHINH app nay, nen neu wire lai ham nay thi moi push "da tao giao dich"
  // tu server se sinh ra mot pending trung lap. Can loc theo data payload cua
  // server truoc khi dung lai.
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

      const foregroundDedupKey = `foreground_${this.normalizeText(text)}_${Math.floor(timestamp / this.BUCKET_MS)}`;
      if (DeduplicationService.isDuplicateByKey(foregroundDedupKey)) {
        console.log("⏭️ Duplicate foreground notification skipped by dedup key:", foregroundDedupKey);
        return;
      }
      DeduplicationService.registerKey(foregroundDedupKey);

      console.log("🚀 Processing foreground notification");

      try {
        await this.processAndCreateTransaction(text);
      } finally {
        const fp = this.getFingerprint(text, timestamp, "foreground");
        this.inFlightSet.delete(fp);
      }

    } catch (e) {
      console.error("❌ Foreground error:", e);
    }
  }

  private static async pollResult(jobId: string, maxAttempts = 12, delay = 5000) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await AIAPI.getResult(jobId);
        if (res?.success && res.data) {
          return { status: "SUCCESS", data: res.data };
        }
      } catch (err: any) {
        if (err?.response?.status !== 404) throw err;
      }
      await new Promise(r => setTimeout(r, delay));
    }
    return { status: "TIMEOUT" };
  }

  // ================= MAIN FLOW =================

  private static async processAndCreateTransaction(rawText: string, timestamp?: number) {
    try {

      // ✅ Create pending FIRST
      const pendingTx = await PendingStorage.add({
        amount: 0,
        category: "OTHER",
        type: "EXPENSE",
        date: new Date(timestamp || Date.now()).toISOString(),
        source: "notification" as const,
      });

      emitStatus(pendingTx.id, 'ai_submitting', undefined);

      // 🔒 Che thong tin nguoi dung (so TK, SDT...) truoc khi gui len AI
      const sanitizedText = this.sanitizeUserInfo(rawText);
      const submitRes = await AIAPI.submitText(sanitizedText);

      if (!submitRes?.success || !submitRes?.data?.jobId) {
        throw new Error("Submit failed: No jobId returned");
      }

      const jobId = submitRes.data.jobId;
      console.log("📨 Submitted to AI server, jobId:", jobId);

      PendingStorage.bindJob(jobId, pendingTx.id);

      // Watchdog: WS miss kết quả thì tự poll / force get, không để kẹt ai_processing
      watchPendingJob(jobId, pendingTx.id);

    } catch (error: any) {
      console.error("❌ Error processing AI result:", error);
      this.eventBus.emit("ai:processing-error", error?.message || "Unknown error");
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