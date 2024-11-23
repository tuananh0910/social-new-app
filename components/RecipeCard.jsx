import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import React from 'react';
import { hp, wp } from '../helpers/common'; // Helper functions for responsive design
import { Image } from 'expo-image';
import { Video } from 'expo-av';
import { getSupabaseFileUrl } from '../services/imageService'; // Assuming this function gets the media URL
import Avatar from './Avatar'; // Import Avatar component
import Entypo from '@expo/vector-icons/Entypo';
import { theme } from '../constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';

const RecipeCard = ({ item, router }) => {
    const { file, title, description, type, difficulty, diets, user } = item; // Destructure user data
    const parsedDiets = diets ? (typeof diets === 'string' ? JSON.parse(diets) : diets) : [];


    if (!item) return null;

    const openRecipeDetails = () => {
        console.log("recipe Id check", item?.id);
        router.push({ pathname: 'recipeDetails', params: { recipeId: item?.id } });
    }


    return (
        <TouchableOpacity onPress={openRecipeDetails} style={styles.container}>
            <View style={styles.information}>
                <View style={styles.mediaContainer}>
                    {/* Check if file exists */}
                    {file ? (
                        file.includes('recipeImages') ? (
                            <Image
                                source={getSupabaseFileUrl(file)}
                                transition={100}
                                style={styles.media}
                                contentFit="cover"
                            />
                        ) : (
                            <Video
                                source={getSupabaseFileUrl(file)}
                                style={styles.media}
                                resizeMode="contain"
                                useNativeControls
                                isLooping
                            />
                        )
                    ) : (
                        // Display Feather icon if file is null
                        <View >
                            <Ionicons name="images-outline" size={hp(8)} color={theme.colors.darkLight} />
                        </View>
                    )}
                </View>
                <View style={styles.contentContainer}>
                    <Text
                        style={styles.title}
                        numberOfLines={1}
                        ellipsizeMode="tail" // Adds "..." at the end
                    >
                        {title}
                    </Text>
                    <View style={styles.userInfo}>
                        <Avatar
                            size={hp(2.5)} // Adjust size if necessary
                            uri={user?.image} // User avatar
                            rounded={theme.radius.md}
                        />
                        <Text style={styles.username}>{user?.name}</Text>
                    </View>
                    <View style={styles.description}>
                        <Text
                            style={styles.description}
                            numberOfLines={2}
                            ellipsizeMode="tail" // Adds "..." at the end
                        >
                            {description}
                        </Text>
                    </View>
                </View>
            </View>
            <View style={styles.details}>
                <View style={styles.items}>
                    <FontAwesome5 name="utensils" size={16} color="#777" />
                    <Text style={styles.detailText}>{type}</Text>
                </View>
                <View style={styles.items}>
                    <Entypo name="gauge" size={18} color="#777" />
                    <Text style={styles.detailText}>{difficulty}</Text>
                </View>
                {parsedDiets.slice(0, 1).map((diet, index) => (
                    <View key={index} style={styles.items}>
                        <FontAwesome5 name="carrot" size={16} color="#777" />
                        <Text style={styles.detailText}>{diet}</Text>
                    </View>
                ))}
            </View>
        </TouchableOpacity>
    );
};

export default RecipeCard;

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column',
        borderWidth: 0.5,
        borderColor: '#ccc',
        borderRadius: 10,
        padding: 10,
        marginBottom: 15,
        backgroundColor: '#fff',
        elevation: 1,
    },
    information: {
        flexDirection: 'row',
    },
    mediaContainer: {
        width: '40%',
        height: hp(12),
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'white'
    },
    media: {
        width: '100%',
        height: '100%',
        backgroundColor: theme.colors.textDark
    },
    contentContainer: {
        flex: 1,
        paddingLeft: 10,
        justifyContent: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 5, // Add some space between user info and title
        gap: 5, // Add gap between avatar and username
        marginTop: 5
    },
    username: {
        fontSize: hp(2),
        fontWeight: 'bold',
        color: '#333',
    },
    title: {
        fontSize: hp(2.7),
        fontWeight: 'bold',
        color: '#333',
    },
    description: {
        fontSize: hp(1.7),
        color: '#555',
    },
    details: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 5,
        gap: 5
    },
    htmlContainer: {
        minHeight: hp(5), // Ensure enough height for 2 lines of text
        maxHeight: hp(5), // Maximum 2 lines
        overflow: 'hidden', // Hide overflow text
        lineHeight: hp(2.5), // Set line height for consistency
    },
    items: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5
    },
    detailText: {
        fontSize: hp(1.8),
        color: '#777',
        marginRight: 8,
    },
});
