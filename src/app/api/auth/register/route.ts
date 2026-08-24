import { NextResponse } from 'next/server';

export async function POST(request: Request){

    try {
        const { firstName, lastName, email, password, confirmPassword } = await request.json();

        if (!firstName || !lastName || !email || !password || !confirmPassword) {
            return NextResponse.json(
                { message: 'Missing required fields '},
                { status: 400 }
            );
        }


    if (password !== confirmPassword) {
        return NextResponse.json(
            { message: 'Passwords do not match '},
        { status: 400 }
        )
    }
    return NextResponse.json(
        { success: true, message: 'Account created successfully '},
        { status: 201}
    );
} catch (error) {
    return NextResponse.json(
        { message: 'Internal Server Error'},
    )
}
}
