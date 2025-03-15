import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useTcp } from '../service/TCPProvider'
import LinearGradient from 'react-native-linear-gradient'
import { sendStyles } from '../styles/sendStyles'
import { SafeAreaView } from 'react-native-safe-area-context'
import QRScannerModel from '../components/modals/QRScannerModel'
import Icon from '../components/global/Icon'
import CustomText from '../components/global/CustomText'
import BreakerText from '../components/ui/BreakerText'
import LottieView from 'lottie-react-native'
import { Image } from 'react-native'
import { Colors, screenWidth } from '../utils/Constants'
import { goBack, navigate } from '../utils/NavigationUtil'
import dgram from 'react-native-udp'

const deviceName = [
    'Oppo',
    'iphone',
    'android'
]
const SendScreen = () => {
    const { connectToServer, isConnected } = useTcp();

    const [isScannerVisible, setIsScannerVisible] = useState(false);
    const [nearbyDevices, setNearbyDevices] = useState<any[]>([])

    const handleScan = (data: any) => {
        const [connectionData, deviceName] = data.replace('tcp://', '').split('|');
        const [host, port] = connectionData.split(':');
        connectToServer(host, parseInt(port, 10), deviceName);

        const listenForDevice = async () => {
            const server = dgram.createSocket({
                type: 'udp4',
                reusePort: true
            });
            const port = 57143;
            server.bind(port, () => {
                console.log("Listening for nearby devices ...")
            })

            server.on('message', (msg, info) => {
                const [connectionData, otherDevice] = msg
                    ?.toString()
                    ?.replace('tcp://', '')
                    .split("|");

                setNearbyDevices((prevDevices) => {
                    const deviceExists = prevDevices?.some(
                        device => device?.name === otherDevice
                    );
                    if (!deviceExists) {
                        const newDevice = {
                            id: `${Date.now()}_${Math.random()}`,
                            name: otherDevice,
                            image: require('../assets/icons/device.jpeg'),
                            fullAddress: msg?.toString(),
                            position: getRandomPosition(
                                150,
                                prevDevices?.map((d) => d.position),
                                50
                            ),
                            scale: new Animated.Value(0),
                        };

                        Animated.timing(newDevice.scale, {
                            toValue: 1,
                            duration: 1500,
                            easing: Easing.out(Easing.ease),
                            useNativeDriver: true
                        }).start()

                        return [...prevDevices, newDevice]
                    }
                    return prevDevices
                }
                )


            });


        }

        const getRandomPosition = (
            radius: number,
            existingPosition: { x: number, y: number }[],
            minDistance: number
        ) => {
            let position: any;
            let isOverlapping;

            do {
                const angle = Math.random() * 360;
                const distance = Math.random() * (radius - 50) + 50;
                const x = distance * Math.cos((angle + Math.PI) / 180);
                const y = distance * Math.sin((angle + Math.PI) / 180);

                position = { x, y };
                isOverlapping = existingPosition.some(pos => {
                    const dx = pos.x - position.x;
                    const dy = pos.y - position.y;
                    return Math.sqrt(dx * dx + dy * dy) < minDistance;
                })
            } while (isOverlapping);

            return position;
        }

        useEffect(() => {
            if (isConnected) {
                navigate("ConnectionScreen")
            }
        }, [isConnected])

        useEffect(() => {
            let udPServer: any;
            const setupServer = async () => {
                udPServer = await listenForDevice()
            }
            setupServer()


            return () => {
                if (udPServer) {
                    udPServer.close(() => {
                        console.log("UDP server closed")
                    })
                }
                setNearbyDevices([])
            }
        }, [])



    }
    return (
        <LinearGradient
            colors={['#FFFFFF', '#B689ED', '#A066E5']}
            style={sendStyles.container}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
        >
            <SafeAreaView />
            <View style={sendStyles.mainContainer}>
                <View style={sendStyles.infoContainer}>
                    <Icon
                        name='blur-on'
                        iconFamily='MaterialIcons'
                        color='#fff'
                        size={40}
                    />

                    <CustomText
                        fontFamily='Okra-Black'
                        color='#fff'
                        fontSize={16}
                        style={{ marginTop: 20 }}
                    >
                        Recieving from nearby devices
                    </CustomText>

                    <CustomText
                        fontFamily='Okra-Black'
                        color='#fff'
                        fontSize={16}
                        style={{ marginTop: 20, textAlign: 'center' }}
                    >
                        Ensure your device is connected to sender's hotspot network
                    </CustomText>
                    <BreakerText text='or' />

                    <TouchableOpacity
                        style={sendStyles.qrButton}
                        onPress={() => setIsScannerVisible(true)}
                    >
                        <Icon
                            name='qrcode'
                            iconFamily='MaterialCommunityIcons'
                            color={Colors.primary}
                            size={16}
                        />
                        <CustomText fontFamily='Okra-Bold' color={Colors.primary}>
                            Show QR
                        </CustomText>


                    </TouchableOpacity>
                </View>
                <View style={sendStyles.animationContainer}>
                    <View style={sendStyles.lottieContainer}>
                        <LottieView
                            style={sendStyles.lottie}
                            source={require('../assets/animations/scanner.json')}
                            autoPlay
                            loop={true}
                            hardwareAccelerationAndroid
                        />
                        {
                            nearbyDevices?.map((device) => (
                                <Animated.View
                                    key={device?.id}
                                    style={[
                                        sendStyles.deviceDot,
                                        {
                                            transform: [{ scale: device.scale }],
                                            left: screenWidth / 2.33 + device.position?.x,
                                            top: screenWidth / 2.2 + device.position?.y
                                        }
                                    ]}
                                />
                            ))

                        }
                    </View>
                    <Image
                        source={require('../assets/images/profile2.jpg')}
                        style={sendStyles.profileImage}
                    />

                </View>
                <TouchableOpacity onPress={goBack} style={sendStyles.backButton}>
                    <Icon
                        name='arrow-back'
                        iconFamily='Ionicons'
                        size={16}
                        color='#000'
                    />
                </TouchableOpacity>

            </View>
            {isScannerVisible && (
                <QRScannerModel
                    visible={isScannerVisible}
                    onClose={() => setIsScannerVisible(false)}
                />
            )}

        </LinearGradient>
    )
}

export default SendScreen