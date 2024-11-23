import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Pressable, Alert, useCallback } from 'react-native'
import React, { useEffect, useRef, useState } from 'react'
import ScreenWrapper from '../../components/ScreenWapper'
import { hp, wp } from '../../helpers/common'
import { theme } from '../../constants/theme'
import Header from '../../components/Header'
import Avatar from '../../components/Avatar'
import { useAuth } from '../../contexts/AuthContext'
import RichTextEditor from '../../components/RichTextEditor'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Feather from '@expo/vector-icons/Feather';
import Button from '../../components/Button'
import * as ImagePicker from 'expo-image-picker';
import { getSupabaseFileUrl } from '../../services/imageService'
import { Video } from 'expo-av'
import { createOrUpdatePost } from '../../services/postService'
import { Dropdown } from 'react-native-element-dropdown';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Image } from 'expo-image'
import RecipeShareCard from '../../components/RecipeShareCard';
import { fetchRecipes } from '../../services/recipeService'
import AntDesign from '@expo/vector-icons/AntDesign';


const NewPost = () => {

    const post = useLocalSearchParams();
    console.log('post: ', post);
    const { user } = useAuth();
    const bodyRef = useRef("");
    const editorRef = useRef(null);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(file);
    const [recipeList, setRecipeList] = useState([]);
    const [recipeId, setRecipeId] = useState(post.recipeId || null);
    const [selectedRecipe, setSelectedRecipe] = useState(null);

    const handleClean = () => {
        setRecipeId(null);
        setSelectedRecipe(null);  // Clear the selected recipe as well
    };


    useEffect(() => {
        if (post && post.id) {
            bodyRef.current = post.body;
            setFile(post.file || null);
            setRecipeId(post.recipeId ? parseInt(post.recipeId, 10) : null);

            setTimeout(() => {
                editorRef?.current?.setContentHTML(post.body);
            }, 2000);
        }
    }, []);

    useEffect(() => {
        // Tải recipeList nếu chưa có dữ liệu
        if (!recipeList.length) {
            const fetchRecipesData = async () => {
                const recipesResult = await fetchRecipes(10, user.id);
                if (recipesResult.success) {
                    console.log('Fetched recipes:', recipesResult.data); // Kiểm tra dữ liệu từ API
                    setRecipeList(recipesResult.data); // Thiết lập `recipeList` với dữ liệu từ API
                } else {
                    console.log('Error fetching recipes:', recipesResult.msg);
                }
            };
            fetchRecipesData();
        }
    }, [user.id, recipeList.length]);

    useEffect(() => {
        if (recipeId && recipeList.length) {
            const selected = recipeList.find(recipe => recipe.id === recipeId);
            setSelectedRecipe(selected || null);
        }
    }, [recipeId, recipeList]);


    useEffect(() => {
        console.log('Recipe ID:', recipeId);
        console.log('Selected Recipe:', selectedRecipe);
    }, [recipeId, selectedRecipe]);


    const onPick = async (isImage) => {
        let mediaConfig = {
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        }

        if (!isImage) {
            mediaConfig = {
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: true
            }
        }

        let result = await ImagePicker.launchImageLibraryAsync(mediaConfig);

        if (!result.canceled) {
            setFile(result.assets[0]);
        }
    }
    const isLocalFile = file => {
        if (!file) return null;
        if (typeof file == 'object') return true;

        return false;
    }

    const getFileType = file => {
        if (!file) return null;
        if (isLocalFile(file)) {
            return file.type;
        }

        if (file.includes('postImages')) {
            return 'image';
        }

        return 'video';
    }

    const getFileUri = file => {
        if (!file) return null;
        if (isLocalFile(file)) {
            return file.uri;
        }

        return getSupabaseFileUrl(file)?.uri;
    }

    const onSubmit = async () => {
        const currentBody = bodyRef.current;  // Lấy nội dung từ bodyRef trước khi submit
        if (!currentBody && !file) {
            Alert.alert('Post', "Please choose an image or add post body");
            return;
        }

        let data = {
            file,
            body: currentBody,
            userId: user?.id,
            recipeId,
        }

        if (post && post.id) data.id = post.id;

        console.log('Data to submit:', data);

        setLoading(true);
        let res = await createOrUpdatePost(data);
        setLoading(false);
        if (res.success) {
            setFile(null);
            bodyRef.current = '';
            editorRef.current?.setContentHTML('');
            router.back();
        } else {
            Alert.alert('Post', res.msg);
        }
    }

    return (
        <ScreenWrapper bg="white">
            <View style={styles.container}>
                <Header title={post && post.id ? "Update Post" : "Create Post"} />

                <ScrollView contentContainerStyle={{ gap: 20 }}>
                    <View style={styles.header}>
                        <Avatar
                            uri={user?.image}
                            size={hp(6.5)}
                            rounded={theme.radius.xl}
                        />
                        <View style={{ gap: 2 }}>
                            <Text style={styles.username}>
                                {
                                    user && user.name
                                }
                            </Text>
                            <Text style={styles.publicText}>
                                Public
                            </Text>
                        </View>
                    </View>

                    <View style={styles.textEditor}>
                        <RichTextEditor editorRef={editorRef} onChange={body => bodyRef.current = body} />
                    </View>

                    {
                        file && (
                            <View style={styles.file}>
                                {
                                    getFileType(file) == 'video' ? (
                                        <Video
                                            style={{ flex: 1 }}
                                            source={{
                                                uri: getFileUri(file)
                                            }}
                                            useNativeControls
                                            resizeMode='contain'
                                            isLooping
                                        />
                                    ) : (
                                        <Image source={{ uri: getFileUri(file) }} resizeMode='cover' style={{ flex: 1 }} />
                                    )
                                }

                                <Pressable style={styles.closeIcon} onPress={() => setFile(null)}>
                                    <Feather name="trash-2" size={20} color="white" />
                                </Pressable>
                            </View>
                        )
                    }

                    <View style={styles.media}>
                        <Text style={styles.addImageText}>Add to your post</Text>
                        <View style={styles.mediaIcons}>
                            <TouchableOpacity onPress={() => onPick(true)}>
                                <Feather name="image" size={30} color={theme.colors.dark} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onPick(false)}>
                                <Feather name="video" size={33} color={theme.colors.dark} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={{ paddingBottom: 20 }}>
                        <Text style={styles.label}>Select recipe:</Text>

                        <Dropdown
                            style={styles.multiSelectRecipes}
                            placeholderStyle={styles.placeholderStyle}
                            selectedTextStyle={styles.selectedTextStyle}
                            inputSearchStyle={styles.inputSearchStyle}
                            iconStyle={styles.iconStyle}
                            data={recipeList}
                            labelField="title"
                            valueField="id"
                            placeholder="Select recipe"
                            value={recipeId}  // Bind directly to recipeId
                            defaultValue={recipeId}  // Ensures correct display on load
                            search
                            searchPlaceholder="Search recipes..."
                            onChange={(item) => {
                                setRecipeId(item.id);
                                setSelectedRecipe(item);
                            }}
                            renderItem={(item) => (
                                <RecipeShareCard
                                    item={item}
                                    currentUser={user}
                                    router={router}
                                />
                            )}
                            renderRightIcon={() => (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    {recipeId && (
                                        <Text onPress={handleClean} style={{ marginRight: 6 }}>
                                            <AntDesign name='close' color={theme.colors.rose} />
                                        </Text>
                                    )}
                                    <AntDesign name='down' color={theme.colors.textLight} size={18} style={{ marginRight: 10 }} />
                                </View>
                            )}
                        />

                        <View style={{ marginTop: 10 }}>
                            {recipeId && selectedRecipe && (
                                <RecipeShareCard
                                    item={selectedRecipe}
                                    currentUser={user}
                                    router={router}
                                />
                            )}
                        </View>
                    </View>

                </ScrollView>
                <Button
                    buttonStyle={{ height: hp(6.2) }}
                    title={post && post.id ? "Update" : "Post"}
                    loading={loading}
                    hasShadow={false}
                    onPress={onSubmit}
                />
            </View>
        </ScreenWrapper>
    )
}

