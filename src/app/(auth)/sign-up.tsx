import { useSignUp } from "@clerk/expo";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import { usePostHog } from "posthog-react-native";
import { Pressable, Text, View } from "react-native";
import {
  AuthButton,
  AuthField,
  AuthFooterLink,
  AuthFormError,
  AuthShell,
} from "@/components/auth/auth-shell";
import { AuthFieldErrors, friendlyAuthError } from "@/lib/auth-errors";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignUpScreen() {
  const { fetchStatus, signUp } = useSignUp();
  const posthog = usePostHog();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [loading, setLoading] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const busy = loading || fetchStatus === "fetching";

  const validate = () => {
    const nextErrors: AuthFieldErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Enter your name.";
    }

    if (!normalizedEmail) {
      nextErrors.email = "Enter the email you want to use.";
    } else if (!emailPattern.test(normalizedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }

    return nextErrors;
  };

  const onSubmit = async () => {
    if (!signUp) {
      return;
    }

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const [firstName, ...rest] = name.trim().split(/\s+/);

      const result = await signUp.password({
        emailAddress: normalizedEmail,
        password,
        firstName,
        lastName: rest.join(" ") || undefined,
      });

      if (result.error) {
        setErrors(friendlyAuthError(result.error));
        return;
      }

      if (signUp.status === "complete") {
        const finalizeResult = await signUp.finalize();
        if (finalizeResult.error) {
          setErrors(friendlyAuthError(finalizeResult.error));
          return;
        }
        router.replace("/(tabs)");
        return;
      }

      const sendResult = await signUp.verifications.sendEmailCode();
      if (sendResult.error) {
        setErrors(friendlyAuthError(sendResult.error));
        return;
      }

      setPendingVerification(true);
    } catch (error) {
      setErrors(friendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (!signUp) {
      return;
    }

    if (code.trim().length < 6) {
      setErrors({ code: "Enter the 6-digit code sent to your inbox." });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });

      if (result.error) {
        setErrors(friendlyAuthError(result.error));
        return;
      }

      if (signUp.status === "complete") {
        const finalizeResult = await signUp.finalize();
        if (finalizeResult.error) {
          setErrors(friendlyAuthError(finalizeResult.error));
          return;
        }
        posthog.identify(normalizedEmail, {
          $set: { email: normalizedEmail, name: name.trim() },
          $set_once: { signup_date: new Date().toISOString() },
        });
        posthog.capture('user_signed_up', { method: 'email' });
        router.replace("/(tabs)");
        return;
      }

      setErrors({
        form: "We need a little more information before finishing your account.",
      });
    } catch (error) {
      setErrors(friendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!signUp) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await signUp.verifications.sendEmailCode();
      if (result.error) {
        setErrors(friendlyAuthError(result.error));
      }
    } catch (error) {
      setErrors(friendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  if (pendingVerification) {
    return (
      <AuthShell
        title="Verify your email"
        subtitle={`Enter the code sent to ${normalizedEmail} to protect your subscription data.`}
      >
        <View className="auth-form">
          <AuthField
            autoCapitalize="none"
            error={errors.code}
            keyboardType="number-pad"
            label="Email code"
            maxLength={6}
            onChangeText={setCode}
            placeholder="Enter 6-digit code"
            value={code}
          />
          <AuthFormError message={errors.form} />
          <AuthButton
            disabled={busy || code.trim().length < 6}
            loading={busy}
            onPress={onVerify}
            title="Verify email"
          />
          <Pressable className="auth-secondary-button" disabled={busy} onPress={resendCode}>
            <Text className="auth-secondary-button-text">Send a new code</Text>
          </Pressable>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create account"
      subtitle="Start tracking renewals, spend, and billing risk in one quiet place."
    >
      <View className="auth-form">
        <AuthField
          autoCapitalize="words"
          autoComplete="name"
          error={errors.name}
          label="Name"
          onChangeText={setName}
          placeholder="Enter your name"
          textContentType="name"
          value={name}
        />
        <AuthField
          autoCapitalize="none"
          autoComplete="email"
          error={errors.email}
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="Enter your email"
          textContentType="emailAddress"
          value={email}
        />
        <AuthField
          autoCapitalize="none"
          autoComplete="new-password"
          error={errors.password}
          label="Password"
          onChangeText={setPassword}
          placeholder="Create a secure password"
          secureTextEntry
          textContentType="newPassword"
          value={password}
        />
        <Text className="auth-helper">
          Your account keeps renewal alerts and billing details private to you.
        </Text>
        <AuthFormError message={errors.form} />
        <AuthButton
          disabled={busy || !name || !email || !password}
          loading={busy}
          onPress={onSubmit}
          title="Create account"
        />
      </View>

      <AuthFooterLink copy="Already have an account?" href="/(auth)/sign-in" label="Sign in" />
    </AuthShell>
  );
}
