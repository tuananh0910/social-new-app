import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { theme } from '../constants/theme'
import { hp, wp } from '../helpers/common'
import Avatar from './Avatar'
import moment from 'moment'
import { Image } from 'expo-image'
import { getSupabaseFileUrl } from '../services/imageService'
import Feather from '@expo/vector-icons/Feather'
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import Entypo from '@expo/vector-icons/Entypo';
import { Video } from 'expo-av';
import RenderHtml from 'react-native-render-html'

const textStyle = {
    color: theme.colors.dark,
    fontSize: hp(2)
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

const RecipeDetailCard = ({
    item = {},
    router,
    currentUser = {},
    showDelete = false,
    onDelete = () => { },
    onEdit = () => { }
}) => {
    const handleRecipeDelete = () => {
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

    const createAt = item?.created_at ? moment(item.created_at).format('MMM D') : '';

    const diets = item.diets ? JSON.parse(item.diets) : [];
    const ingredients = item.ingredients ? JSON.parse(item.ingredients) : [];

    return (
        <View style={[styles.container]}>
            {item?.user && (
                <View style={styles.header}>
                    <View style={styles.userInfo}>
                        <Avatar
                            size={hp(4.5)}
                            uri={item.user.image}
                            rounded={theme.radius.md}
                        />
                        <View style={{ gap: 2 }}>
                            <Text style={styles.username}>{item.user.name || 'Unknown'}</Text>
                            <Text style={styles.recipeTime}>{createAt}</Text>
                        </View>
                    </View>

                    {showDelete && currentUser?.id === item.userId && (
                        <View style={styles.actions}>
                            <TouchableOpacity onPress={() => onEdit(item)}>
                                <Feather name="edit-3" size={hp(2.5)} color={theme.colors.text} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={handleRecipeDelete}>
                                <MaterialIcons name="delete-outline" size={hp(3)} color={theme.colors.rose} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}

            <View style={styles.content}>
                <Text style={styles.recipeTitle}>{item.title || 'Untitled Recipe'}</Text>
                {item?.file?.includes('recipeImages') && (
                    <Image
                        source={getSupabaseFileUrl(item.file)}
                        transition={100}
                        style={styles.recipeMedia}
                        contentFit="cover"
                    />
                )}

                {item?.file?.includes('recipeVideos') && (
                    <Video
                        source={getSupabaseFileUrl(item.file)}
                        transition={100}
                        style={[styles.recipeMedia, { height: hp(30) }]}
                        resizeMode="contain"
                        useNativeControls
                        isLooping
                    />
                )}
                <View style={styles.details}>
                    <View style={styles.times}>
                        <Feather name="clock" size={hp(4.5)} color={theme.colors.primary} />
                        <View style={{ gap: 2 }}>
                            <View style={styles.itemTime}>
                                <Text style={styles.timeText}>Prep: {item.timePrep}</Text>
                                <Text style={styles.timeText}>{item.timePrepUnit}</Text>
                            </View>
                            <View style={styles.itemTime}>
                                <Text style={styles.timeText}>Cook: {item.timeCook}</Text>
                                <Text style={styles.timeText}>{item.timeCookUnit}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.typeAndDifficulty}>
                        <View style={styles.items}>
                            <FontAwesome5 name="utensils" size={hp(2)} color={theme.colors.primary} />
                            <Text style={styles.detailText}>{item.type}</Text>
                        </View>
                        <View style={styles.items}>
                            <Entypo name="gauge" size={hp(2.5)} color={theme.colors.primary} />
                            <Text style={styles.detailText}>{item.difficulty}</Text>
                        </View>
                    </View>

                    <View style={styles.diets}>
                        {diets.map((diet, index) => (
                            <View key={index} style={styles.dietItem}>
                                <FontAwesome5 name="carrot" size={hp(2)} color={theme.colors.primary} />
                                <Text style={styles.dietText}>{diet}</Text>
                            </View>
                        ))}
                    </View>
                </View>

                <Text style={styles.descriptions}>  {item.description}</Text>

                <View style={{ gap: 10 }}>
                    <Text style={styles.titleContents}>Ingredients</Text>
                    <View style={styles.ingredients}>
                        {ingredients.map((ingredient, index) => (
                            <View key={index} style={styles.ingredientContainer}>
                                <Text style={styles.ingredientText}>{ingredient}</Text>
                            </View>
                        ))}
                    </View>
                </View>


                <View style={{ gap: 10 }}>
                    <Text style={styles.titleContents}>Method</Text>
                    <View style={styles.methods}>
                        <RenderHtml
                            contentWidth={wp(100)}
                            source={{ html: item?.method }}
                            tagsStyles={tagsStyles}
                        />
                    </View>
                </View>
            </View>

        </View>
    )
}

export default RecipeDetailCard

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
    recipeTime: {
        fontSize: hp(1.4),
        color: theme.colors.textLight,
        fontWeight: theme.fonts.medium
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 18
    },
    content: {
        gap: 10,
    },
    recipeMedia: {
        height: hp(40),
        width: '100%',
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        backgroundColor: theme.colors.textDark
    },
    recipeTitle: {
        fontSize: hp(4.3),
        fontWeight: theme.fonts.extraBold,
        color: theme.colors.textDark,
        marginTop: 8,
        textAlign: 'left'
    },
    details: {
        borderRadius: 20,
        borderWidth: 1,
        borderColor: theme.colors.primary,
        padding: 10
    },
    times: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    itemTime: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        gap: 2
    },
    timeText: {
        fontSize: hp(1.7),
        fontWeight: theme.fonts.medium,
        color: theme.colors.primaryDark,
    },
    items: {
        borderRadius: 30,
        borderWidth: 2,
        borderColor: theme.colors.primary,
        overflow: 'hidden',
        flexDirection: 'row',
        alignSelf: 'flex-start',
        alignItems: 'center',
        paddingLeft: 10,
        paddingRight: 10,
        gap: 8
    },
    detailText: {
        fontSize: hp(2),
        fontWeight: theme.fonts.medium,
        color: theme.colors.primaryDark,
    },
    typeAndDifficulty: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        gap: 10
    },
    diets: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 10,
    },
    dietItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: theme.colors.lightPrimary,
    },
    dietText: {
        fontSize: hp(1.8),
        color: theme.colors.primaryDark,
        fontWeight: theme.fonts.medium,
    },
    descriptions: {
        fontSize: hp(2),
        fontWeight: theme.fonts.medium,
        color: theme.colors.textLight,
        marginBottom: 10
    },
    ingredients: {
        marginBottom: 10
    },
    titleContents: {
        fontSize: hp(3),
        color: theme.colors.textDark,
        fontWeight: theme.fonts.semibold,
    },
    ingredientText: {
        fontSize: hp(2),
        color: theme.colors.textDark,
        fontWeight: theme.fonts.regular,
    },
    methods: {
        marginLeft: 5,
    },
    ingredientContainer: {
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.textLight,
        paddingVertical: 5,
    },
})