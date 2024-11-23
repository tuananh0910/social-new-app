import { Alert, StyleSheet, Text, View, Share } from 'react-native'
import React, { useEffect, useState } from 'react'
import { theme } from '../constants/theme'
import { hp, stripHtmlTags, wp } from '../helpers/common'
import Avatar from './Avatar'
import moment from 'moment'
import { TouchableOpacity } from 'react-native'
import Entypo from '@expo/vector-icons/Entypo'
import RenderHtml from 'react-native-render-html'
import { Image } from 'expo-image'
import { getSupabaseFileUrl } from '../services/imageService'
import { Video } from 'expo-av'
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { createPostLike, removePostLike } from '../services/postService'
import Loading from './Loading'
import Feather from '@expo/vector-icons/Feather'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import RecipeCard from './RecipeCard'
import { fetchRecipeDetails } from '../services/recipeService'

const textStyle = {
    color: theme.colors.dark,
    fontSize: hp(1.75)
};
const tagsStyles = {
    div: textStyle,
    p: textStyle,
    ol: textStyle,
    h1: {
        color: theme.colors.dark
    },
    h4: {
        color: theme.colors.dark
    }
}

const PostCard = ({
    item,
    currentUser,
    router,
    hasShadow = true,
    showMoreIcon = true,
    showDelete = false,
    onDelete = () => { },
    onEdit = () => { }
}) => {
    const shadowStyles = {
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1
    }

    const [likes, setLikes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [recipeData, setRecipeData] = useState(null);

    useEffect(() => {
        setLikes(item?.postLikes || []);

        const loadRecipeDetails = async () => {
            if (item?.recipeId) {
                const recipeResponse = await fetchRecipeDetails(item.recipeId);
                if (recipeResponse.success) {
                    setRecipeData(recipeResponse.data); // Lưu toàn bộ dữ liệu recipe vào state
                } else {
                    console.log("Failed to fetch recipe details:", recipeResponse.msg);
                }
            }
        };

        loadRecipeDetails();
    }, []);

    const openPostDetails = () => {
        if (!showMoreIcon) return null;
        router.push({ pathname: 'postDetails', params: { postId: item?.id } });
        console.log(item?.id)
    }

    const onLike = async () => {
        if (liked) {
            let updatedLikes = likes.filter(like => like.userId != currentUser?.id);

            setLikes([...updatedLikes]);
            let res = await removePostLike(item?.id, currentUser?.id);
            console.log('removed like: ', res);
            if (!res.success) {
                Alert.alert('Post', 'Something went wrong!');
            }
        } else {
            let data = {
                userId: currentUser?.id,
                postId: item?.id
            }
            setLikes([...likes, data]);
            let res = await createPostLike(data);
            console.log('added like: ', res);
            if (!res.success) {
                Alert.alert('Post', 'Something went wrong!');
            }
        }

    }

    const onShare = async () => {
        try {
            let content = { message: stripHtmlTags(item?.body) }; // Stripping HTML tags from the body

            if (item?.file) {
                setLoading(true);

                // Get the file URL and download it
                const fileUrl = getSupabaseFileUrl(item?.file)?.uri;
                const fileName = fileUrl.split('/').pop(); // Extracting the file name from the URL
                const localUri = `${FileSystem.cacheDirectory}${fileName}`; // Path to save the file locally

                // Download the file
                const downloadResumable = FileSystem.createDownloadResumable(fileUrl, localUri);
                const { uri } = await downloadResumable.downloadAsync();

                setLoading(false);

                // Check if sharing is available and share the file along with the body content
                if (await Sharing.isAvailableAsync()) {
                    await Sharing.shareAsync(uri, { dialogTitle: content.message });
                } else {
                    Alert.alert('Sharing', 'Sharing is not available on your device');
                }
            } else {
                // If there is no file, share only the body content
                Share.share(content);
            }
        } catch (error) {
            console.log('Error sharing content:', error);
            setLoading(false);
        }
    };


    const handlePostDelete = () => {
        Alert.alert('Confirm', 'Are you sure you want to do this?', [
            {
                text: 'Cancel',
                onPress: () => console.log('modal cancelled'),
                style: 'cancel'
            },
            {
                text: 'Delete',
                onPress: () => onDelete(item),
                style: 'destructive'
            }
        ])
    }

    const createAt = moment(item?.created_at).format('MMM D');

    const liked = likes?.length > 0 && likes.filter(like => like.userId === currentUser?.id)[0] ? true : false;

    return (
        <View style={[styles.container, hasShadow && shadowStyles]}>
            <View style={styles.header}>
                <View style={styles.userInfo}>
                    <Avatar
                        size={hp(4.5)}
                        uri={item?.user?.image}
                        rounded={theme.radius.md}
                    />
                    <View style={{ gap: 2 }}>
                        <Text style={styles.username}>{item?.user?.name}</Text>
                        <Text style={styles.postTime}>{createAt}</Text>
                    </View>
                </View>

                {
                    showMoreIcon && (
                        <TouchableOpacity onPress={openPostDetails}>
                            <Entypo name="dots-three-horizontal" size={hp(3.4)} strokeWidth={3} color={theme.colors.text} />
                        </TouchableOpacity>
                    )
                }

                {
                    showDelete && currentUser.id == item?.userId && (
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => onEdit(item)}>
                                <Feather name="edit-3" size={hp(2.5)} color={theme.colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handlePostDelete}>
                                <MaterialIcons name="delete-outline" size={hp(3)} color={theme.colors.rose} />
                            </TouchableOpacity>
                        </View>
                    )
                }
            </View>

            <View style={styles.content}>
                <View style={styles.postBody}>
                    {
                        item?.body && (
                            <RenderHtml
                                contentWidth={wp(100)}
                                source={{ html: item?.body }}
                                tagsStyles={tagsStyles}
                            />
                        )
                    }
                </View>

                {
                    item?.file && item?.file?.includes('postImages') && (
                        <Image
                            source={getSupabaseFileUrl(item?.file)}
                            transition={100}
                            style={styles.postMedia}
                            contentFit='cover'
                        />
                    )
                }

                {
                    item?.file && item?.file?.includes('postVideos') && (
                        <Video
                            source={getSupabaseFileUrl(item?.file)}
                            transition={100}
                            style={[styles.postMedia, { height: hp(30) }]}
                            resizeMode='contain'
                            useNativeControls
                            isLooping
                        />
                    )
                }

                {item?.recipeId && recipeData && (
                    <RecipeCard
                        item={recipeData}
                        router={router}
                    />
                )}
            </View>

            <View style={styles.footer}>
                <View style={styles.footerButton}>
                    <TouchableOpacity onPress={onLike}>
                        <FontAwesome name="heart" size={24} color={liked ? theme.colors.rose : theme.colors.textLight} />
                    </TouchableOpacity>
                    <Text style={styles.count}>
                        {
                            likes?.length
                        }
                    </Text>
                </View>
                <View style={styles.footerButton}>
                    <TouchableOpacity onPress={openPostDetails}>
                        <FontAwesome name="commenting-o" size={26} color={theme.colors.textLight} />
                    </TouchableOpacity>
                    <Text style={styles.count}>
                        {
                            item?.comments[0]?.count
                        }
                    </Text>
                </View>
                <View style={styles.footerButton}>
                    {
                        loading ? (
                            <Loading size="small" />
                        ) : (
                            <TouchableOpacity onPress={onShare}>
                                <FontAwesome name="share-alt" size={22} color={theme.colors.textLight} />
                            </TouchableOpacity>
                        )
                    }
                </View>
            </View>
        </View>
    )
}

export default PostCard

const styles = StyleSheet.create({
    container: {
        gap: 10,
        marginBottom: 15,
        borderRadius: theme.radius.xxl * 1.1,
        borderCurve: 'continuous',
        padding: 10,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderWidth: 0.5,
        borderColor: theme.colors.gray,
        shadowColor: '#000'
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    username: {
        fontSize: hp(1.7),
        color: theme.colors.textDark,
        fontWeight: theme.fonts.medium
    },
    postTime: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
        fontWeight: theme.fonts.medium,
    },
    content: {
        gap: 10,
        // marginBottom: 10
    },
    postMedia: {
        height: hp(40),
        width: '100%',
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        backgroundColor: theme.colors.textDark
    },
    postBody: {
        marginLeft: 5
    },
    footer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    footerButton: {
        marginLeft: 5,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18
    },
    count: {
        color: theme.colors.text,
        fontSize: hp(1.8)
    }
})