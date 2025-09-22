import {
    useState,
    useRef
} from 'react'

export function useCamera() {
    const [hasPermission, setHasPermission] = useState(null)
    const [stream, setStream] = useState(null)
    const videoRef = useRef(null)

    const requestCameraPermission = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment' // Use rear camera for plant photos
                }
            })
            setStream(mediaStream)
            setHasPermission(true)
            return mediaStream
        } catch (error) {
            console.error('Camera access denied:', error)
            setHasPermission(false)
            return null
        }
    }

    const capturePhoto = () => {
        if (videoRef.current) {
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')
            canvas.width = videoRef.current.videoWidth
            canvas.height = videoRef.current.videoHeight
            context.drawImage(videoRef.current, 0, 0)
            return canvas.toDataURL('image/jpeg', 0.8)
        }
        return null
    }

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop())
            setStream(null)
        }
    }

    return {
        hasPermission,
        stream,
        videoRef,
        requestCameraPermission,
        capturePhoto,
        stopCamera
    }
}