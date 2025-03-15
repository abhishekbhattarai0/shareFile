import { View, Text, ScrollView, StyleSheet } from 'react-native'
import React, { FC } from 'react'
import { commonStyles } from '../styles/commonStyles'
import HomeHeader from '../components/home/HomeHeader'

import SendReceiveButton from '../components/home/SendReceiveButton'
import Options from '../components/home/Options'
import Misc from '../components/home/Misc'
import AbsoluteQRButtom from '../components/home/AbsoluteQRButtom'

const HomeScreen: FC = () => {
    return (
        <View style={commonStyles.baseContainer}>
            <HomeHeader />

            <ScrollView
                contentContainerStyle={{ paddingBottom: 100, padding: 15 }}
                showsHorizontalScrollIndicator={false}
            >
                <SendReceiveButton />
                <Options isHome />
                <Misc />
            </ScrollView>
            <AbsoluteQRButtom />
        </View>
    )
}

export default HomeScreen

