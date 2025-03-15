import 'react-native-get-random-values'
import { createContext, FC, useCallback, useContext, useState } from "react";
import { useChunkStore } from "../db/chunkStore";
import TcpSocket from 'react-native-tcp-socket'
import DeviceInfo from "react-native-device-info";
import { Alert, Platform } from "react-native";
import RNFS from 'react-native-fs';
import { v4 as uuidv4 } from 'uuid';
import { produce } from 'immer';
import { recieveChunkAck, recieveFileAck, sendChunkAck } from './TCPUtils';

interface TCPContextType {
    server: any;
    client: any;
    isConnected: boolean;
    connectedDevice: any;
    sentFiles: any;
    recievedFiles: any;
    totalSentBytes: number;
    totalRecievedBytes: number;
    startServer: (port: number) => void;
    connectToServer: (host: string, port: number, deviceName: string) => void;
    sendMessage: (message: string | Buffer) => void;
    sendFileAck: (file: any, type: 'file' | 'image') => void;
    disconnect: () => void;
}

const TCPContext = createContext<TCPContextType | undefined>(undefined)

export const useTcp = (): TCPContextType => {
    const context = useContext(TCPContext);
    if (!context) {
        throw new Error('useTCP must be used within a TCPProvider')
    }
    return context;
}

const options = {
    keystore: require('../../tls_certs/server-keystore.p12')
}

