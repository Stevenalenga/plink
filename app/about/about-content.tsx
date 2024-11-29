'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Button } from "@/components/ui/button"

export default function AboutContent() {
    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-8"
            >
                <h2 className="text-4xl md:text-6xl font-bold text-white mb-2">About MyMaps</h2>
                <p className="text-xl text-green-100">Learn more about our mission and values</p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="w-full max-w-2xl mb-8"
            >
                <p className="text-white text-lg leading-relaxed">
                    MyMaps is dedicated to helping you discover new places and experiences. Our mission is to provide a user-friendly platform that makes it easy to explore the world around you. Whether you're looking for restaurants, hotels, attractions, or events, MyMaps has you covered.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
            >
                <Button
                    asChild
                    size="lg"
                    className="bg-white text-green-600 font-bold hover:bg-green-100 transition duration-300"
                >
                    <Link href="/contact">Contact Us</Link>
                </Button>
            </motion.div>
        </>
    )
}

