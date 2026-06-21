import AsyncStorage from '@react-native-async-storage/async-storage';

const GROUPS_KEY = 'KNOWN_GROUP_IDS';
const GROUP_PROJECTS_KEY = 'GROUP_PROJECT_MAP'; // { [groupId]: groupProjectId }

export const groupStorage = {
  async getIds(): Promise<string[]> {
    try {
      const json = await AsyncStorage.getItem(GROUPS_KEY);
      return json ? JSON.parse(json) : [];
    } catch {
      return [];
    }
  },

  async addId(id: string): Promise<void> {
    try {
      const ids = await groupStorage.getIds();
      if (!ids.includes(id)) {
        await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify([...ids, id]));
      }
    } catch {}
  },

  async removeId(id: string): Promise<void> {
    try {
      const ids = await groupStorage.getIds();
      await AsyncStorage.setItem(GROUPS_KEY, JSON.stringify(ids.filter((i) => i !== id)));
    } catch {}
  },

  async setGroupProject(groupId: string, groupProjectId: string): Promise<void> {
    try {
      const json = await AsyncStorage.getItem(GROUP_PROJECTS_KEY);
      const map: Record<string, string> = json ? JSON.parse(json) : {};
      map[groupId] = groupProjectId;
      await AsyncStorage.setItem(GROUP_PROJECTS_KEY, JSON.stringify(map));
    } catch {}
  },

  async getGroupProjectId(groupId: string): Promise<string | null> {
    try {
      const json = await AsyncStorage.getItem(GROUP_PROJECTS_KEY);
      const map: Record<string, string> = json ? JSON.parse(json) : {};
      return map[groupId] ?? null;
    } catch {
      return null;
    }
  },
};
