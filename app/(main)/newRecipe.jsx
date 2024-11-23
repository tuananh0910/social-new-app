import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, Pressable, Alert, TextInput } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import ScreenWrapper from '../../components/ScreenWapper';
import { hp, wp } from '../../helpers/common';
import { theme } from '../../constants/theme';
import Header from '../../components/Header';
import Avatar from '../../components/Avatar';
import { useAuth } from '../../contexts/AuthContext';
import RichTextEditor from '../../components/RichTextEditor';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import Button from '../../components/Button';
import * as ImagePicker from 'expo-image-picker';
import { getSupabaseFileUrl } from '../../services/imageService';
import { Video } from 'expo-av';
import { createOrUpdateRecipe } from '../../services/recipeService'; // New recipe service
import AntDesign from '@expo/vector-icons/AntDesign';
import { Dropdown, MultiSelect } from 'react-native-element-dropdown';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';


const NewRecipe = () => {

    const recipe = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [timePrep, setTimePrep] = useState('');
    const [timePrepUnit, setTimePrepUnit] = useState('');
    const [timeCook, setTimeCook] = useState('');
    const [timeCookUnit, setTimeCookUnit] = useState('');
    const [type, setType] = useState('');
    const [ingredients, setIngredients] = useState([]);
    const [method, setMethod] = useState('');
    const editorRef = useRef(null);
    const [ingredientQuantity, setIngredientQuantity] = useState('');
    const [ingredientUnit, setIngredientUnit] = useState('');
    const [ingredientText, setIngredientText] = useState('');
    const [difficulty, setDifficulty] = useState('');
    const [selectedDiets, setSelectedDiets] = useState([]);

    const timeUnits = [
        { label: 'Hours', value: 'hours' },
        { label: 'Minutes', value: 'mins' },
    ];

    const recipeTypes = [
        { label: 'Afternoon tea', value: 'Afternoon tea' },
        { label: 'Breads', value: 'Breads' },
        { label: 'Breakfast', value: 'Breakfast' },
        { label: 'Buffet', value: 'Buffet' },
        { label: 'Canapes', value: 'Canapes' },
        { label: 'Condiment', value: 'Condiment' },
        { label: 'Dessert', value: 'Dessert' },
        { label: 'Dinner', value: 'Dinner' },
        { label: 'Lunch', value: 'Lunch' },
        { label: 'Main course', value: 'Main course' },
        { label: 'Side dish', value: 'Side dish' },
        { label: 'Snack', value: 'Snack' },
        { label: 'Starter', value: 'Starter' },
        { label: 'Supper', value: 'Supper' },
        { label: 'Treat', value: 'Treat' },
        { label: 'Vegetable', value: 'Vegetable' },
    ];

    const ingredientUnits = [
        { label: 'kg', value: 'kg' },
        { label: 'hg', value: 'hg' },
        { label: 'dag', value: 'dag' },
        { label: 'g', value: 'g' },
    ];

    const difficultyOptions = [
        { label: 'Easy', value: 'Easy' },
        { label: 'More effort', value: 'More effort' },
        { label: 'A challenge', value: 'A challenge' },
    ];

    const dietsOptions = [
        { label: 'Vegetarian', value: 'Vegetarian' },
        { label: 'Egg-free', value: 'Egg-free' },
        { label: 'Healthy', value: 'Healthy' },
        { label: 'Vegan', value: 'Vegan' },
        { label: 'Nut-free', value: 'Nut-free' },
        { label: 'Gluten-free', value: 'Gluten-free' },
        { label: 'Dairy-free', value: 'Dairy-free' },
        { label: 'Low sugar', value: 'Low sugar' },
        { label: 'High-fibre', value: 'High-fibre' },
        { label: 'High-protein', value: 'High-protein' },
        { label: 'Low calorie', value: 'Low calorie' },
    ];

    const isLocalFile = file => {
        if (!file) return null;
        if (typeof file == 'object') return true;

        return false;
    }

    const getFileUri = file => {
        if (!file) return null;
        if (isLocalFile(file)) {
            return file.uri;
        }

        return getSupabaseFileUrl(file)?.uri;
    }

    useEffect(() => {
        if (recipe && recipe.id) {
            // Populate recipe data if updating an existing recipe
            setTitle(recipe.title);
            setFile(recipe.file || null);
            setDescription(recipe.description);
            setTimePrep(recipe.timePrep);
            setTimePrepUnit(recipe.timePrepUnit || 'mins');
            setTimeCook(recipe.timeCook);
            setTimeCookUnit(recipe.timeCookUnit || 'mins');
            setType(recipe.type);
            setIngredients(recipe.ingredients ? JSON.parse(recipe.ingredients) : []);
            setMethod(recipe.method);
            setDifficulty(recipe.difficulty);
            setSelectedDiets(recipe.diets ? JSON.parse(recipe.diets) : []);
            setTimeout(() => {
                editorRef?.current?.setContentHTML(recipe.method);
            }, 2000);
        }
    }, []);

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

    const getFileType = file => {
        if (!file) return null;
        if (isLocalFile(file)) {
            return file.type;
        }

        if (file.includes('recipeImages')) {
            return 'image';
        }

        return 'video';
    }

    const onSubmit = async () => {
        if (!title || !description || !timePrep || !timeCook || !type || ingredients.length === 0 || !method || !difficulty || selectedDiets.length === 0) {
            Alert.alert('Recipe', "Please fill in all required fields, including difficulty and diets.");
            return;
        }

        let data = {
            title,
            file,
            description,
            timePrep,
            timePrepUnit,
            timeCook,
            timeCookUnit,
            type,
            ingredients: JSON.stringify(ingredients),
            method,
            difficulty,
            diets: JSON.stringify(selectedDiets),
            userId: user?.id,
        };

        if (recipe && recipe.id) data.id = recipe.id;

        setLoading(true);
        let res = await createOrUpdateRecipe(data);
        setLoading(false);
        console.log('recipe res: ', res);
        if (res.success) {
            resetForm();  // Reset lại form
            router.back();
        } else {
            Alert.alert('Recipe', res.msg);
        }
    };

    const resetForm = () => {
        setTitle('');
        setFile(null);
        setDescription('');
        setTimePrep('');
        setTimePrepUnit('');
        setTimeCook('');
        setTimeCookUnit('');
        setType('');
        setIngredients([]);  // Reset lại danh sách ingredients
        setMethod('');
        setIngredientQuantity('');
        setIngredientUnit('');
        setIngredientText('');
    };


    const addIngredient = () => {
        // Kiểm tra nếu các trường bị trống hoặc ingredientUnit là "Choose"
        if (ingredientQuantity === '' || ingredientText === '') {
            Alert.alert('Error', 'Please fill all the ingredient fields, including selecting a unit.');
            return;
        }

        const newIngredient = `${ingredientQuantity} ${ingredientUnit} · ${ingredientText}`;
        setIngredients([...ingredients, newIngredient]); // Thêm nguyên liệu mới vào mảng
        setIngredientQuantity(''); // Đặt lại các trường nhập liệu
        setIngredientText('');
        setIngredientUnit(''); // Đặt lại unit về "Choose"
    };


    // Xóa Ingredient khỏi danh sách
    const removeIngredient = (index) => {
        const updatedIngredients = [...ingredients];
        updatedIngredients.splice(index, 1);
        setIngredients(updatedIngredients); // Cập nhật lại danh sách ingredient
    };

    const handleTimeInput = (value, unit, setter) => {
        if (value === '') {
            // If the value is empty, set the state back to an empty string
            setter('');
            return;
        }

        let numericValue = parseInt(value, 10); // Convert the value to a number

        if (isNaN(numericValue)) {
            return; // Do not set the state if the value is not a valid number
        }

        if (unit === 'mins') {
            // For minutes and seconds, restrict the value between 1 and 59
            numericValue = Math.max(1, Math.min(numericValue, 59)); // Limit value between 1 and 59
        } else if (unit === 'hours') {
            // For hours, restrict the value between 1 and 24
            numericValue = Math.max(1, Math.min(numericValue, 23)); // Limit value between 1 and 24
        }

        setter(numericValue.toString()); // Set the validated value back to the state
    };

    return (
        <ScreenWrapper bg="white">
            <View style={styles.container}>
                <Header title={recipe && recipe.id ? "Update Recipe" : "Create Recipe"} />
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
                                Private
                            </Text>
                        </View>
                    </View>

                    {/* Recipe Title Input */}
                    <View>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            value={title}
                            onChangeText={setTitle}
                            placeholder="Enter recipe title"
                        />
                    </View>

                    <View>
                        <Text style={styles.label}>Difficulty</Text>
                        <Dropdown
                            style={styles.dropdownDifficulty}
                            data={difficultyOptions}
                            labelField="label"
                            valueField="value"
                            placeholder="Select difficulty"
                            value={difficulty}
                            onChange={item => setDifficulty(item.value)}
                        />
                    </View>

                    <View>
                        <Text style={styles.label}>Diets</Text>
                        <MultiSelect
                            style={styles.multiSelectDiets}
                            placeholderStyle={styles.placeholderStyle}
                            selectedTextStyle={styles.selectedTextStyle}
                            inputSearchStyle={styles.inputSearchStyle}
                            iconStyle={styles.iconStyle}
                            data={dietsOptions}
                            labelField="label"
                            valueField="value"
                            placeholder="Select diets"
                            value={selectedDiets}
                            search
                            searchPlaceholder="Search diets..."
                            onChange={item => setSelectedDiets(item)}
                            renderSelectedItem={(item, unSelect) => (
                                <TouchableOpacity onPress={() => unSelect && unSelect(item)}>
                                    <View style={styles.selectedStyle}>
                                        <Text style={styles.textSelectedStyle}>{item.label}</Text>
                                        <MaterialCommunityIcons color={theme.colors.rose} name="delete-outline" size={22} />
                                    </View>
                                </TouchableOpacity>
                            )}
                        />
                    </View>


                    {/* Description (Rich Text Editor) */}
                    <View>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={[styles.input, { height: hp(8 * 2.5), textAlignVertical: 'top' }]} // Assuming hp(2.5) is the line height, adjust accordingly
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Enter recipe description"
                            multiline={true}
                            numberOfLines={8}
                            scrollEnabled={true}
                        />
                    </View>

                    {/* Time Preparation */}
                    <View>
                        <Text style={styles.label}>Preparation Time</Text>
                        <View style={styles.row}>
                            <TextInput
                                style={styles.timeInput}
                                value={timePrep}
                                onChangeText={(value) => handleTimeInput(value, timePrepUnit, setTimePrep)}
                                placeholder="Time"
                                keyboardType="numeric"
                                editable={!!timePrepUnit}
                            />
                            <Dropdown
                                style={styles.dropdownTime}
                                data={timeUnits}
                                labelField="label"
                                valueField="value"
                                placeholder="--"
                                value={timePrepUnit}
                                onChange={(item) => setTimePrepUnit(item.value)}
                            />
                        </View>
                    </View>

                    {/* Time Cooking */}
                    <View>
                        <Text style={styles.label}>Cooking Time</Text>
                        <View style={styles.row}>
                            <TextInput
                                style={styles.timeInput}
                                value={timeCook}
                                onChangeText={(value) => handleTimeInput(value, timeCookUnit, setTimeCook)}
                                placeholder="Time"
                                keyboardType="numeric"
                                editable={!!timeCookUnit}
                            />
                            <Dropdown
                                style={styles.dropdownTime}
                                data={timeUnits}
                                labelField="label"
                                valueField="value"
                                placeholder="--"
                                value={timeCookUnit}
                                onChange={(item) => setTimeCookUnit(item.value)}
                            />
                        </View>
                    </View>

                    {/* Recipe Type */}
                    <View>
                        <Text style={styles.label}>Type</Text>
                        <View style={styles.pickerContainerType}>
                            <Dropdown
                                style={styles.dropdownType}
                                data={recipeTypes}
                                search
                                searchPlaceholder="Search..."
                                labelField="label"
                                valueField="value"
                                placeholder="Please select a type"
                                value={type}
                                onChange={(item) => setType(item.value)}
                            />
                        </View>
                    </View>

                    {/* Ingredients */}
                    <View>
                        <Text style={styles.label}>Ingredients</Text>

                        <View style={styles.row}>
                            <TextInput
                                style={styles.quatityInput}
                                value={ingredientQuantity}
                                onChangeText={setIngredientQuantity}
                                placeholder="Enter quantity"
                                keyboardType="numeric"
                            />
                            <Dropdown
                                style={styles.dropdownWeight}
                                data={ingredientUnits}
                                labelField="label"
                                valueField="value"
                                placeholder="--"
                                value={ingredientUnit}
                                onChange={(item) => setIngredientUnit(item.value)}
                            />
                        </View>

                        <View marginTop={10}>
                            <View style={styles.row}>
                                <TextInput
                                    style={styles.ingredientInput}
                                    value={ingredientText}
                                    onChangeText={setIngredientText}
                                    placeholder="Enter ingredient name"
                                />
                                <TouchableOpacity onPress={addIngredient}>
                                    <AntDesign name="pluscircle" size={50} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Hiển thị danh sách ingredient */}
                        <View style={styles.ingredientList}>
                            <Text style={styles.labelingredientList}>List Ingredients</Text>
                            {ingredients.map((ingredient, index) => (
                                <View key={index} style={styles.ingredientItem}>
                                    <Text style={styles.ingredientTextList}>{ingredient}</Text>
                                    <TouchableOpacity onPress={() => removeIngredient(index)}>
                                        <Feather name="trash-2" size={20} color="red" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>

                    </View>

                    {/* File upload (Image/Video) */}

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
                        <Text style={styles.addImageText}>Add Image/Video</Text>
                        <View style={styles.mediaIcons}>
                            <TouchableOpacity onPress={() => onPick(true)}>
                                <Feather name="image" size={30} color={theme.colors.dark} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => onPick(false)}>
                                <Feather name="video" size={33} color={theme.colors.dark} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View>
                        <Text style={styles.label}>Method</Text>
                        <RichTextEditor editorRef={editorRef} onChange={setMethod} />
                    </View>


                    {/* Submit Button */}
                    <Button
                        buttonStyle={{ height: hp(6.2) }}
                        title={recipe && recipe.id ? "Update Recipe" : "Post Recipe"}
                        loading={loading}
                        hasShadow={false}
                        onPress={onSubmit}
                    />
                </ScrollView>
            </View>
        </ScreenWrapper>
    );
};

export default NewRecipe;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginBottom: 30,
        paddingHorizontal: wp(4),
        gap: 15,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    label: {
        fontSize: hp(2.5),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.text,
        marginBottom: 5
    },
    addImageText: {
        fontSize: hp(2.2),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.text,
        marginTop: 5
    },
    input: {
        borderWidth: 1.5,
        padding: 12,
        paddingHorizontal: 18,
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        borderColor: theme.colors.gray,
        fontSize: hp(2),
        color: theme.colors.text,
    },
    username: {
        fontSize: hp(2.2),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.text,
    },
    publicText: {
        fontSize: hp(1.7),
        fontWeight: theme.fonts.medium,
        color: theme.colors.textLight,
    },
    textEditor: {
        marginTop: 10,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dropdownTime: {
        height: hp(6.5),
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1.5,
        padding: 12,
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        borderColor: theme.colors.gray,
    },
    dropdownType: {
        height: hp(6.5),
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1.5,
        padding: 12,
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        borderColor: theme.colors.gray,
    },
    dropdownWeight: {
        height: hp(6.5),
        width: '27%',
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1.5,
        padding: 12,
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        borderColor: theme.colors.gray,
    },
    timeInput: {
        borderWidth: 1.5,
        padding: 12,
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        borderColor: theme.colors.gray,
        fontSize: hp(2),
        width: '49%',
        textAlign: 'center',
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
        gap: 15,
    },
    file: {
        height: hp(30),
        width: '100%',
        borderRadius: theme.radius.xl,
        overflow: 'hidden',
        borderCurve: 'continuous',
        backgroundColor: theme.colors.textDark
    },
    closeIcon: {
        position: 'absolute',
        top: 10,
        right: 10,
        padding: 7,
        borderRadius: 50,
        backgroundColor: 'rgba(255,0,0,0.6)',
    },
    submitButton: {
        height: hp(6.2),
    },
    ingredientInput: {
        borderWidth: 1.5,
        padding: 12,
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        borderColor: theme.colors.gray,
        fontSize: hp(2),
        width: '83%',
        textAlign: 'center',
    },
    quatityInput: {
        borderWidth: 1.5,
        padding: 12,
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        borderColor: theme.colors.gray,
        fontSize: hp(2),
        width: '69%',
        textAlign: 'center',
    },
    ingredientList: {
        marginTop: 10,
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: theme.colors.gray,
        borderRadius: theme.radius.xl,
        padding: 10,
        marginVertical: 5,
    },
    ingredientTextList: {
        fontSize: hp(2),
        color: theme.colors.text,
    },
    labelingredientList: {
        fontSize: hp(2),
        fontWeight: theme.fonts.semibold,
        color: theme.colors.text,
        marginBottom: 5
    },
    dropdownDifficulty: {
        height: hp(6.5),
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1.5,
        padding: 12,
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        borderColor: theme.colors.gray,
    },
    multiSelectDiets: {
        height: hp(6.5),
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1.5,
        padding: 12,
        borderRadius: theme.radius.xl,
        borderCurve: 'continuous',
        borderColor: theme.colors.gray,
    },
    multiSelectItem: {
        padding: 17,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    selectedStyle: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 14,
        backgroundColor: 'white',
        marginTop: 8,
        marginRight: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
        elevation: 2,
    },
    textSelectedStyle: {
        marginRight: 5,
        fontSize: hp(2),
    },
    iconStyle: {
        width: 20,
        height: 20,
    },
    icon: {
        marginRight: 5,
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

});

