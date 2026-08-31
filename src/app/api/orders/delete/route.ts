import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { doc, deleteDoc } from 'firebase/firestore';

export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing id" },
        { status: 400 }
      );
    }

    const orderRef = doc(db, 'orders', id);
    await deleteDoc(orderRef);

    return NextResponse.json({ success: true, message: "Order deleted successfully" });
  } catch (error: any) {
    console.error('Delete order error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
