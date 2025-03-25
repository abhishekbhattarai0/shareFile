import { produce } from 'immer'
import { Alert } from 'react-native';
import { useChunkStore } from '../db/chunkStore';
import { Buffer } from 'buffer';

export const recieveFileAck = async (
    data: any,
    socket: any,
    setRecievedFiles: any,
) => {
    const { setChunkStore, chunkStore } = useChunkStore.getState();
    if (chunkStore) {
        Alert.alert("There are files which need to be recieved ")
        return
    }

    setRecievedFiles((prevData: any) =>
        produce(prevData, (draft: any) => {
            draft.push(data)
        })
    )

    setChunkStore({
        id: data?.id,
        totalChunk: data?.totalChunk,
        name: data?.name,
        size: data?.size,
        mimeType: data?.mimeType,
        chunkArray: []
    })

    if (!socket) {
        console.log("Socket not available")
        return
    }

    try {
        await new Promise((resolve) => setTimeout(resolve, 10))
        console.log("FILE RECIEVED")
        socket.write(JSON.stringify({ event: 'send_chunk_ack', chunkNo: 0 }))
        console.log("REQUESTED FOR FIRST CHUNK")
    } catch (error) {
        console.log('Error sending file:', error)
    }
};

export const sendChunkAck = async (
    chunkIndex: any,
    socket: any,
    setTotalSentBytes: any,
    setSentFiles: any
) => {
    const { currentChunkSet, resetCurrentChunkSet } = useChunkStore.getState()

    if (!currentChunkSet) {
        Alert.alert('There are no chunks to be sent');
        return;
    }

    if (!socket) {
        console.error('Socket not available');
        return;
    }

    const totalChunk = currentChunkSet?.totalChunks;

    try {
        await new Promise((resolve) => setTimeout(resolve, 10));
        socket.write(
            JSON.stringify({
                event: 'recieve_chunk_ack',
                chunk: currentChunkSet.chunkArray[chunkIndex].toString('base64'),
                chunkNo: chunkIndex
            })
        )

        setTotalSentBytes((prev: number) => prev + currentChunkSet.chunkArray[chunkIndex]?.length)

        if (chunkIndex + 2 > totalChunk) {
            console.log('ALL CHUNK SENT SUCCESSFULLY')
            setSentFiles((prevFiles: any) =>
                produce(prevFiles, (draftFiles: any) => {
                    const fileIndex = draftFiles?.findIndex((f: any) => f.id === currentChunkSet.id)
                    if (fileIndex !== -1) {
                        draftFiles[fileIndex].available = true
                    }
                })
            )

            resetCurrentChunkSet()
        }
    } catch (error) {
        console.log("error :", error)
    }
};


export const recieveChunkAck = async (
    chunk: any,
    chunkNo: any,
    socket: any,
    setTotalRecievedBytes: any,
    generateFile: any
) => {
    const { chunkStore, resetChunkStore, setChunkStore } = useChunkStore.getState()

    if (!chunkStore) {
        console.log('Chunk store is null')
        return
    }

    try {
        const bufferChunk = Buffer.from(chunk, 'base64')
        const updatedChunkArray = [...(chunkStore.chunkArray || [])]
        updatedChunkArray[chunkNo] = bufferChunk;
        setChunkStore({
            ...chunkStore,
            chunkArray: updatedChunkArray
        })
        setTotalRecievedBytes((prevValue: number) => prevValue + bufferChunk.length)
    } catch (error) {
        console.log("error updating chunk", error)
    }

    if (!socket) {
        console.log("Socket not available")
        return;
    }

    if (chunkNo + 1 === chunkStore?.totalChunks) {
        console.log("All Chunks Recieved")
        generateFile()
        return;
    }

    try {
        await new Promise((resolve) => setTimeout(resolve, 10));
        console.log("REQUESTED FOR NEXT CHUNK", chunkNo + 1)
        socket.write(JSON.stringify({ event: 'send_chunk_ack', chunkNo: chunkNo }))
    } catch (error) {
        console.log('Error sending file: ', error)
    }
}