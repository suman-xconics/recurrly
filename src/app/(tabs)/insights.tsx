import { HOME_SUBSCRIPTIONS } from "@/constants/data";
import { colors } from "@/constants/theme";
import { formatCurrency } from "@/lib/utils";
import dayjs from "dayjs";
import { styled } from "nativewind";
import React, { useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { BarChart, type barDataItem } from "react-native-gifted-charts";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const categoryColors: Record<string, string> = {
  Design: "#8fd1bd",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Entertainment: "#f5c542",
  Productivity: "#f7c8a6",
  Cloud: "#c7ddff",
  Music: "#b8e8d0",
  Other: "#ea7a53",
};

const shortCategoryLabels: Record<string, string> = {
  "AI Tools": "AI",
  "Developer Tools": "Dev",
  Entertainment: "Fun",
  Productivity: "Prod",
};

const monthlyValue = (subscription: Subscription) => {
  return subscription.billing === "Yearly"
    ? subscription.price / 12
    : subscription.price;
};

const getCategoryLabel = (category?: string) => {
  const normalizedCategory = category?.trim() || "Other";
  return shortCategoryLabels[normalizedCategory] ?? normalizedCategory.slice(0, 4);
};

const Insights = () => {
  const [chartContainerWidth, setChartContainerWidth] = useState(0);

  const insights = useMemo(() => {
    const activeSubscriptions = HOME_SUBSCRIPTIONS.filter(
      (subscription) => subscription.status === "active",
    );
    const monitoredSubscriptions = HOME_SUBSCRIPTIONS.filter(
      (subscription) => subscription.status !== "cancelled",
    );

    const monthlySpend = activeSubscriptions.reduce(
      (total, subscription) => total + monthlyValue(subscription),
      0,
    );
    const yearlyExposure = activeSubscriptions.reduce(
      (total, subscription) =>
        total + (subscription.billing === "Yearly" ? subscription.price : subscription.price * 12),
      0,
    );

    const categoryTotals = monitoredSubscriptions.reduce<Record<string, number>>(
      (totals, subscription) => {
        const category = subscription.category?.trim() || "Other";
        totals[category] = (totals[category] ?? 0) + monthlyValue(subscription);
        return totals;
      },
      {},
    );

    const chartData = Object.entries(categoryTotals)
      .sort(([, firstValue], [, secondValue]) => secondValue - firstValue)
      .map<barDataItem>(([category, value]) => ({
        value: Number(value.toFixed(2)),
        label: getCategoryLabel(category),
        frontColor: categoryColors[category] ?? categoryColors.Other,
        topLabelComponent: () => (
          <Text className="text-[10px] font-sans-bold text-primary">
            {formatCurrency(value).replace(".00", "")}
          </Text>
        ),
      }));

    const nextRenewal = monitoredSubscriptions
      .map((subscription) => ({
        ...subscription,
        renewal: dayjs(subscription.renewalDate),
      }))
      .filter((subscription) => subscription.renewal.isValid())
      .sort((first, second) => first.renewal.valueOf() - second.renewal.valueOf())[0];

    const statusCounts = HOME_SUBSCRIPTIONS.reduce<Record<string, number>>((counts, subscription) => {
      const status = subscription.status ?? "unknown";
      counts[status] = (counts[status] ?? 0) + 1;
      return counts;
    }, {});

    return {
      activeCount: activeSubscriptions.length,
      chartData,
      monthlySpend,
      nextRenewal,
      statusCounts,
      yearlyExposure,
    };
  }, []);

  const maxChartValue = Math.max(
    100,
    Math.ceil(Math.max(...insights.chartData.map((item) => item.value ?? 0)) / 25) * 25,
  );
  const chartWidth = Math.max(chartContainerWidth, 260);

  return (
    <SafeAreaView className="flex-1 bg-background p-5">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-5 pb-28"
        showsVerticalScrollIndicator={false}
      >
        <View>
          <Text className="text-3xl font-sans-bold text-primary">Insights</Text>
          <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
            Spend, renewal pressure, and category concentration.
          </Text>
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 rounded-2xl border border-border bg-card p-4">
            <Text className="text-xs font-sans-semibold uppercase text-muted-foreground">
              Monthly
            </Text>
            <Text className="mt-2 text-2xl font-sans-bold text-primary">
              {formatCurrency(insights.monthlySpend)}
            </Text>
          </View>
          <View className="flex-1 rounded-2xl border border-border bg-card p-4">
            <Text className="text-xs font-sans-semibold uppercase text-muted-foreground">
              Yearly
            </Text>
            <Text className="mt-2 text-2xl font-sans-bold text-primary">
              {formatCurrency(insights.yearlyExposure)}
            </Text>
          </View>
        </View>

        <View
          className="overflow-hidden rounded-3xl border border-border bg-card p-5"
        >
          <View className="mb-5 flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="text-xl font-sans-bold text-primary">
                Spend by category
              </Text>
              <Text className="mt-1 text-sm font-sans-medium text-muted-foreground">
                Monthly equivalent across tracked subscriptions.
              </Text>
            </View>
            <View className="rounded-full bg-accent/10 px-3 py-1">
              <Text className="text-xs font-sans-bold text-accent">
                {insights.activeCount} active
              </Text>
            </View>
          </View>

          <View
            className="mt-2"
            onLayout={(event) => {
              setChartContainerWidth(event.nativeEvent.layout.width);
            }}
          >
            {chartContainerWidth > 0 ? (
              <BarChart
                adjustToWidth
                barBorderRadius={10}
                data={insights.chartData}
                disableScroll
                frontColor={colors.accent}
                height={180}
                hideRules={false}
                isAnimated
                labelWidth={54}
                maxValue={maxChartValue}
                noOfSections={4}
                parentWidth={chartWidth}
                rulesColor="rgba(8, 17, 38, 0.08)"
                rulesType="solid"
                spacing={18}
                xAxisColor="rgba(8, 17, 38, 0.14)"
                xAxisLabelTextStyle={{
                  color: "rgba(8, 17, 38, 0.58)",
                  fontFamily: "sans-semibold",
                  fontSize: 11,
                }}
                xAxisThickness={1}
                yAxisColor="transparent"
                yAxisLabelPrefix="$"
                yAxisLabelWidth={36}
                yAxisTextStyle={{
                  color: "rgba(8, 17, 38, 0.5)",
                  fontFamily: "sans-medium",
                  fontSize: 11,
                }}
                yAxisThickness={0}
              />
            ) : null}
          </View>
        </View>

        <View className="rounded-3xl border border-border bg-card p-5">
          <Text className="text-xl font-sans-bold text-primary">Renewal watch</Text>
          <View className="mt-4 gap-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-sans-semibold text-muted-foreground">
                Next tracked renewal
              </Text>
              <Text className="text-sm font-sans-bold text-primary">
                {insights.nextRenewal
                  ? dayjs(insights.nextRenewal.renewalDate).format("MMM D")
                  : "None"}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-sans-semibold text-muted-foreground">
                Active subscriptions
              </Text>
              <Text className="text-sm font-sans-bold text-primary">
                {insights.statusCounts.active ?? 0}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-sans-semibold text-muted-foreground">
                Paused subscriptions
              </Text>
              <Text className="text-sm font-sans-bold text-primary">
                {insights.statusCounts.paused ?? 0}
              </Text>
            </View>
          </View>
        </View>

        <View className="rounded-3xl bg-accent p-5">
          <Text className="text-lg font-sans-bold text-background">
            {insights.nextRenewal
              ? `${insights.nextRenewal.name} is the next renewal to review.`
              : "Your renewal calendar is quiet."}
          </Text>
          <Text className="mt-2 text-sm font-sans-semibold text-background/80">
            Keep yearly plans normalized to monthly spend before comparing categories.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Insights;
