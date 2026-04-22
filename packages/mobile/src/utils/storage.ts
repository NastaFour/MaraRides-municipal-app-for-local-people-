import AsyncStorage from '@react-native-async-storage/async-storage';

export const USER_KEY = '@mototaxi_user';

export const getUser = async () => {
  const data = await AsyncStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const setUser = async (user: any) => {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const removeUser = async () => {
  await AsyncStorage.removeItem(USER_KEY);
};
