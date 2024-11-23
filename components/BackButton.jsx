import { Pressable, StyleSheet, Text, View } from 'react-native'
import React from 'react'
import AntDesign from '@expo/vector-icons/AntDesign';
import { theme } from '../constants/theme'

const BackButton = ({ router }) => {
    return (
        <Pressable onPress={() => router.back()} style={styles.button}>
            <AntDesign name="left" size={24} color={theme.colors.text} />
        </Pressable>
    )
}

export default BackButton

const styles = StyleSheet.create({
    button: {
        alignSelf: 'flex-start',
        padding: 5,
        borderRadius: theme.radius.sm,
        backgroundColor: 'rgba(0,0,0,0.07)'
    }
})