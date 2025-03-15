import { View, Text, Platform, SafeAreaView, ActivityIndicator, TouchableOpacity, FlatList } from 'react-native'
import React, { useEffect, useState } from 'react'
import RNFS, { exists } from 'react-native-fs'
import Icon from '../components/global/Icon';
import LinearGradient from 'react-native-linear-gradient';
import { sendStyles } from '../styles/sendStyles';
import CustomText from '../components/global/CustomText';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { connectionStyles } from '../styles/connectionStyles';
import { formatFileSize } from '../utils/libraryHelpers';
import ReactNativeBlobUtil from 'react-native-blob-util'
import { goBack } from '../utils/NavigationUtil';

const RecievedFileScreen = () => {
    const [recievedFiles, setRecievedFiles] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const getFilesFromDirectory = async () => {

        setIsLoading(true);
        const platformPath =
            Platform.OS === 'android'
                ? `${RNFS.DownloadDirectoryPath}/`
                : `${RNFS.DocumentDirectoryPath}`;

        try {
            const exists = await RNFS.exists(platformPath);
            if (!exists) {
                setRecievedFiles([]);
                setIsLoading(false);
                return;
            }

            const files = await RNFS.readDir(platformPath);

            const formattedFiles = files.map(file => ({
                id: file.name,
                name: file.name,
                size: file.size,
                uri: file.path,
                mimeType: file.name.split('.').pop() || 'unknown'
            }));

            setRecievedFiles(formattedFiles);
        } catch (error) {
            console.error('Error fetching files:', error);
            setRecievedFiles([]);
        } finally {
            setIsLoading(false)
        };
    }

    useEffect(() => {
        getFilesFromDirectory();
    }, [])

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

    const renderItem = ({ item }: any) => (
        <View style={connectionStyles.fileItem}>
            <View style={connectionStyles.fileInfoContainer}>
                {renderThumbnail(item?.mimeType)}
                <View style={connectionStyles.fileDetails} >
                    <CustomText numberOfLines={1} fontFamily='Okra-Bold' fontSize={13} >
                        {item.name}
                    </CustomText>
                    <CustomText numberOfLines={1} fontFamily='Okra-Medium' fontSize={8}>
                        {item.mimeType} {formatFileSize(item.size)}
                    </CustomText>
                </View>
            </View>
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
        </View>
    )



    return (
        <LinearGradient
            colors={['#FFFFFF', '#CDDAEE', '#8DBAFF']}
            style={sendStyles.container}
            start={{ x: 0, y: 1 }}
            end={{ x: 0, y: 0 }}
        >
            <SafeAreaView />
            <View style={sendStyles.mainContainer}>
                <CustomText
                    fontFamily='Okra-Bold'
                    fontSize={15}
                    color='#fff'
                    style={{ textAlign: 'center', margin: 10 }}
                >
                    All Recieved Files

                    {
                        isLoading ? (
                            <ActivityIndicator size="small" color={Colors.primary} />
                        ) : recievedFiles.length > 0 ? (
                            <View style={connectionStyles.container}>
                                <FlatList
                                    data={recievedFiles}
                                    keyExtractor={item => item.id}
                                    renderItem={renderItem}
                                    contentContainerStyle={connectionStyles.fileList}
                                />
                            </View>
                        ) : (
                            <View style={connectionStyles.noDataContainer}>
                                <CustomText
                                    numberOfLines={1}
                                    fontFamily='Okra-Medium'
                                    fontSize={11}
                                    style={{ textAlign: 'center', margin: 10 }}                               >
                                    No files recieved yet.
                                </CustomText>
                            </View>
                        )
                    }
                </CustomText>
                <TouchableOpacity
                    onPress={goBack} style={sendStyles.backButton}>
                    <Icon
                        name='arrow-back'
                        iconFamily='Ionicons'
                        size={16}
                        color='#000'
                    />
                </TouchableOpacity>
            </View>
        </LinearGradient>
    )
}



export default RecievedFileScreen