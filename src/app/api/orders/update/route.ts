import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doc, updateDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing order ID" },
        { status: 400 }
      );
    }

    if (!status || typeof status !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing or invalid status" },
        { status: 400 }
      );
    }

    const orderRef = doc(db, 'orders', id);
    await updateDoc(orderRef, {
      status,
      updatedAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
    });
  } catch (error: any) {
    console.error('Update order error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}