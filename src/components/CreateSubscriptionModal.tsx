import { icons } from "@/constants/icons";
import { clsx } from "clsx";
import dayjs from "dayjs";
import { usePostHog } from "posthog-react-native";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

type Frequency = "Monthly" | "Yearly";

type CreateSubscriptionModalProps = {
  visible: boolean;
  onClose: () => void;
  onCreate: (subscription: Subscription) => void;
};

const CATEGORY_OPTIONS = [
  "Entertainment",
  "AI Tools",
  "Developer Tools",
  "Design",
  "Productivity",
  "Cloud",
  "Music",
  "Other",
] as const;

const CATEGORY_COLORS: Record<(typeof CATEGORY_OPTIONS)[number], string> = {
  Entertainment: "#f5c542",
  "AI Tools": "#b8d4e3",
  "Developer Tools": "#e8def8",
  Design: "#b8e8d0",
  Productivity: "#f7c8a6",
  Cloud: "#c7ddff",
  Music: "#8fd1bd",
  Other: "#f6eecf",
};

const getRenewalDate = (frequency: Frequency) => {
  const unit = frequency === "Monthly" ? "month" : "year";
  return dayjs().add(1, unit).toISOString();
};

const CreateSubscriptionModal = ({
  visible,
  onClose,
  onCreate,
}: CreateSubscriptionModalProps) => {
  const posthog = usePostHog();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Monthly");
  const [category, setCategory] =
    useState<(typeof CATEGORY_OPTIONS)[number]>("Entertainment");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const parsedPrice = useMemo(() => Number(price.replace(",", ".")), [price]);
  const hasValidName = name.trim().length > 0;
  const hasValidPrice = Number.isFinite(parsedPrice) && parsedPrice > 0;
  const isSubmitDisabled = !hasValidName || !hasValidPrice;

  const resetForm = () => {
    setName("");
    setPrice("");
    setFrequency("Monthly");
    setCategory("Entertainment");
    setHasSubmitted(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = () => {
    setHasSubmitted(true);

    if (isSubmitDisabled) {
      return;
    }

    const createdAt = dayjs();
    const subscription: Subscription = {
      id: `${name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}-${createdAt.valueOf()}`,
      name: name.trim(),
      price: parsedPrice,
      frequency,
      category,
      status: "active",
      startDate: createdAt.toISOString(),
      renewalDate: getRenewalDate(frequency),
      icon: icons.wallet,
      billing: frequency,
      currency: "USD",
      color: CATEGORY_COLORS[category],
    };

    onCreate(subscription);
    posthog.capture("subscription_creation_activity", {
      action: "created",
      source: "create_subscription_modal",
      subscription_id: subscription.id,
      subscription_name: subscription.name,
      price: subscription.price,
      currency: subscription.currency ?? "USD",
      frequency: subscription.frequency ?? frequency,
      billing: subscription.billing,
      category: subscription.category ?? "Other",
      status: subscription.status ?? "active",
      renewal_date: subscription.renewalDate ?? "",
    });
    resetForm();
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="modal-overlay"
      >
        <View className="modal-container">
          <View className="modal-header">
            <Text className="modal-title">New Subscription</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close new subscription form"
              className="modal-close"
              onPress={handleClose}
            >
              <Text className="modal-close-text">×</Text>
            </Pressable>
          </View>

          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="modal-body">
              <View className="auth-field">
                <Text className="auth-label">Name</Text>
                <View
                  className={clsx(
                    "auth-input-wrap",
                    hasSubmitted && !hasValidName && "auth-input-error",
                  )}
                >
                  <TextInput
                    autoCapitalize="words"
                    autoCorrect={false}
                    className="auth-input"
                    onChangeText={setName}
                    placeholder="Subscription name"
                    placeholderTextColor="rgba(8, 17, 38, 0.45)"
                    returnKeyType="next"
                    value={name}
                  />
                </View>
                {hasSubmitted && !hasValidName ? (
                  <Text className="auth-error">Enter a subscription name.</Text>
                ) : null}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Price</Text>
                <View
                  className={clsx(
                    "auth-input-wrap",
                    hasSubmitted && !hasValidPrice && "auth-input-error",
                  )}
                >
                  <TextInput
                    className="auth-input"
                    keyboardType="decimal-pad"
                    onChangeText={setPrice}
                    placeholder="0.00"
                    placeholderTextColor="rgba(8, 17, 38, 0.45)"
                    returnKeyType="done"
                    value={price}
                  />
                </View>
                {hasSubmitted && !hasValidPrice ? (
                  <Text className="auth-error">Enter a positive price.</Text>
                ) : null}
              </View>

              <View className="auth-field">
                <Text className="auth-label">Frequency</Text>
                <View className="picker-row">
                  {(["Monthly", "Yearly"] as const).map((option) => {
                    const isActive = frequency === option;

                    return (
                      <Pressable
                        key={option}
                        className={clsx(
                          "picker-option",
                          isActive && "picker-option-active",
                        )}
                        onPress={() => setFrequency(option)}
                      >
                        <Text
                          className={clsx(
                            "picker-option-text",
                            isActive && "picker-option-text-active",
                          )}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <View className="auth-field">
                <Text className="auth-label">Category</Text>
                <View className="category-scroll">
                  {CATEGORY_OPTIONS.map((option) => {
                    const isActive = category === option;

                    return (
                      <Pressable
                        key={option}
                        className={clsx(
                          "category-chip",
                          isActive && "category-chip-active",
                        )}
                        onPress={() => setCategory(option)}
                      >
                        <Text
                          className={clsx(
                            "category-chip-text",
                            isActive && "category-chip-text-active",
                          )}
                        >
                          {option}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                className={clsx(
                  "auth-button",
                  isSubmitDisabled && "auth-button-disabled",
                )}
                accessibilityState={{ disabled: isSubmitDisabled }}
                onPress={handleSubmit}
              >
                <Text className="auth-button-text">Create subscription</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default CreateSubscriptionModal;
