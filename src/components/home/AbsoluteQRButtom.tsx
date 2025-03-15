import { View, Text, TouchableOpacity } from 'react-native'
import React, { useState } from 'react'
import { bottomTabStyles } from '../../styles/bottomTabStyle'
import { navigate } from '../../utils/NavigationUtil'
import Icon from '../global/Icon'
import QRScannerModel from '../modals/QRScannerModel'

const AbsoluteQRButtom = () => {
    const [isVisible, setIsVisible] = useState(false)
    return (
        <>
            <View style={bottomTabStyles.container}>
                <TouchableOpacity onPress={() => navigate('RecievedFileScreen')}>
                    <Icon
                        name='apps-sharp'
                        iconFamily='Ionicons'
                        color='#333'
                        size={24}
                    />
                </TouchableOpacity>
                <TouchableOpacity
                    style={bottomTabStyles.qrCode}
                    onPress={() => setIsVisible(true)}
                >
                    <Icon
                        name='qrcode-scan'
                        iconFamily='MaterialCommunityIcons'
                        color='#fff'
                        size={26}
                    />
                </TouchableOpacity>
                <TouchableOpacity>
                    <Icon
                        name='beer-sharp'
                        iconFamily='Ionicons'
                        color='#333'
                        size={24}
                    />
                </TouchableOpacity>
            </View>

            {isVisible && <QRScannerModel visible={isVisible} onClose={() => setIsVisible(false)} />}
        </>
    )
}

export default AbsoluteQRButtom