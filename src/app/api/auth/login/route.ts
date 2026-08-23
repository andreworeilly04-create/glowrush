import { NextResponse } from 'next/server';

export async function POST(request: Request){
    try {
        const { email, password} = await request.json();

        if (!email || !password){
            return NextResponse.json(
                { message: 'Missing email or password'},
                {status: 400}
            );
        }

        return NextResponse.json(
            { success: true, message: 'Logged in successfully'},
            {status:200}
        )
    } catch (error) {
        return NextResponse.json(
            { message: 'Internal Server Error'},
        )
    }
}