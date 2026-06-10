import React, { useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import BudgetAllocationSuggestionStep from "../../src/components/projects/BudgetAllocationSuggestionStep";
import SetupFinancialProfileModal from "../../src/components/projects/SetupFinancialProfileModal";
import CreateBudgetAllocationModal from "../../src/components/projects/CreateBudgetAllocationModal";
import FinancialProfileDisplayStep from "../../src/components/projects/FinancialProfileDisplayStep";
import { BudgetAllocationApi } from "../../src/api/budgetAllocation.api";
import { GenerateBudgetAllocationPayload, UserFinancialProfileData } from "../../src/types/budget_allocation.types";

export default function BudgetAllocationPage() {
    const router = useRouter();

    const [profileCheckLoading, setProfileCheckLoading] = useState(false);
    const [showSetupProfile, setShowSetupProfile] = useState(false);
    const [showGeneration, setShowGeneration] = useState(false);
    const [showProfileDisplay, setShowProfileDisplay] = useState(false);
    const [budgetPayload, setBudgetPayload] = useState<GenerateBudgetAllocationPayload | null>(null);
    const [profileDisplayData, setProfileDisplayData] = useState<UserFinancialProfileData | null>(null);

    const handleCreate = async () => {
        try {
            setProfileCheckLoading(true);
            const res = await BudgetAllocationApi.getUserFinancialProfile();

            if (res.success && res.data) {
                // Profile already exists — show it directly
                setProfileDisplayData(res.data);
                setShowProfileDisplay(true);
            } else {
                // No profile — let the user fill in the form
                setShowSetupProfile(true);
            }
        } finally {
            setProfileCheckLoading(false);
        }
    };

    const handleProfileSubmit = (payload: GenerateBudgetAllocationPayload) => {
        setShowSetupProfile(false);
        setBudgetPayload(payload);
        setShowGeneration(true);
    };

    const handleGenerationSaved = (profile: UserFinancialProfileData) => {
        setShowGeneration(false);
        setProfileDisplayData(profile);
        setShowProfileDisplay(true);
    };

    const handleGenerationClose = () => {
        setShowGeneration(false);
        router.back();
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Budget Allocation</Text>
                <View style={{ width: 40 }} />
            </View>

            <View style={styles.content}>
                {showProfileDisplay && profileDisplayData ? (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <FinancialProfileDisplayStep
                            profile={profileDisplayData}
                            loading={false}
                        />
                    </ScrollView>
                ) : (
                    <BudgetAllocationSuggestionStep
                        loading={profileCheckLoading}
                        onSkip={() => router.back()}
                        onCreate={handleCreate}
                    />
                )}
            </View>

            <SetupFinancialProfileModal
                visible={showSetupProfile}
                onClose={() => setShowSetupProfile(false)}
                onSubmit={handleProfileSubmit}
            />

            <CreateBudgetAllocationModal
                visible={showGeneration}
                payload={budgetPayload}
                onClose={handleGenerationClose}
                onSaved={handleGenerationSaved}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F9FA",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#F0F0F0",
        marginTop: 10,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: "#F5F5F5",
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "700",
        color: "#333",
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 12,
    },
});
