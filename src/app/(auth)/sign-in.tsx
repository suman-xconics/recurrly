import { useSignIn } from "@clerk/expo";
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
import { AuthFieldErrors, friendlyAuthError, mergeFieldErrors } from "@/lib/auth-errors";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const { fetchStatus, signIn } = useSignIn();
  const posthog = usePostHog();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [needsEmailCode, setNeedsEmailCode] = useState(false);
  const [errors, setErrors] = useState<AuthFieldErrors>({});
  const [loading, setLoading] = useState(false);

  const normalizedEmail = useMemo(() => email.trim().toLowerCase(), [email]);
  const busy = loading || fetchStatus === "fetching";

  const validate = () => {
    const nextErrors: AuthFieldErrors = {};

    if (!normalizedEmail) {
      nextErrors.email = "Enter the email linked to your account.";
    } else if (!emailPattern.test(normalizedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Enter your password.";
    }

    return nextErrors;
  };

  const onSubmit = async () => {
    if (!signIn) {
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
      const result = await signIn.password({
        emailAddress: normalizedEmail,
        password,
      });

      if (result.error) {
        setErrors(friendlyAuthError(result.error));
        return;
      }

      if (signIn.status === "complete") {
        const finalizeResult = await signIn.finalize();
        if (finalizeResult.error) {
          setErrors(friendlyAuthError(finalizeResult.error));
          return;
        }
        posthog.identify(normalizedEmail, { $set: { email: normalizedEmail } });
        posthog.capture('user_signed_in', { method: 'password' });
        router.replace("/(tabs)");
        return;
      }

      if (signIn.status === "needs_second_factor" || signIn.status === "needs_client_trust") {
        const emailFactor = signIn.supportedSecondFactors.find(
          (factor) => factor.strategy === "email_code",
        );

        if (emailFactor || signIn.status === "needs_client_trust") {
          const sendResult = await signIn.mfa.sendEmailCode();
          if (sendResult.error) {
            setErrors(friendlyAuthError(sendResult.error));
            return;
          }
          setNeedsEmailCode(true);
          return;
        }
      }

      setErrors({
        form: "This account needs an extra verification step that is not enabled in this app yet.",
      });
    } catch (error) {
      setErrors(mergeFieldErrors(friendlyAuthError(error)));
    } finally {
      setLoading(false);
    }
  };

  const onVerify = async () => {
    if (!signIn) {
      return;
    }

    if (code.trim().length < 6) {
      setErrors({ code: "Enter the 6-digit code sent to your inbox." });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await signIn.mfa.verifyEmailCode({
        code: code.trim(),
      });

      if (result.error) {
        setErrors(friendlyAuthError(result.error));
        return;
      }

      if (signIn.status === "complete") {
        const finalizeResult = await signIn.finalize();
        if (finalizeResult.error) {
          setErrors(friendlyAuthError(finalizeResult.error));
          return;
        }
        posthog.identify(normalizedEmail, { $set: { email: normalizedEmail } });
        posthog.capture('user_signed_in', { method: 'mfa_email_code' });
        router.replace("/(tabs)");
        return;
      }

      setErrors({ form: "We could not finish sign in. Please try again." });
    } catch (error) {
      setErrors(friendlyAuthError(error));
    } finally {
      setLoading(false);
    }
  };

  if (needsEmailCode) {
    return (
      <AuthShell
        title="Check your email"
        subtitle={`Enter the security code sent to ${normalizedEmail}.`}
      >
        <View className="auth-form">
          <AuthField
            autoCapitalize="none"
            error={errors.code}
            keyboardType="number-pad"
            label="Security code"
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
            title="Verify and continue"
          />
          <Pressable
            className="auth-secondary-button"
            disabled={busy}
            onPress={() => setNeedsEmailCode(false)}
          >
            <Text className="auth-secondary-button-text">Use password instead</Text>
          </Pressable>
        </View>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue managing your subscriptions"
    >
      <View className="auth-form">
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
          autoComplete="password"
          error={errors.password}
          label="Password"
          onChangeText={setPassword}
          placeholder="Enter your password"
          secureTextEntry
          textContentType="password"
          value={password}
        />
        <AuthFormError message={errors.form} />
        <AuthButton
          disabled={busy || !email || !password}
          loading={busy}
          onPress={onSubmit}
          title="Sign in"
        />
      </View>

      <AuthFooterLink
        copy="New to Recurly?"
        href="/(auth)/sign-up"
        label="Create an account"
      />
    </AuthShell>
  );
}
