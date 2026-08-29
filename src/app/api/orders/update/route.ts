import { NextResponse } from 'next/server';
import pool from "@/lib/db";

export async function POST(request: Request){
    try {
        const { id, status } = await request.json();
        if (!id || !status){
            return NextResponse.json({ success:false, error:"Missing id or status" }, { status: 400 });
        }
        await pool.execute(
            "UPDATE orders SET status = ? WHERE id = ?",
            [status, id]
        );
        return NextResponse.json({ success: true});

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}