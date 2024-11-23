import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWapper from '../../components/ScreenWapper'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import AntDesign from '@expo/vector-icons/AntDesign';
import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router'
import Avatar from '../../components/Avatar'
import { fetchPosts } from '../../services/postService'
import PostCard from '../../components/PostCard'
import Loading from '../../components/Loading'
import { getUserData } from '../../services/userService'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Fontisto from '@expo/vector-icons/Fontisto';
import { fetchRecipes } from '../../services/recipeService'

var limit = 0;

const Home = () => {
    const { user, setAuth } = useAuth();
    const router = useRouter();

    const [posts, setPosts] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [notificationCount, setNotificationCount] = useState(0);

    const handlePostEvent = async (payload) => {
        // console.log('payload: ', payload);
        if (payload.eventType == 'INSERT' && payload?.new?.id) {
            let newPost = { ...payload.new };
            let res = await getUserData(newPost.userId);
            newPost.postLikes = [];
            newPost.comments = [{ count: 0 }];
            newPost.user = res.success ? res.data : {};
            setPosts(prevPosts => [newPost, ...prevPosts]);
        }
        if (payload.eventType == 'DELETE' && payload.old.id) {
            setPosts(prevPosts => {
                let updatedPosts = prevPosts.filter(post => post.id != payload.old.id);
                return updatedPosts;
            })
        }
        if (payload.eventType === 'UPDATE' && payload?.new?.id) {
            setPosts(async (prevPosts) => {
                const updatedPosts = await Promise.all(prevPosts.map(async (post) => {
                    if (post.id === payload.new.id) {
                        post.body = payload.new.body;
                        post.file = payload.new.file;

                        // Cập nhật recipeId và dữ liệu recipe nếu recipeId thay đổi
                        if (post.recipeId !== payload.new.recipeId) {
                            post.recipeId = payload.new.recipeId;

                            // Sử dụng await để lấy dữ liệu recipe mới
                            const recipeDataResponse = await fetchRecipes(post.recipeId);
                            if (recipeDataResponse.success) {
                                post.recipeData = recipeDataResponse.data;
                            }
                        }
                    }
                    return post;
                }));

                return updatedPosts;
            });
        }

    }

    const handleNewNotification = async (payload) => {
        console.log('got new notification: ', payload);
        if (payload.eventType == 'INSERT' && payload.new.id) {
            setNotificationCount(prev => prev + 1);
        }
    }

    useEffect(() => {
        let postChannel = supabase
            .channel('posts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, handlePostEvent)
            .subscribe();

        // getPosts();

        let notificationChannel = supabase
            .channel('notifications')
            .on('postgres_changes', {
                event: 'INSERT', schema: 'public', table: 'notifications',
                filter: `receiverId=eq.${user.id}`
            }, handleNewNotification)
            .subscribe();

        return () => {
            supabase.removeChannel(postChannel);
            supabase.removeChannel(notificationChannel);
        }
    }, [])

    const getPosts = async () => {
        if (!hasMore) return null;
        limit = limit + 10;

        console.log('fetching post: ', limit);
        let res = await fetchPosts(limit);
        if (res.success) {
            if (posts.length == res.data.length) setHasMore(false);
            setPosts(res.data);
        }
    }

    // console.log("user: ", user);

    // const onLogout = async () => {
    //     // setAuth(null);
    //     const { error } = await supabase.auth.signOut();
    //     if (error) {
    //         Alert.alert('Sign out', "Error signing out!");
    //     }
    // }
    return (
        <ScreenWapper bg="white">
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>All Posts</Text>
                    <View style={styles.icons}>
                        <Pressable onPress={() => {
                            router.push('notifications');
                            setNotificationCount(0);
                        }}>
                            <Fontisto name="bell" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} />
                            {
                                notificationCount > 0 && (
                                    <View style={styles.pill}>
                                        <Text style={styles.pillText}>{notificationCount}</Text>
                                    </View>
                                )
                            }
                        </Pressable>
                        <Pressable onPress={() => router.push('newPost')}>
                            <Feather name="plus-square" size={hp(3.8)} strokeWidth={2} color={theme.colors.text} />
                        </Pressable>
                        <Pressable onPress={() => router.push('profile')}>
                            {/* <FontAwesome5 name="user" size={hp(3.2)} strokeWidth={2} color={theme.colors.text} /> */}
                            <Avatar
                                uri={user?.image}
                                size={hp(4.3)}
                                rounded={theme.radius.sm}
                                style={{ borderWidth: 2 }}
                            />
                        </Pressable>
                    </View>
                </View>

                <FlatList
                    data={posts}
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
                        <View style={{ marginVertical: posts.length == 0 ? 200 : 30 }}>
                            <Loading />
                        </View>
                    ) : (
                        <View style={{ marginVertical: 30 }}>
                            <Text style={styles.noPosts}>No more posts</Text>
                        </View>
                    )}
                />

                <View style={styles.footer}>
                    <View style={styles.fIcons}>
                        <Pressable style={styles.itemTab} onPress={() => router.push('home')}>
                            <AntDesign name="smile-circle" size={hp(3)} strokeWidth={2} color='rgba(0, 255, 255, 1)' />
                            <Text style={styles.titleFooterHL}>All Posts</Text>
                        </Pressable>
                        <Pressable style={styles.itemTab} onPress={() => router.push('recipes')}>
                            <MaterialCommunityIcons name="chef-hat" size={hp(3.3)} strokeWidth={2} color='rgba(255, 255, 255, 0.7)' />
                            <Text style={styles.titleFooter}>Recipes</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
            {/* <Button title="logout" onPress={onLogout} /> */}
        </ScreenWapper >
    )
}

export default Home

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        marginHorizontal: wp(4)
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: 100
    },
    itemTab: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        color: theme.colors.text,
        fontSize: hp(3.2),
        fontWeight: theme.fonts.bold
    },
    avatarImage: {
        height: hp(4.3),
        width: hp(4.3),
        borderRadius: theme.radius.sm,
        borderCurve: 'continuous',
        borderColor: theme.colors.gray,
        borderWidth: 3
    },
    icons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 18
    },
    fIcons: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingLeft: 35,
        paddingRight: 35,
        paddingTop: 10,
        paddingBottom: 10,
        gap: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        borderRadius: 35,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowRadius: 10,
        shadowOpacity: 0.1,
        elevation: 5
    },
    titleFooterHL: {
        color: 'rgba(0, 255, 255, 1)',
        fontSize: hp(1.5),
        fontWeight: theme.fonts.medium,
        marginTop: 3
    },
    titleFooter: {
        color: 'rgba(255, 255, 255, 0.7)',
        fontSize: hp(1.5),
        fontWeight: theme.fonts.medium,
        marginTop: 3
    },
    listStyle: {
        paddingTop: 20,
        paddingHorizontal: wp(4)
    },
    noPosts: {
        fontSize: hp(2.3),
        textAlign: 'center',
        color: theme.colors.text
    },
    pill: {
        position: 'absolute',
        right: -10,
        top: -4,
        height: hp(2.2),
        width: hp(2.2),
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
        backgroundColor: theme.colors.roseLight
    },
    pillText: {
        color: 'white',
        fontSize: hp(1.2),
        fontWeight: theme.fonts.bold
    }
})