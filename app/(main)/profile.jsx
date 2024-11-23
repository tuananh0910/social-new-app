import { Alert, FlatList, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React, { useState } from 'react'
import ScreenWapper from '../../components/ScreenWapper'
import { useAuth } from '../../contexts/AuthContext'
import { router, useRouter } from 'expo-router'
import Header from '../../components/Header'
import { hp, wp } from '../../helpers/common'
import SimpleLineIcons from '@expo/vector-icons/SimpleLineIcons';
import { theme } from '../../constants/theme'
import { supabase } from '../../lib/supabase'
import Avatar from '../../components/Avatar'
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';
import { fetchPosts } from '../../services/postService'
import PostCard from '../../components/PostCard'
import Loading from '../../components/Loading'

var limit = 0;
const Profile = () => {
    const { user, setAuth } = useAuth();
    const router = useRouter();
    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);

    const onLogout = async () => {
        // setAuth(null);
        const { error } = await supabase.auth.signOut();
        if (error) {
            Alert.alert('Sign out', "Error signing out!");
        }
    }

    const getPosts = async () => {
        if (!hasMore) return null;
        limit = limit + 10;

        console.log('fetching post: ', limit);
        let res = await fetchPosts(limit, user.id);
        if (res.success) {
            if (posts.length == res.data.length) setHasMore(false);
            setPosts(res.data);
        }
    }

    const handleLogout = async () => {
        Alert.alert('Confirm', 'Are you sure you want to log out?', [
            {
                text: 'Cancel',
                onPress: () => console.log('modal cancelled'),
                style: 'cancel'
            },
            {
                text: 'Logout',
                onPress: () => onLogout(),
                style: 'destructive'
            }
        ])
    }
    return (
        <ScreenWapper bg="white">
            <FlatList
                data={posts}
                ListHeaderComponent={<UserHeader user={user} router={router} handleLogout={handleLogout} />}
                ListHeaderComponentStyle={{ marginBottom: 30 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listStyle}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => <PostCard
                    item={item}
                    currentUser={user}
                    router={router}
                />
                }
                onEndReached={() => {
                    getPosts();
                    console.log('got to the end');
                }}
                onEndReachedThreshold={0}
                ListFooterComponent={hasMore ? (
                    <View style={{ marginVertical: posts.length == 0 ? 100 : 10 }}>
                        <Loading />
                    </View>
                ) : (
                    <View style={{ marginVertical: 30 }}>
                        <Text style={styles.noPosts}>No more posts</Text>
                    </View>
                )}
            />
        </ScreenWapper>
    )
}

const UserHeader = ({ user, router, handleLogout }) => {
    return (
        <View style={{ flex: 1, backgroundColor: 'white', paddingHorizontal: wp(4) }}>
            <Header title="Profile" mb={30} />
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} >
                <SimpleLineIcons name="logout" size={24} color={theme.colors.rose} />
            </TouchableOpacity>

            <View style={styles.container}>
                <View style={{ gap: 15 }}>
                    <View style={styles.avatarContainer}>
                        <Avatar
                            uri={user?.image}
                            size={hp(12)}
                            rounded={theme.radius.xxl * 1.4}
                        />
                        <Pressable style={styles.editIcon} onPress={() => router.push('editProfile')}>
                            <Feather name="edit-3" size={20} strokeWidth={2.5} />
                        </Pressable>
                    </View>

                    <View style={{ alignItems: 'center', gap: 4 }}>
                        <Text style={styles.userName}>{user && user.name}</Text>
                        <Text style={styles.infoText}>{user && user.address}</Text>
                    </View>

                    <View style={{ gap: 10 }}>
                        <View style={styles.info}>
                            <Ionicons name="mail-outline" size={20} color={theme.colors.textLight} />
                            <Text style={styles.infoText}>
                                {user && user.email}
                            </Text>
                        </View>
                        {
                            user && user.phoneNumber && (
                                <View style={styles.info}>
                                    <Ionicons name="call-outline" size={20} color={theme.colors.textLight} />
                                    <Text style={styles.infoText}>
                                        {user && user.phoneNumber}
                                    </Text>
                                </View>
                            )
                        }
                        {
                            user && user.bio && (
                                <Text style={styles.infoText}>{user.bio}</Text>
                            )
                        }
                    </View>
                </View>
            </View>
        </View>
    )
}

export default Profile

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        marginHorizontal: wp(4),
        marginBottom: 20
    },
    headerShape: {
        width: wp(100),
        height: hp(20)
    },
    avatarContainer: {
        height: hp(12),
        width: hp(12),
        alignSelf: 'center'
    },
    editIcon: {
        position: 'absolute',
        bottom: 0,
        right: -12,
        padding: 7,
        borderRadius: 50,
        backgroundColor: 'white',
        shadowColor: theme.colors.textLight,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 7
    },
    userName: {
        fontSize: hp(3),
        fontWeight: '500',
        color: theme.colors.textDark
    },
    info: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    infoText: {
        fontSize: hp(1.6),
        fontWeight: '500',
        color: theme.colors.textLight
    },
    logoutButton: {
        position: 'absolute',
        right: 10,
        padding: 5,
        borderRadius: theme.radius.sm,
        backgroundColor: '#fee2e2'
    },
    listStyle: {
        paddingHorizontal: wp(4),
        paddingBottom: 30
    },
    noPosts: {
        fontSize: hp(2),
        textAlign: 'center',
        color: theme.colors.text
    }
})