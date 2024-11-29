import { NextApiRequest, NextApiResponse } from 'next';
import { signup } from '../api/api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'POST') {
        const { username, email, password } = req.body;

        try {
            const result = await signup(username, email, password);
            res.status(200).json(result);
        } catch (error) {
            console.error('Signup API error:', error);
            res.status(500).json({ error: 'An error occurred during signup' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}