import { useCallback, useEffect, useMemo, useState } from "react";
import { ProjectAPI } from "../api/project.api";
import { ProjectListItemResponse, ProjectFilterType, ProjectStatusFilter } from "../types/project.types";
import {
    calculateSummary,
    filterProjects
} from "../utils/project";

export function useProjectList() {
    const [projects, setProjects] = useState<ProjectListItemResponse[]>([]);
    const [filter, setFilter] = useState<ProjectFilterType>("ALL");
    const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("ALL");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const fetchProjects = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) {
                setRefreshing(true);
            } else {
                setLoading(true);
            }
            const response = await ProjectAPI.getAll();

            if (response?.success && response.data) {
                setProjects(response.data); 
            } else {
                setProjects([]);
            }
        } catch (error) {
            console.error("Failed to fetch projects:", error);
            setProjects([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchProjects();
    }, [fetchProjects]);

    const filteredProjects = useMemo(() => {
        return filterProjects(projects, filter, search, statusFilter);
    }, [projects, filter, search, statusFilter]);

    const summary = useMemo(() => {
        return calculateSummary(filteredProjects);
    }, [filteredProjects]);

    return {
        projects,
        filteredProjects,
        summary,
        filter,
        statusFilter,
        search,
        loading,
        refreshing,
        setFilter,
        setStatusFilter,
        setSearch,
        fetchProjects,
        onRefresh: () => fetchProjects(true)
    };
}