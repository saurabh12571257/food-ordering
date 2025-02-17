'use client'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/dist/server/api-utils'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { resolve } from 'path'
import { rejects } from 'assert'

export default function profilePage() {
    const session = useSession()
    const [userName, setUserName] = useState('')
    const [image, setImage] = useState('')
    const {status} = session

    useEffect(() => {
        if (status === 'authenticated') {
            setUserName(session.data.user.name)
            setImage(session.data.user.image)
        }
    }, [session, status])

    async function handleProfileUpdate(ev) {
        ev.preventDefault()
        const savePromise = new Promise(async (resolve, rejects) => {
            const response = await fetch('/api/profile', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({name:userName, image})
            })
            if(response.ok) {
                resolve()
            } else {
                rejects()
            }
        })

        await toast.promise(savePromise, {
            loading: 'Saving...',
            success: 'Profile Saved!',
            error: 'Error',
        })
    }

    async function handleFileChange(ev) {
        const files = ev.target.files;
        if (files?.length === 1) {
            const data = new FormData()
            data.append('file', files[0])
    
            const uploadPromise = new Promise(async (resolve, reject) => {
                try {
                    const controller = new AbortController(); // Abort request on timeout
                    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: data,
                        signal: controller.signal, // Attach abort controller
                    });
    
                    clearTimeout(timeoutId); // Clear timeout if request succeeds
    
                    if (!response.ok) {
                        reject(new Error('Upload failed: Server responded with error'))
                        return;
                    }
    
                    const result = await response.json();
    
                    if (!result.url) {
                        reject(new Error('Invalid response: No image URL returned'))
                        return;
                    }
    
                    setImage(result.url);
                    resolve(); // Only resolves when upload is 100% successful
                } catch (error) {
                    if (error.name === 'AbortError') {
                        reject(new Error('Upload timeout: Server took too long to respond'))
                    } else {
                        reject(error); // Ensure all errors cause rejection
                    }
                }
            })
    
            await toast.promise(uploadPromise, {
                loading: 'Uploading...',
                success: 'Uploaded!',
                error: (err) => err.message || 'Upload Unsuccessful', // Shows the actual error message
            })
        }
    }
    
    
    
    

    if(status === 'loading') {
        return 'Loading...'
    }

    if(status === 'unauthenticated') {
        return redirect('/login')
    }

    return (
        <section className='mt-8'>
            <h1 className='mb-4 text-center text-red-600 text-4xl'>
                Profile
            </h1>
            <div className='max-w-md mx-auto'>
                <div className='flex gap-4'>
                    <div>
                        <div className='p-2 rounded-lg relative max-w-[120px]'>
                            {image && (
                                <Image className='rounded-lg w-full h-full mb-1' src={image || '/default-avatar.png'}
                                    width={250} height={250} alt={'avatar'} />
                            )}
                            <label>
                                <input type='file' className='hidden' onChange={handleFileChange} />
                                <span className='block border border-gray-300 rounded-lg p-2 text-center cursor-pointer'>Edit</span>
                            </label>
                        </div>
                    </div>
                    <form className='grow' onSubmit={handleProfileUpdate}>
                        <input type='text' placeholder='First and last name' value={userName} onChange={ev => setUserName(ev.target.value)} />
                        <input type='email' disabled={true} value={session.data.user.email} />
                        <input type='tel' placeholder='Phone'/>
                        <input type='text' placeholder='Street Address'/>
                        <div className='flex gap-4'>
                             <input type='text' placeholder='City'/>
                             <input type='text' placeholder='Pin Code'/>
                        </div>
                        <input type='text' placeholder='Country'/>
                        <button type='submit'>Save</button>
                    </form>
                </div>
            </div>
        </section>
    )
}
