'use client'
import StoreLayout from "@/components/store/StoreLayout";
import { ImageKitContext } from 'imagekitio-next'
import { useAuth } from '@/lib/useAuth';

export default function RootAdminLayout({ children }) {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
    const { getToken } = useAuth()

    const authenticator = async () => {
        try {
            const authToken = await getToken()
            const response = await fetch('/api/imagekit-auth', {
                headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
            })
            if (!response.ok) {
                const errorText = await response.text()
                throw new Error('Request failed with status ' + response.status + ': ' + errorText)
            }
            const data = await response.json()
            const { signature, expire, token: imagekitToken } = data
            return { signature, expire, token: imagekitToken }
        } catch (error) {
            throw new Error('Authentication request failed: ' + error.message)
        }
    }

    return (
        <ImageKitContext.Provider value={{ publicKey, urlEndpoint, authenticator }}>
            <StoreLayout>
                {children}
            </StoreLayout>
        </ImageKitContext.Provider>
    );
}