export const TCPProvider: FC<{ children: React.ReactNode }> = ({ children }) => {

    const [server, setServer] = useState<any>(null)
    const [client, setClient] = useState<any>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectedDevice, setConnectedDevice] = useState<any>(null)
    const [serverSocket, setserverSocket] = useState<any>(null);
    const [sentFiles, setSentFiles] = useState<any>([])
    const [recievedFiles, setRecievedFiles] = useState<any>([])
    const [totalSentBytes, setTotalSentBytes] = useState<number>(0)
    const [totalRecievedBytes, setTotalRecievedBytes] = useState<number>(0)

    const { currentChunkSet, setCurrentChunkSet, setChunkStore } = useChunkStore();

    // DISCONNECT

    const disconnect = useCallback(() => {
        if (client) {
            client.destroy();
        }
        if (server) {
            server.close();
        }
        setRecievedFiles([])
        setSentFiles([])
        setCurrentChunkSet(null)
        setTotalSentBytes(0)
        setChunkStore(null)
        setIsConnected(false)
    }, [client, server])


    //START SERVER
    const startServer = useCallback((port: number) => {
        if (server) {
            console.log("Client Alredy Running")
            return;
        }

        const newServer = TcpSocket.createTLSServer(options, (socket) => {
            console.log("Client Connected: ", socket.address())

            setserverSocket(socket)
            socket.setNoDelay(true)
            socket.readableHighWaterMark = 1024 * 1024 * 1;
            socket.writableHighWaterMark = 1024 * 1024 * 1;

            socket.on('data', async (data) => {
                const parsedData = JSON.parse(data?.toString());

                if (parsedData?.event === 'connect') {
                    setIsConnected(true);
                    setConnectedDevice(parsedData?.deviceName);
                }

                if (parsedData.event === 'file_ack') {
                    recieveFileAck(parsedData?.file, socket, setRecievedFiles);
                }

                if (parsedData.event === 'send_chunk_ack') {
                    sendChunkAck(parsedData?.chunkNo, socket, setTotalSentBytes, setSentFiles)
                }

                if (parsedData.event === 'recieve_chunk_ack') {
                    recieveChunkAck(
                        parsedData?.chunk,
                        parsedData?.chunkNo,
                        socket,
                        setTotalRecievedBytes,
                        generateFile
                    )
                }
            })

            socket.on('close', () => {
                console.log("Client Disconnected")
                setRecievedFiles([])
                setSentFiles([])
                setCurrentChunkSet(null)
                setTotalRecievedBytes(0)
                setChunkStore(null)
                setIsConnected(false)
                disconnect()
            })

            socket.on('error', (error) => console.log("Socket Error:", error))
        })

        newServer.listen({ port, host: '0.0.0.0' }, () => {
            const address = newServer.address();
            console.log(`Server running on ${address?.address}: ${address?.port}`)
        })

        newServer.on('error', (err) => console.log("Server Error:", err))
        setServer(newServer)
    }, [server])

    // START CLIENT
    const connectToServer = useCallback((host: string, port: number, deviceName: string) => {
        const newClient = TcpSocket.connectTLS(
            {
                host,
                port,
                cert: true,
                ca: require('../../tls_certs/server-cert.pem'),
            },
            () => {
                setIsConnected(true);
                setConnectedDevice(deviceName);
                const myDeviceName = DeviceInfo.getDeviceNameSync();
                newClient.write(JSON.stringify({ event: 'connect', deviceName: myDeviceName }));
            },

        );

        newClient.setNoDelay(true);
        newClient.readableHighWaterMark = 1024 * 1024 * 1;
        newClient.writableHighWaterMark = 1024 * 1024 * 1;

        newClient.on('data', async data => {
            const parsedData = JSON.parse(data?.toString());

            if (parsedData.event === 'file_ack') {
                recievedFiles(parsedData?.file, newClient, setRecievedFiles);
            }

            if (parsedData.event === 'send_chunk_ack') {
                sendChunkAck(
                    parsedData?.chunkNo,
                    newClient,
                    setTotalSentBytes,
                    setSentFiles
                )
            }

            if (parsedData.event === 'recieve_chunk_ack') {
                recieveChunkAck(
                    parsedData?.chunk,
                    parsedData?.chunkNo,
                    newClient,
                    setTotalSentBytes,
                    generateFile
                )
            }
        });

        newClient.on('close', () => {
            console.log("Client Disconnected")
            setRecievedFiles([])
            setSentFiles([])
            setCurrentChunkSet(null)
            setTotalSentBytes(0)
            setChunkStore(null)
            setIsConnected(false)
            disconnect()
        })

        newClient.on('error', err => {
            console.log("Client Error:", err);
        });

        setClient(newClient);
    }, [])

    // GENERATE FILE

    const generateFile = async () => {
        const { chunkStore, resetChunkStore } = useChunkStore.getState()

        if (!chunkStore) {
            console.log("No Chunks or files to process")
            return;
        }

        if (chunkStore?.totalChunks !== chunkStore.chunkArray.length) {
            console.log("Not all chunk have been recieved")
            return;
        }

        try {
            const combinedChunks = Buffer.concat(chunkStore.chunkArray);
            const platformPath =
                Platform.OS == 'ios'
                    ? `${RNFS.DocumentDirectoryPath}`
                    : `${RNFS.DownloadDirectoryPath}`;

            const filePath = `${platformPath}/${chunkStore.name}`;

            await RNFS.writeFile(filePath, combinedChunks?.toString('base64'), 'base64');

            setRecievedFiles((prevFiles: any) =>
                produce(prevFiles, (draftFiles: any) => {
                    const fileIndex = draftFiles?.findIndex(
                        (f: any) => f.id === chunkStore.id
                    )
                    if (fileIndex !== -1) {
                        draftFiles[fileIndex] = {
                            ...draftFiles[fileIndex],
                            uri: filePath,
                            available: true
                        }
                    }
                })
            )

            console.log("File saved successfully ", filePath)
            resetChunkStore()
        } catch (error) {
            console.log('Error combining chunks or saving file:', error)
        }
    }

    // SEND MESSAGE
    const sendMessage = useCallback((message: string | Buffer) => {
        if (client) {
            client.write(JSON.stringify(message))
            console.log('Sent from client:', message);
        } else if (server) {
            serverSocket.write(JSON.stringify(message));
            console.log('Sent from server', message);
        } else {
            console.log("NO Client or Server Socket available")
        }
    }, [client, server])

    // SEND FILE ACK

    const sendFileAck = async (file: any, type: 'image' | 'file') => {
        if (currentChunkSet != null) {
            Alert.alert("Wait for current file to be sent!");
            return;
        }

        const normalizedPath = Platform.OS === 'ios' ? file?.url?.replace('file://', '') : file?.uri;
        const fileData = await RNFS.readFile(normalizedPath, 'base64')
        const buffer = Buffer.from(fileData, 'base64')
        const CHUNK_SIZE = 1024 * 8;

        let totalChunks = 0;
        let offset = 0;
        let chunkArray = [];

        while (offset < buffer.length) {
            const chunk = buffer.slice(offset, offset + CHUNK_SIZE)
            totalChunks += 1;
            chunkArray.push(chunk);
            offset += chunk.length;
        }

        const rawData = {
            id: uuidv4(),
            name: type === 'file' ? file?.name : file?.fileName,
            size: type === 'file' ? file?.size : file?.fileSize,
            mimeType: type === 'file' ? 'file' : '.jpg',
            totalChunks
        }

        setCurrentChunkSet({
            id: rawData?.id,
            chunkArray,
            totalChunks
        })

        setSentFiles((prevData: any) =>
            produce(prevData, (draft: any) => {
                draft.push({
                    ...rawData,
                    uri: file?.uri
                })
            }))

        const socket = client || serverSocket;
        if (!socket) return;

        try {
            console.log("FILE ACKNOWLEDGE DONE")
            socket.write(JSON.stringify({ event: 'file_ack', file: rawData }))
        } catch (error) {
            console.log("Error Sending File:", error)
        }
    }
    return (
        <TCPContext.Provider
            value={{
                server,
                client,
                connectedDevice,
                sentFiles,
                recievedFiles,
                totalRecievedBytes,
                totalSentBytes,
                isConnected,
                startServer,
                connectToServer,
                disconnect,
                sendMessage,
                sendFileAck,
            }}
        >
            {children}
        </TCPContext.Provider>
    )
}