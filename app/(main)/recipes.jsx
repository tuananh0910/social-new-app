import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import React, { useEffect, useState } from 'react'
import ScreenWapper from '../../components/ScreenWapper';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import SearchBar from "react-native-dynamic-search-bar";
import Avatar from '../../components/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import { fetchRecipes } from '../../services/recipeService'; // Thay fetchRecipes ở đây
import RecipeCard from '../../components/RecipeCard';
import Loading from '../../components/Loading';
import { supabase } from '../../lib/supabase'
import { getUserData } from '../../services/userService'

var limit = 0;

const Recipes = () => {
    const { user, setAuth } = useAuth();
    const router = useRouter();

    const [recipes, setRecipes] = useState([]);
    const [hasMore, setHasMore] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [filteredRecipes, setFilteredRecipes] = useState([]);

    const handleRecipeEvent = async (payload) => {
        if (payload.eventType === 'INSERT' && payload?.new?.id) {
            // Check if the new recipe belongs to the current user
            if (payload.new.userId === user.id) {
                let newRecipe = { ...payload.new };
                let res = await getUserData(newRecipe.userId);
                newRecipe.user = res.success ? res.data : {};
                setRecipes(prevRecipes => [newRecipe, ...prevRecipes]);
                setFilteredRecipes(prevRecipes => [newRecipe, ...prevRecipes]);
            }
        }
        if (payload.eventType === 'DELETE' && payload.old.id) {
            setRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.id !== payload.old.id));
            setFilteredRecipes(prevRecipes => prevRecipes.filter(recipe => recipe.id !== payload.old.id));
        }
        if (payload.eventType === 'UPDATE' && payload?.new?.id) {
            setRecipes(prevRecipes => prevRecipes.map(recipe =>
                recipe.id === payload.new.id ? { ...recipe, ...payload.new } : recipe
            ));
            setFilteredRecipes(prevRecipes => prevRecipes.map(recipe =>
                recipe.id === payload.new.id ? { ...recipe, ...payload.new } : recipe
            ));

            // Redirect to recipes page after the update
            router.push('recipes');
        }
    };

    useEffect(() => {
        let recipeChannel = supabase
            .channel('recipes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'recipes' }, handleRecipeEvent)
            .subscribe();

        return () => {
            supabase.removeChannel(recipeChannel);
        };
    }, []);

    const getRecipes = async () => {
        if (!hasMore) return null;
        limit = limit + 10;

        console.log('fetching post: ', limit);
        let res = await fetchRecipes(limit, user.id); // Gọi API lấy danh sách recipes
        if (res.success) {
            if (recipes.length === res.data.length) setHasMore(false);
            setRecipes(res.data);
            setFilteredRecipes(res.data);
        }
    };

    const handleSearch = (text) => {
        setSearchText(text);
        if (text) {
            const filtered = recipes.filter(recipe =>
                recipe.title.toLowerCase().includes(text.toLowerCase())
            );
            setFilteredRecipes(filtered);
        } else {
            setFilteredRecipes(recipes);
        }
    };

    useEffect(() => {
        getRecipes();
    }, []);

    return (
        <ScreenWapper bg="white">
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.contentheader}>
                        <Text style={styles.title}>Recipes</Text>
                        <View style={styles.icons}>
                            <Pressable onPress={() => router.push('newRecipe')}>
                                <MaterialCommunityIcons name="book-edit-outline" size={hp(3.8)} strokeWidth={2} color={theme.colors.text} />
                            </Pressable>
                            <Pressable onPress={() => router.push('profile')}>
                                <Avatar
                                    uri={user?.image}
                                    size={hp(4.3)}
                                    rounded={theme.radius.sm}
                                    style={{ borderWidth: 2 }}
                                />
                            </Pressable>
                        </View>
                    </View>
                    <SearchBar
                        height={50}
                        fontSize={18}
                        fontColor="#000"
                        iconColor="#000"
                        cancelIconColor="#fdfdfd"
                        placeholder="Search recipes..."
                        onChangeText={handleSearch}
                    />
                </View>

                <FlatList
                    data={filteredRecipes}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listStyle}
                    keyExtractor={item => item.id.toString()}
                    renderItem={({ item }) => <RecipeCard
                        item={item}
                        currentUser={user}
                        router={router}
                    />
                    }
                    onEndReached={() => getRecipes()}
                    onEndReachedThreshold={0.5}
                    ListFooterComponent={hasMore ? (
                        <View style={{ marginVertical: recipes.length === 0 ? 200 : 30 }}>
                            <Loading />
                        </View>
                    ) : (
                        <View style={{ marginVertical: 30 }}>
                            <Text style={styles.noRecipes}>No more recipes</Text>
                        </View>
                    )}
                />

                <View style={styles.footer}>
                    <View style={styles.fIcons}>
                        <Pressable style={styles.itemTab} onPress={() => router.push('home')}>
                            <AntDesign name="smile-circle" size={hp(3)} strokeWidth={2} color='rgba(255, 255, 255, 0.7)' />
                            <Text style={styles.titleFooter}>All Posts</Text>
                        </Pressable>
                        <Pressable style={styles.itemTab} onPress={() => router.push('recipes')}>
                            <MaterialCommunityIcons name="chef-hat" size={hp(3.3)} strokeWidth={2} color='rgba(0, 255, 255, 1)' />
                            <Text style={styles.titleFooterHL}>Recipes</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </ScreenWapper >
    )
}

export default Recipes

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        marginBottom: 10,
    },
    contentheader: {
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
    noRecipes: {
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