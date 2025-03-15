import { View, StyleSheet } from 'react-native'
import React, { FC } from 'react'
import CustomText from '../global/CustomText'

const BreakerText: FC<{ text: string }> = ({ text }) => {
    return (
        <View style={style.breakerContainer}>
            <View style={style.horizontalLine} />
            <CustomText
                fontSize={12}
                fontFamily='Okra-Medium'
                style={style.breakerText}
            >
                {text}
            </CustomText>
            <View style={style.horizontalLine} />

        </View>
    )
}

export default BreakerText

const style = StyleSheet.create({
    breakerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
        width: '80%'
    },
    horizontalLine: {
        flex: 1,
        height: 1,
        backgroundColor: "#ccc"
    },
    breakerText: {
        marginHorizontal: 10,
        color: '#fff',
        opacity: 0.8,
        textAlign: 'center',
    }
})