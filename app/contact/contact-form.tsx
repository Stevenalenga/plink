'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function ContactForm() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [message, setMessage] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)
        
        // Here you would typically send the form data to your backend
        // For this example, we'll simulate an API call
        try {
            await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
            setSubmitStatus('success')
        } catch (error) {
            setSubmitStatus('error')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <Label htmlFor="name" className="text-white">Name</Label>
                    <Input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded-full bg-white bg-opacity-20 text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-white"
                        placeholder="Your Name"
                    />
                </div>
                <div>
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded-full bg-white bg-opacity-20 text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-white"
                        placeholder="Your Email"
                    />
                </div>
                <div>
                    <Label htmlFor="message" className="text-white">Message</Label>
                    <Textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        className="w-full px-4 py-2 rounded-lg bg-white bg-opacity-20 text-white placeholder-red-200 focus:outline-none focus:ring-2 focus:ring-white"
                        placeholder="Your Message"
                    />
                </div>
                <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-white text-red-600 font-bold hover:bg-red-100 transition duration-300"
                >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
                {submitStatus === 'success' && (
                    <p className="text-white text-center">Thank you for your message!</p>
                )}
                {submitStatus === 'error' && (
                    <p className="text-red-200 text-center">There was an error sending your message. Please try again.</p>
                )}
            </form>
        </motion.div>
    )
}

