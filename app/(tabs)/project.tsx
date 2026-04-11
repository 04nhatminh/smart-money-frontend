import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import ProjectFilterTabs from "../../src/components/projects/ProjectFilterTabs";
import ProjectSummaryCards from "../../src/components/projects/ProjectSummaryCards";
import ProjectCard from "../../src/components/projects/ProjectCard";
import CreateProjectModal from "../../src/components/projects/CreateProjectModal";
import { useProjectList } from "../../src/hooks/useProjectList";
import { projectListStyles as styles } from "../../src/styles/projectListStyles";
import { ProjectListItemResponse } from "../../src/types/project.types";

export default function ProjectScreen() {
  const [openCreateModal, setOpenCreateModal] = useState(false);

  const {
    filteredProjects,
    summary,
    filter,
    search,
    refreshing,
    setFilter,
    setSearch,
    onRefresh,
    fetchProjects,
  } = useProjectList();

  const handlePressProject = (project: ProjectListItemResponse) => {
    router.push(`/(tabs)/project/${project.projectId}` as any);
  };

  const handleMorePress = (project: ProjectListItemResponse) => {
    console.log("Project more:", project.projectId);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={styles.title}>Projects</Text>

          <Pressable
            style={styles.createButton}
            onPress={() => setOpenCreateModal(true)}
          >
            <Text style={styles.createButtonText}>+ Create</Text>
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchBox}>
            <TextInput
              placeholder="Search"
              placeholderTextColor="#C2C2C7"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
          </View>

          <Pressable style={styles.filterIconButton}>
            <Ionicons name="filter-outline" size={24} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <View style={styles.content}>
        <ProjectFilterTabs value={filter} onChange={setFilter} />

        <ProjectSummaryCards
          totalSaved={summary.totalSaved}
          totalAmount={summary.totalAmount}
        />

        <FlatList
          data={filteredProjects}
          keyExtractor={(item) => item.projectId}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => (
            <ProjectCard
              project={item}
              onPress={handlePressProject}
              onMorePress={handleMorePress}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No projects found.</Text>
            </View>
          }
        />
      </View>

      <CreateProjectModal
        visible={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        onCreated={() => {
          setOpenCreateModal(false);
          fetchProjects();
        }}
      />
    </SafeAreaView>
  );
}