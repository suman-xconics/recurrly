import { Feather } from "@expo/vector-icons";
import { clsx } from "clsx";
import { Link } from "expo-router";
import { styled } from "nativewind";
import { ReactNode, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputProps,
  View,
} from "react-native";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

type AuthShellProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <SafeAreaView className="auth-safe-area">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="auth-screen"
      >
        <ScrollView
          className="auth-scroll"
          contentContainerClassName="auth-content"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="auth-brand-block">
            <View className="auth-logo-wrap">
              <View className="auth-logo-mark">
                <Text className="auth-logo-mark-text">R</Text>
              </View>
              <View>
                <Text className="auth-wordmark">Recurly</Text>
                <Text className="auth-wordmark-sub">Smart billing</Text>
              </View>
            </View>

            <Text className="auth-title">{title}</Text>
            <Text className="auth-subtitle">{subtitle}</Text>
          </View>

          <View className="auth-card">{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

type AuthFieldProps = TextInputProps & {
  error?: string;
  label: string;
  revealable?: boolean;
};

export function AuthField({ error, label, revealable, secureTextEntry, ...props }: AuthFieldProps) {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const canReveal = revealable || secureTextEntry;

  return (
    <View className="auth-field">
      <Text className="auth-label">{label}</Text>
      <View className={clsx("auth-input-wrap", error && "auth-input-error")}>
        <TextInput
          {...props}
          className={clsx("auth-input", canReveal && "auth-input-with-action")}
          placeholderTextColor="rgba(8, 17, 38, 0.45)"
          secureTextEntry={canReveal ? !passwordVisible : secureTextEntry}
        />
        {canReveal ? (
          <Pressable
            accessibilityLabel={passwordVisible ? "Hide password" : "Show password"}
            accessibilityRole="button"
            className="auth-password-toggle"
            hitSlop={8}
            onPress={() => setPasswordVisible((visible) => !visible)}
          >
            <Feather color="#081126" name={passwordVisible ? "eye-off" : "eye"} size={20} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text className="auth-error">{error}</Text> : null}
    </View>
  );
}

type AuthButtonProps = {
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
  title: string;
};

export function AuthButton({ disabled, loading, onPress, title }: AuthButtonProps) {
  return (
    <Pressable
      className={clsx("auth-button", disabled && "auth-button-disabled")}
      disabled={disabled}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="#081126" />
      ) : (
        <Text className="auth-button-text">{title}</Text>
      )}
    </Pressable>
  );
}

type AuthFooterLinkProps = {
  copy: string;
  href: "/(auth)/sign-in" | "/(auth)/sign-up";
  label: string;
};

export function AuthFooterLink({ copy, href, label }: AuthFooterLinkProps) {
  return (
    <View className="auth-link-row">
      <Text className="auth-link-copy">{copy}</Text>
      <Link href={href} asChild>
        <Pressable>
          <Text className="auth-link">{label}</Text>
        </Pressable>
      </Link>
    </View>
  );
}

export function AuthFormError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <Text className="auth-form-error">{message}</Text>;
}
