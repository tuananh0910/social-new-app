import { ScrollView, StyleSheet, Text, View, Alert } from 'react-native';
import { hp, wp } from '../../helpers/common';
import React, { useEffect, useState } from 'react';
import Header from '../../components/Header';
import RecipeDetailCard from '../../components/RecipeDetailCard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import Loading from '../../components/Loading';
import { fetchRecipeDetails, removeRecipe } from '../../services/recipeService';

const RecipeDetails = () => {
    const [recipe, setRecipe] = useState(null);
    const router = useRouter();
    const { user } = useAuth();
    const { recipeId } = useLocalSearchParams();
    const [startLoading, setStartLoading] = useState(true);

    const getRecipeDetails = async () => {
        let res = await fetchRecipeDetails(recipeId);
        if (res.success) setRecipe(res.data);
        setStartLoading(false);
        console.log('got recipe details: ', res);
    };

    useEffect(() => {
        getRecipeDetails();
    }, []);

    if (startLoading) {
        return (
            <View style={styles.center}>
                <Loading />
            </View>
        );
    }

    const onDeleteRecipe = async () => {
        let res = await removeRecipe(recipe.id);
        if (res.success) {
            router.back();
        } else {
            Alert.alert('Recipe', res.msg);
        }
    };

    const onEditRecipe = async (item) => {
        router.back();
        router.push({ pathname: 'newRecipe', params: { ...item } });
    };

    return (
        <View style={styles.container}>
            {startLoading ? (
                <View style={styles.center}>
                    <Loading />
                </View>
            ) : recipe ? (
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.list}>
                    <Header title="Recipe Details" />
                    <RecipeDetailCard
                        item={{ ...recipe }}
                        currentUser={user}
                        router={router}
                        hasShadow={false}
                        showDelete={true}
                        onDelete={onDeleteRecipe}
                        onEdit={onEditRecipe}
                    />
                </ScrollView>
            ) : (
                <Text style={{ textAlign: 'center', marginTop: 20 }}>Recipe not found!</Text>
            )}
        </View>
    );
};

export default RecipeDetails;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        paddingVertical: wp(10)
    },
    list: {
        paddingHorizontal: wp(4)
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});
