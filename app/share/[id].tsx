import React from 'react';
import { Redirect, useLocalSearchParams } from 'expo-router';

export default function ShareScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={id ? (`/devotional/${id}` as any) : '/(tabs)/journal'} />;
}
