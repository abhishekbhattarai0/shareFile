import { View, Text, SafeAreaView, TouchableOpacity, FlatList, ActivityIndicator, Platform } from 'react-native'
import React, { act, FC, useEffect, useState } from 'react'
import { useTcp } from '../service/TCPProvider'
import Icon from '../components/global/Icon';
import { resetAndNavigate } from '../utils/NavigationUtil';
import { sendStyles } from '../styles/sendStyles';
import LinearGradient from 'react-native-linear-gradient';
import { connectionStyles } from '../styles/connectionStyles';
import CustomText from '../components/global/CustomText';
import Options from '../components/home/Options';
import { formatFileSize } from '../utils/libraryHelpers';
import { Colors } from '../utils/Constants';
import ReactNativeBlobUtil from 'react-native-blob-util';

const ConnectionScreen: FC = () => {
    const {
        connectedDevice,
        disconnect,
        sendFileAck,
        sentFiles,
        recievedFiles,
        totalRecievedBytes,
        totalSentBytes,
        isConnected
    } = useTcp();

    const [activeTab, setActiveTab] = useState<'SENT' | 'RECIEVED'>('SENT')

    const renderThumbnail = (mimeType: string) => {
        switch (mimeType) {
            case 'mp3':
                return <Icon name='musical-notes' size={16} color='blue' iconFamily='Ionicons' />;
                break;

            case 'mp4':
                return <Icon name='videocam' size={16} color='green' iconFamily='Ionicons' />;
                break;

            case 'jpg':
                return <Icon name='image' size={16} color='orange' iconFamily='Ionicons' />;
                break;

            case 'pdf':
                return <Icon name='document' size={16} color='red' iconFamily='Ionicons' />;
                break;

            default:
                return <Icon name='folder' size={16} color='gray' iconFamily='Ionicons' />;
                break;

        }
    };

    const onMediaPickedUp = (image: any) => {
        console.log('Picked Image: ', image)
        sendFileAck(image, 'image')
    }

    const onFilePickedUp = (image: any) => {
        console.log('Picked file: ', File)
        sendFileAck(File, 'file')
    }

    useEffect(() => {
        if (!isConnected) {
            resetAndNavigate('HomeScreen')
        }
    }, [isConnected])

    const handleTabChange = (tab: 'SENT' | 'RECIEVED') => {
        setActiveTab(tab)
    }

    const renderItem = ({ item }: any) => {
        return (
            <View style={connectionStyles.fileItem}>

                <View style={connectionStyles.fileInfoContainer}>
                    {renderThumbnail(item?.mimeType)}
                    <View style={connectionStyles.fileDetails}>

                        <CustomText fontSize={10} numberOfLines={1} fontFamily='Okra-Bold'>
                            {item?.name}
                        </CustomText>
                        <CustomText >
                            {item?.mimeType}  {formatFileSize(item.size)}
                        </CustomText>
                    </View>
                </View>

                {item?.available ? (
                    <TouchableOpacity
                        onPress={() => {
                            const normalizedPath =
                                Platform.OS === 'ios' ? `file://${item?.uri}` : item?.uri;
                            if (Platform.OS === 'ios') {
                                ReactNativeBlobUtil.ios
                                    .openDocument(normalizedPath)
                                    .then(() => console.log('File opened successfully'))
                                    .catch(err => console.error('Error Opening file:', err))
                            } else {
                                ReactNativeBlobUtil.android
                                    .actionViewIntent(normalizedPath, '*/*')
                                    .then(() => console.log('File opened Successfully'))
                                    .catch(err => console.error('Error opening file:', err));
                            }
                        }}
                        style={connectionStyles.openButton}
                    >
                        <CustomText
                            numberOfLines={1}
                            color='#fff'
                            fontFamily='Okra-Bold'
                            fontSize={11}

                        >
                            Open
                        </CustomText>
                    </TouchableOpacity>
                ) : (
                    <ActivityIndicator color={Colors.primary} size={"small"} />
                )}
            </View>
        )
    }

    return (
        <LinearGradient
            colors={['#FFFFFF', '#CDDAEE', '#8DBAFF']}
            style={sendStyles.container}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
        >
            <SafeAreaView />

            <View style={sendStyles.mainContainer}>
                <View style={connectionStyles.container}>
                    <TouchableOpacity
                        onPress={() => resetAndNavigate('HomeScreen')}
                    >
                        <Icon
                            name='arrow-back'
                            iconFamily='Ionicons'
                            size={16}
                            color='#000'
                        />
                    </TouchableOpacity>
                    <View style={connectionStyles.connectionContainer}>
                        <View style={{ width: '55%' }}>
                            <CustomText numberOfLines={1} fontFamily='Okra-Medium'>
                                Connected with
                            </CustomText>
                            <CustomText numberOfLines={1} fontFamily='Okra-Medium' >
                                {connectedDevice || 'Unknown'}
                            </CustomText>
                            <TouchableOpacity
                                onPress={() => disconnect()}
                                style={connectionStyles.disconnectButton}
                            >
                                <Icon
                                    name='remove-circle'
                                    iconFamily='Ionicons'
                                    size={16}
                                    color='red'
                                />
                                <CustomText numberOfLines={1} fontFamily='Okra-Bold' fontSize={10} >
                                    Disconnect
                                </CustomText>
                            </TouchableOpacity>
                        </View>
                    </View>

                    <Options
                        onFilePickedUp={onFilePickedUp}
                        onMediaPickedUp={onMediaPickedUp}
                    />

                    <View style={connectionStyles.fileContainer}>
                        <View style={connectionStyles.sendReceiveContainer}>
                            <View style={connectionStyles.sendReceiveButtonContainer}>

                                <TouchableOpacity
                                    onPress={() => handleTabChange('SENT')}
                                    style={[
                                        connectionStyles.sendReceiveButton,
                                        activeTab === 'SENT'
                                            ? connectionStyles.activeButton
                                            : connectionStyles.inactiveButton,
                                    ]}>
                                    <Icon
                                        name='cloud-upload'
                                        iconFamily='Ionicons'
                                        size={12}
                                        color={activeTab === 'SENT' ? '#fff' : 'blue'}
                                    />
                                    <CustomText
                                        numberOfLines={1}
                                        fontFamily='Okra-Bold'
                                        fontSize={9}
                                        color={activeTab === 'SENT' ? '#fff' : '#000'}
                                    >
                                        SENT
                                    </CustomText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => handleTabChange('RECIEVED')}
                                    style={[
                                        connectionStyles.sendReceiveButton,
                                        activeTab === 'RECIEVED'
                                            ? connectionStyles.activeButton
                                            : connectionStyles.inactiveButton,
                                    ]}>
                                    <Icon
                                        name='cloud-upload'
                                        iconFamily='Ionicons'
                                        size={12}
                                        color={activeTab === 'RECIEVED' ? '#fff' : 'blue'}
                                    />
                                    <CustomText
                                        numberOfLines={1}
                                        fontFamily='Okra-Bold'
                                        fontSize={9}
                                        color={activeTab === 'RECIEVED' ? '#fff' : '#000'}
                                    >
                                        RECIEVED
                                    </CustomText>
                                </TouchableOpacity>
                            </View>

                            <View style={connectionStyles.sendReceiveDataContainer}>
                                <CustomText fontFamily='Okra-Bold' fontSize={9}>
                                    {formatFileSize(
                                        (activeTab === 'SENT'
                                            ? totalSentBytes
                                            : totalRecievedBytes || 0
                                        )
                                    )}
                                </CustomText>
                                <CustomText fontFamily='Okra-Bold' fontSize={9}>
                                    /
                                </CustomText>

                                <CustomText fontFamily='Okra-Bold' fontSize={10}>
                                    {activeTab === 'SENT'
                                        ? formatFileSize(
                                            sentFiles?.reduce(
                                                (total: number, file: any) => total + file.size,
                                                0
                                            ),
                                        )
                                        : formatFileSize(
                                            recievedFiles?.reduce(
                                                (total: number, file: any) => total + file.size,
                                                0
                                            ),
                                        )}
                                </CustomText>

                            </View>
                        </View>

                        {(activeTab === 'SENT'
                            ? sentFiles?.length
                            : recievedFiles.length
                        ) > 0 ? (
                            <FlatList
                                data={activeTab === 'SENT' ? sentFiles : recievedFiles}
                                keyExtractor={item => item.id.toString()}
                                renderItem={renderItem}
                                contentContainerStyle={connectionStyles.fileList}
                            />
                        ) : (
                            <View style={connectionStyles.noDataContainer}>
                                <CustomText
                                    numberOfLines={1}
                                    fontFamily='Okra-Medium'
                                    fontSize={11}
                                >
                                    {activeTab === 'SENT'
                                        ? 'No files sent yet.'
                                        : 'No files recieved yet.'
                                    }
                                </CustomText>
                            </View>
                        )}

                    </View>


                </View>
            </View>

        </LinearGradient>
    )
}

export default ConnectionScreen