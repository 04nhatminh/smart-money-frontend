// import React, { useEffect, useRef, useState } from "react";
// import {
//   ActivityIndicator,
//   Modal,
//   Pressable,
//   StyleSheet,
//   Text,
//   View,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from "expo-linear-gradient";
// import { BudgetAllocationApi } from "../../api/budgetAllocation.api";
// import {
//   GenerateBudgetAllocationPayload,
//   UserFinancialProfileData,
// } from "../../types/budget_allocation.types";
// import { useAuth } from "../../context/AuthContext";
// import { t } from "../../i18n";

// type Status = "saving" | "error";

// type Props = {
//   visible: boolean;
//   payload: GenerateBudgetAllocationPayload | null;
//   onClose: () => void;
//   onSaved: (profile: UserFinancialProfileData) => void;
// };

// export default function CreateBudgetAllocationModal({
//   visible,
//   payload,
//   onClose,
//   onSaved,
// }: Props) {
//   const { refreshUser } = useAuth();
//   const [status, setStatus] = useState<Status>("saving");
//   const [errorMessage, setErrorMessage] = useState("");
//   const mountedRef = useRef(true);

//   useEffect(() => {
//     mountedRef.current = true;
//     return () => {
//       mountedRef.current = false;
//     };
//   }, []);

//   useEffect(() => {
//     if (visible && payload) {
//       saveProfile(payload);
//     }
//   }, [visible]);

//   const saveProfile = async (p: GenerateBudgetAllocationPayload) => {
//     if (!mountedRef.current) return;
//     setStatus("saving");
//     setErrorMessage("");

//     try {
//       const res = await BudgetAllocationApi.createUserFinancialProfile(p);
//       if (!mountedRef.current) return;

//       if (res.success && res.data) {
//         await refreshUser();
//         if (!mountedRef.current) return;
//         onSaved(res.data);
//       } else {
//         setStatus("error");
//         setErrorMessage(res.message || t("project.failed_save_budget_allocation"));
//       }
//     } catch (err: any) {
//       if (!mountedRef.current) return;
//       setStatus("error");
//       setErrorMessage(err?.message ?? t("project.unexpected_error"));
//     }
//   };

//   const handleRetry = () => {
//     if (payload) saveProfile(payload);
//   };

//   const renderCloseBtn = () => (
//     <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={12}>
//       <Ionicons name="close" size={20} color="#6B7280" />
//     </Pressable>
//   );

//   return (
//     <Modal visible={visible} animationType="fade" transparent>
//       <View style={styles.overlay}>
//         <View style={styles.card}>
//           {status === "saving" && (
//             <>
//               {renderCloseBtn()}
//               <View style={styles.loadingIconBox}>
//                 <ActivityIndicator size="large" color="#4B3FD6" />
//               </View>
//               <Text style={styles.title}>{t("project.saving_profile")}</Text>
//               <Text style={styles.body}>
//                 {t("project.saving_your_financial_profile_please_wait")}
//               </Text>
//             </>
//           )}

//           {status === "error" && (
//             <>
//               {renderCloseBtn()}
//               <View style={styles.errorIconBox}>
//                 <Ionicons name="alert-circle" size={30} color="#EF4444" />
//               </View>
//               <Text style={styles.title}>{t("project.save_failed")}</Text>
//               <View style={styles.errorBanner}>
//                 <Ionicons name="warning" size={15} color="#B91C1C" />
//                 <Text style={styles.errorBannerText}>
//                   {errorMessage || t("project.failed_save_budget_allocation")}
//                 </Text>
//               </View>
//               <View style={styles.actionRow}>
//                 <Pressable style={styles.secondaryBtn} onPress={onClose}>
//                   <Text style={styles.secondaryBtnText}>
//                     {t("project.cancel")}
//                   </Text>
//                 </Pressable>
//                 <Pressable style={styles.fullBtn} onPress={handleRetry}>
//                   <LinearGradient
//                     colors={["#3629B7", "#5655B9"]}
//                     start={{ x: 0, y: 0 }}
//                     end={{ x: 1, y: 1 }}
//                     style={styles.gradientInner}
//                   >
//                     <Text style={styles.primaryBtnText}>
//                       {t("project.try_again")}
//                     </Text>
//                   </LinearGradient>
//                 </Pressable>
//               </View>
//             </>
//           )}
//         </View>
//       </View>
//     </Modal>
//   );
// }

// const styles = StyleSheet.create({
//   overlay: {
//     flex: 1,
//     backgroundColor: "rgba(0,0,0,0.4)",
//     alignItems: "center",
//     justifyContent: "center",
//     padding: 24,
//   },
//   card: {
//     backgroundColor: "#FFFFFF",
//     borderRadius: 24,
//     padding: 28,
//     width: "100%",
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0.12,
//     shadowRadius: 16,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 6,
//   },
//   closeBtn: {
//     position: "absolute",
//     top: 16,
//     right: 16,
//     width: 32,
//     height: 32,
//     borderRadius: 16,
//     backgroundColor: "#F3F4F6",
//     alignItems: "center",
//     justifyContent: "center",
//     zIndex: 10,
//   },
//   loadingIconBox: {
//     width: 72,
//     height: 72,
//     borderRadius: 36,
//     backgroundColor: "#F5F3FF",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 16,
//     marginTop: 8,
//   },
//   errorIconBox: {
//     width: 72,
//     height: 72,
//     borderRadius: 36,
//     backgroundColor: "#FEE2E2",
//     alignItems: "center",
//     justifyContent: "center",
//     marginBottom: 16,
//     marginTop: 8,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: "700",
//     color: "#111827",
//     marginBottom: 12,
//     textAlign: "center",
//   },
//   body: {
//     fontSize: 14,
//     color: "#6B7280",
//     lineHeight: 20,
//     textAlign: "center",
//   },
//   errorBanner: {
//     flexDirection: "row",
//     alignItems: "center",
//     gap: 6,
//     backgroundColor: "#FEE2E2",
//     borderRadius: 10,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     marginBottom: 16,
//     width: "100%",
//   },
//   errorBannerText: {
//     fontSize: 13,
//     color: "#B91C1C",
//     fontWeight: "600",
//     flex: 1,
//   },
//   fullBtn: {
//     flex: 1,
//     borderRadius: 25,
//     overflow: "hidden",
//   },
//   gradientInner: {
//     height: 48,
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   primaryBtnText: {
//     color: "#FFFFFF",
//     fontWeight: "600",
//     fontSize: 15,
//     letterSpacing: 0.5,
//   },
//   secondaryBtn: {
//     flex: 1,
//     height: 48,
//     borderRadius: 25,
//     backgroundColor: "#E9E9EF",
//     alignItems: "center",
//     justifyContent: "center",
//   },
//   secondaryBtnText: {
//     color: "#1F2937",
//     fontWeight: "600",
//     fontSize: 15,
//   },
//   actionRow: {
//     flexDirection: "row",
//     gap: 12,
//     width: "100%",
//   },
// });