export default NewPost

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginBottom: 30,
        paddingHorizontal: wp(4),
        gap: 15,
    },
    title: {
        fontSize: hp(2.5),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.text,
        textAlign: 'center'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    username: {
        fontSize: hp(2.2),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.text
    },
    avatar: {
        height: hp(6.5),
        width: hp(6.5),
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)'
    },
    publicText: {
        fontSize: hp(1.7),
        fontWeight: theme.fonts.medium,
        color: theme.colors.textLight
    },
    textEditor: {
        //marginTop: 10
    },
    media: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderWidth: 1.5,
        padding: 12,
        paddingHorizontal: 18,
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        borderColor: theme.colors.gray
    },
    mediaIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15
    },
    addImageText: {
        fontSize: hp(2.2),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.text,
        marginTop: 5
    },
    imageIcons: {
        // backgroundColor: theme.colors.gray,
        // padding: 6,
        borderRadius: theme.radius.xl
    },
    file: {
        height: hp(30),
        width: '100%',
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
        borderCurve: 'continuous',
        backgroundColor: theme.colors.textDark
    },
    video: {

    },
    closeIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 7,
        borderRadius: 50,
        backgroundColor: 'rgba(255,0,0,0.6)',
        // shadowColor: theme.colors.textLight,
        // shadowOffset: {width: 0, height: 3},
        // shadowOpacity: 0.6,
        // shadowRadius: 8,
    },
    label: {
        fontSize: hp(2.5),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.text,
        marginBottom: 5
    },
    multiSelectRecipes: {
        height: hp(6.5),
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1.5,
        padding: 12,
        borderColor: theme.colors.gray,
    },
    selectedStyle: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        backgroundColor: 'white',
        marginTop: 8,
        marginRight: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        width: '97%',
        gap: 15
    },
    textSelectedStyle: {
        marginRight: 5,
        fontSize: hp(2),
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    placeholderStyle: {
        fontSize: hp(2),
        color: theme.colors.textLight,
    },
    selectedTextStyle: {
        fontSize: hp(2),
        color: theme.colors.text,
    },
    inputSearchStyle: {
        height: 40,
        fontSize: hp(2),
    },

})