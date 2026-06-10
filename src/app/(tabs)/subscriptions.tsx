import { Feather } from "@expo/vector-icons";
import SubscriptionCard from "@/components/subscription-card";
import { HOME_SUBSCRIPTIONS } from "@/constants/data";
import { styled } from "nativewind";
import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, Text, TextInput, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";
const SafeAreaView = styled(RNSafeAreaView);


const Subscriptions = () => {
  const [searchText, setSearchText] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [expandedSubscriptionId, setExpandedSubscriptionId] = useState<string | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchText);
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchText]);

  useEffect(() => {
    setExpandedSubscriptionId(null);
  }, [debouncedQuery]);

  const filteredSubscriptions = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    if (!normalizedQuery) {
      return HOME_SUBSCRIPTIONS;
    }

    return HOME_SUBSCRIPTIONS.filter((subscription) => {
      const searchableText = [
        subscription.name,
        subscription.plan,
        subscription.category,
        subscription.paymentMethod,
        subscription.status,
        subscription.billing,
        subscription.currency,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(normalizedQuery);
    });
  }, [debouncedQuery]);

  const listHeader = (
    <View className="mb-5 gap-4">
      <View>
        <Text className="text-3xl font-sans-bold text-primary">Subscriptions</Text>
        <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
          Search by name, category, plan, payment, or status.
        </Text>
      </View>

      <View className="min-h-14 flex-row items-center rounded-2xl border border-border bg-card px-4">
        <Feather name="search" size={20} color="rgba(8, 17, 38, 0.55)" />
        <TextInput
          autoCapitalize="none"
          autoCorrect={false}
          className="ml-3 flex-1 py-4 text-base font-sans-medium text-primary"
          onChangeText={setSearchText}
          placeholder="Search subscriptions"
          placeholderTextColor="rgba(8, 17, 38, 0.45)"
          returnKeyType="search"
          value={searchText}
        />
        {searchText ? (
          <Text
            className="pl-3 text-sm font-sans-bold text-accent"
            onPress={() => {
              setSearchText('');
              setDebouncedQuery('');
              setExpandedSubscriptionId(null);
            }}
          >
            Clear
          </Text>
        ) : null}
      </View>

      <Text className="text-sm font-sans-semibold text-muted-foreground">
        {filteredSubscriptions.length} of {HOME_SUBSCRIPTIONS.length} subscriptions
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <FlatList
        data={filteredSubscriptions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <SubscriptionCard
            expanded={expandedSubscriptionId === item.id}
            onPress={() =>
              setExpandedSubscriptionId((currentId) => currentId === item.id ? null : item.id)
            }
            {...item}
          />
        )}
        showsVerticalScrollIndicator={false}
        extraData={expandedSubscriptionId}
        ItemSeparatorComponent={() => <View className="h-3" />}
        contentContainerClassName="pb-28"
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={listHeader}
        ListEmptyComponent={() => (
          <View className="rounded-2xl border border-border bg-card p-5">
            <Text className="text-lg font-sans-bold text-primary">No matches found</Text>
            <Text className="mt-2 text-sm font-sans-medium text-muted-foreground">
              Try searching for a service, category, plan, card, or status.
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

export default Subscriptions;
