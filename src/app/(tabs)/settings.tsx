import images from '@/constants/images';
import { useClerk, useUser } from '@clerk/expo';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { styled } from "nativewind";
import { usePostHog } from 'posthog-react-native';
import { friendlyAuthError } from '@/lib/auth-errors';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

const SafeAreaView = styled(RNSafeAreaView);

const Settings = () => {
    const { signOut } = useClerk();
    const { isLoaded, user } = useUser();
    const posthog = usePostHog();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [savingName, setSavingName] = useState(false);
    const [savingAvatar, setSavingAvatar] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        if (!user) {
            return;
        }

        setFirstName(user.firstName || '');
        setLastName(user.lastName || '');
    }, [user]);

    const displayName = useMemo(() => {
        return user?.fullName || user?.firstName || user?.emailAddresses[0]?.emailAddress || 'User';
    }, [user]);

    const email = user?.emailAddresses[0]?.emailAddress;
    const hasNameChanges = firstName.trim() !== (user?.firstName || '') || lastName.trim() !== (user?.lastName || '');
    const canSaveName = Boolean(firstName.trim()) && hasNameChanges && !savingName;

    const readErrorMessage = (error: unknown) => {
        const fields = friendlyAuthError(error);
        return fields.form || fields.name || 'Something went wrong. Please try again.';
    };

    const handleSignOut = async () => {
        try {
            posthog.capture('user_signed_out');
            await signOut();
            posthog.reset();
            router.replace('/(auth)/sign-in');
        } catch (error) {
            console.error('Sign-out failed:', error);
        }
    };

    const handleSaveName = async () => {
        if (!user || !canSaveName) {
            return;
        }

        setSavingName(true);
        setStatusMessage('');
        setErrorMessage('');

        try {
            await user.update({
                firstName: firstName.trim(),
                lastName: lastName.trim() || undefined,
            });
            posthog.capture('profile_name_updated');
            setStatusMessage('Name updated.');
        } catch (error) {
            setErrorMessage(readErrorMessage(error));
        } finally {
            setSavingName(false);
        }
    };

    const handlePickAvatar = async () => {
        if (!user || savingAvatar) {
            return;
        }

        setSavingAvatar(true);
        setStatusMessage('');
        setErrorMessage('');

        try {
            const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (!permission.granted) {
                setErrorMessage('Photo access is needed to update your avatar.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                base64: true,
                quality: 0.85,
            });

            if (result.canceled) {
                return;
            }

            const asset = result.assets[0];
            if (!asset?.base64) {
                setErrorMessage('We could not read that image. Please choose another one.');
                return;
            }

            await user.setProfileImage({
                file: `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}`,
            });
            await user.reload();
            posthog.capture('profile_avatar_updated');
            setStatusMessage('Avatar updated.');
        } catch (error) {
            setErrorMessage(readErrorMessage(error));
        } finally {
            setSavingAvatar(false);
        }
    };

    const confirmSignOut = () => {
        Alert.alert('Sign out?', 'You can sign back in any time.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign out', style: 'destructive', onPress: handleSignOut },
        ]);
    };

    if (!isLoaded) {
        return (
            <SafeAreaView className="flex-1 items-center justify-center bg-background">
                <ActivityIndicator color="#ea7a53" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-background p-5">
            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-28">
                <Text className="mb-6 text-3xl font-sans-bold text-primary">Settings</Text>

                <View className="mb-5 rounded-3xl border border-border bg-card p-5">
                    <View className="mb-5 flex-row items-center gap-4">
                        <View>
                            <Image
                                source={user?.imageUrl ? { uri: user.imageUrl } : images.avatar}
                                className="size-20 rounded-full"
                            />
                            {savingAvatar ? (
                                <View className="absolute inset-0 items-center justify-center rounded-full bg-black/35">
                                    <ActivityIndicator color="#fff9e3" />
                                </View>
                            ) : null}
                        </View>
                        <View className="min-w-0 flex-1">
                            <Text className="text-lg font-sans-bold text-primary">{displayName}</Text>
                            {email ? (
                                <Text className="text-sm font-sans-medium text-muted-foreground">{email}</Text>
                            ) : null}
                            <Pressable
                                className="mt-3 self-start rounded-full border border-accent/30 bg-accent/10 px-4 py-2"
                                disabled={savingAvatar}
                                onPress={handlePickAvatar}
                            >
                                <Text className="text-sm font-sans-bold text-accent">
                                    {savingAvatar ? 'Uploading...' : 'Change photo'}
                                </Text>
                            </Pressable>
                        </View>
                    </View>

                    <View className="gap-4">
                        <View className="gap-2">
                            <Text className="text-sm font-sans-semibold text-primary">First name</Text>
                            <TextInput
                                className="rounded-2xl border border-border bg-background px-4 py-4 text-base font-sans-medium text-primary"
                                onChangeText={setFirstName}
                                placeholder="Enter first name"
                                placeholderTextColor="rgba(8, 17, 38, 0.45)"
                                value={firstName}
                            />
                        </View>

                        <View className="gap-2">
                            <Text className="text-sm font-sans-semibold text-primary">Last name</Text>
                            <TextInput
                                className="rounded-2xl border border-border bg-background px-4 py-4 text-base font-sans-medium text-primary"
                                onChangeText={setLastName}
                                placeholder="Enter last name"
                                placeholderTextColor="rgba(8, 17, 38, 0.45)"
                                value={lastName}
                            />
                        </View>

                        {errorMessage ? (
                            <Text className="rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-sans-semibold text-destructive">
                                {errorMessage}
                            </Text>
                        ) : null}

                        {statusMessage ? (
                            <Text className="rounded-2xl border border-success/20 bg-success/10 px-4 py-3 text-sm font-sans-semibold text-success">
                                {statusMessage}
                            </Text>
                        ) : null}

                        <Pressable
                            className={`items-center rounded-2xl py-4 ${canSaveName ? 'bg-accent' : 'bg-accent/45'}`}
                            disabled={!canSaveName}
                            onPress={handleSaveName}
                        >
                            {savingName ? (
                                <ActivityIndicator color="#081126" />
                            ) : (
                                <Text className="text-base font-sans-bold text-primary">Save name</Text>
                            )}
                        </Pressable>
                    </View>
                </View>

                <View className="mb-5 rounded-3xl border border-border bg-card p-5">
                    <Text className="mb-3 text-base font-sans-semibold text-primary">Account</Text>
                    <View className="gap-2">
                        <View className="flex-row items-center justify-between gap-3 py-2">
                            <Text className="text-sm font-sans-medium text-muted-foreground">Account ID</Text>
                            <Text className="flex-1 text-right text-sm font-sans-medium text-primary" numberOfLines={1} ellipsizeMode="tail">
                                {user?.id || 'N/A'}
                            </Text>
                        </View>
                        <View className="flex-row items-center justify-between py-2">
                            <Text className="text-sm font-sans-medium text-muted-foreground">Joined</Text>
                            <Text className="text-sm font-sans-medium text-primary">
                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                            </Text>
                        </View>
                    </View>
                </View>

                <Pressable
                    className="items-center rounded-2xl bg-destructive py-4"
                    onPress={confirmSignOut}
                >
                    <Text className="text-base font-sans-bold text-white">Sign out</Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    )
}

export default Settings;
